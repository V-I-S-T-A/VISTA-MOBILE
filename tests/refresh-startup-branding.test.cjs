const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('1. EditProfileScreen has functional pull-to-refresh with theme colors and error resilience', async () => {
  let refetched = false;
  let updatedUser = null;

  const h = createHarness({
    '../../context/AuthContext': {
      useAuth: () => ({
        user: { user_id: 'u-1', first_name: 'Isabella', last_name: 'Gonzales', role: 'student' },
        logout: () => {},
        updateUser: (u) => { updatedUser = u; },
      }),
    },
    '../../theme/layout': {
      useStaffLayout: () => ({ horizontal: { paddingHorizontal: 16 } }),
      useBottomNavClearance: () => 68,
    },
    '../../services/authService': {
      authService: {
        me: async () => ({ user_id: 'u-1', first_name: 'Isabella-Updated', last_name: 'Gonzales', role: 'student' }),
      },
    },
    '@tanstack/react-query': {
      useQuery: () => ({
        data: { user_id: 'u-1', first_name: 'Isabella', last_name: 'Gonzales' },
        isPending: false,
        refetch: async () => {
          refetched = true;
          return { data: { user_id: 'u-1', first_name: 'Isabella-Updated', last_name: 'Gonzales' } };
        },
      }),
    },
  });

  const Screen = h.load('src/screens/shared/EditProfileScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: { goBack() {}, canGoBack: () => true } }).output;

  const scrollView = nodes(tree).find(n => n.type === 'ScrollView');
  assert.ok(scrollView, 'Profile ScrollView must exist');

  const rc = scrollView.props.refreshControl;
  assert.ok(rc, 'ScrollView must have a RefreshControl');
  assert.equal(rc.type, 'RefreshControl');
  assert.equal(rc.props.colors[0], '#1a59a5', 'First color must be VISTA blue (#1a59a5)');
  assert.equal(rc.props.colors[1], '#fdc849', 'Second color must be VISTA yellow (#fdc849)');
  assert.equal(rc.props.tintColor, '#FFFFFF', 'iOS tint must be white on blue profile background');

  // Trigger onRefresh
  await rc.props.onRefresh();
  assert.equal(refetched, true, 'Calling onRefresh must trigger profile.refetch()');
});

test('2. Settings screens implement functional, non-disruptive pull-to-refresh', async () => {
  let meCalled = false;
  const h = createHarness({
    '../../context/AuthContext': {
      useAuth: () => ({
        user: { user_id: 'u-1' },
        role: 'student',
        updateUser: () => {},
      }),
    },
    '../../services/authService': {
      authService: {
        me: async () => { meCalled = true; return { user_id: 'u-1' }; },
      },
    },
    '../../lib/queryClient': {
      queryClient: { invalidateQueries: () => {} },
    },
    'expo-notifications': {
      getPermissionsAsync: async () => ({ status: 'granted', granted: true }),
    },
  });

  // SettingsScreen
  const SettingsScreen = h.load('src/screens/shared/SettingsScreen.jsx').default;
  const settingsTree = h.instance(SettingsScreen, { navigation: { goBack() {} } }).output;
  const settingsScroll = nodes(settingsTree).find(n => n.type === 'ScrollView');
  assert.ok(settingsScroll.props.refreshControl, 'SettingsScreen must have RefreshControl');
  await settingsScroll.props.refreshControl.props.onRefresh();
  assert.equal(meCalled, true, 'SettingsScreen refresh must call authService.me() to refresh session');

  // NotificationPreferencesScreen
  const NotifPrefScreen = h.load('src/screens/shared/NotificationPreferencesScreen.jsx').default;
  const notifTree = h.instance(NotifPrefScreen, { navigation: { goBack() {} } }).output;
  const notifScroll = nodes(notifTree).find(n => n.type === 'ScrollView');
  assert.ok(notifScroll.props.refreshControl, 'NotificationPreferencesScreen must have RefreshControl');

  // UserGuideScreen & LegalDocumentScreen
  const UserGuideScreen = h.load('src/screens/shared/UserGuideScreen.jsx').default;
  const guideTree = h.instance(UserGuideScreen, { navigation: { goBack() {} } }).output;
  const guideScroll = nodes(guideTree).find(n => n.type === 'ScrollView');
  assert.ok(guideScroll.props.refreshControl, 'UserGuideScreen must have RefreshControl');

  const LegalScreen = h.load('src/screens/shared/LegalDocumentScreen.jsx').default;
  const legalTree = h.instance(LegalScreen, { navigation: { goBack() {} }, route: { params: { documentType: 'privacy' } } }).output;
  const legalScroll = nodes(legalTree).find(n => n.type === 'ScrollView');
  assert.ok(legalScroll.props.refreshControl, 'LegalDocumentScreen must have RefreshControl');
});

test('3. Startup lifecycle: App.jsx and RootNavigator.jsx eliminate intermediate white screens', () => {
  const appCode = fs.readFileSync(path.resolve(__dirname, '../App.jsx'), 'utf-8').replace(/\r\n/g, '\n');
  assert.ok(
    appCode.includes('if (!fontsLoaded && !fontError) {\n     return null;\n   }') ||
    appCode.includes('if (!fontsLoaded && !fontError) return null;'),
    'App.jsx must return null while fonts load to preserve native splash without flashing VistaLoader'
  );

  const rootNavCode = fs.readFileSync(path.resolve(__dirname, '../src/navigation/RootNavigator.jsx'), 'utf-8');
  assert.ok(
    rootNavCode.includes('if (isRestoring) return null;') && !rootNavCode.includes('splashFinished'),
    'RootNavigator must hold the native splash until ready and never add a second React splash'
  );
  assert.ok(
    rootNavCode.includes("backgroundColor: '#FFFFFF'"),
    'RootNavigator container background must be #FFFFFF to match splash background'
  );
  assert.ok(
    rootNavCode.includes('NativeSplash.hideAsync()'),
    'NativeSplash.hideAsync() must be called onLayout of the resolved screen'
  );
});

test('4. Splash Screen and Login Screen branding match VISTA design standards', () => {
  const h = createHarness({
    'react-native': { ...createHarness().native, AppState: { currentState: 'active', addEventListener: () => ({remove(){}}) } },
    '../../context/AuthContext': {
      useAuth: () => ({ login: async () => {}, user: null }),
    },
  });

  // SplashScreen
  const SplashScreen = h.load('src/screens/SplashScreen.jsx').default;
  const splashTree = h.instance(SplashScreen, { error: null }).output;
  assert.ok(!nodes(splashTree).some(n => n.type === 'Text' && textOf(n) === 'VISTA'), 'Splash uses the logo without a wordmark');
  const { default: SplashBrand, SplashCredit } = h.load('src/components/common/SplashBrand.jsx');
  const brandTree = h.instance(SplashBrand, {active:false}).output;
  assert.ok(nodes(brandTree).some(n=>n.type==='Image'&&String(n.props.source).includes('vista-logo.webp')));
  const creditTree = h.instance(SplashCredit).output;
  assert.equal(textOf(creditTree),'fromP.House');

  // LoginScreen
  const LoginScreen = h.load('src/screens/auth/LoginScreen.jsx').default;
  const loginTree = h.instance(LoginScreen).output;
  const loginLogo = nodes(loginTree).find(n => n.type === 'Image' && n.props?.accessibilityLabel === 'VISTA Logo');
  assert.ok(loginLogo, 'Login screen must have VISTA logo with accessibility label');
  const loginText = nodes(loginTree).find(n => n.type === 'Text' && textOf(n) === 'VISTA');
  assert.ok(loginText, 'Login screen must render "VISTA" text directly beneath logo');
  assert.equal(loginText.props.style.color, '#1a59a5', 'Login VISTA text must be official VISTA blue (#1a59a5)');
  assert.equal(loginText.props.style.fontFamily, h.load('src/theme/tokens.js').type.display.fontFamily);
});

test('5. Android app label and launcher icon assets are correctly configured and high-resolution', () => {
  // strings.xml
  const stringsXml = fs.readFileSync(path.resolve(__dirname, '../android/app/src/main/res/values/strings.xml'), 'utf-8');
  assert.ok(stringsXml.includes('<string name="app_name">VISTA</string>'), 'app_name must be exactly "VISTA" in strings.xml');

  // AndroidManifest.xml
  const manifestXml = fs.readFileSync(path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml'), 'utf-8');
  assert.ok(manifestXml.includes('android:label="@string/app_name"'), 'Application must set android:label="@string/app_name"');
  assert.ok(manifestXml.includes('activity android:name=".MainActivity" android:label="@string/app_name"'), 'MainActivity must explicitly set android:label="@string/app_name"');

  // build.gradle
  const buildGradle = fs.readFileSync(path.resolve(__dirname, '../android/app/build.gradle'), 'utf-8');
  assert.ok(buildGradle.includes('com.wayvbb.vistaapp'), 'build.gradle must have applicationId "com.wayvbb.vistaapp"');

  // app.json
  const appJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app.json'), 'utf-8'));
  assert.equal(appJson.expo.name, 'VISTA');
  assert.equal(appJson.expo.slug, 'vista-app');
  assert.equal(appJson.expo.icon, './assets/native/app-icon.png');
  assert.equal(appJson.expo.splash.image, './assets/native/splash.png');
  assert.equal(appJson.expo.android.package, 'com.wayvbb.vistaapp');

  // Verify high-resolution assets exist
  const appIconPath = path.resolve(__dirname, '../assets/native/app-icon.png');
  assert.ok(fs.existsSync(appIconPath), 'assets/native/app-icon.png must exist');
  const splashPath = path.resolve(__dirname, '../assets/native/splash.png');
  assert.ok(fs.existsSync(splashPath), 'assets/native/splash.png must exist');

  // Check mipmap adaptive foregrounds exist
  const resDir = path.resolve(__dirname, '../android/app/src/main/res');
  for (const d of ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi']) {
    const fg = path.join(resDir, d, 'ic_launcher_foreground.webp');
    assert.ok(fs.existsSync(fg), `${d}/ic_launcher_foreground.webp must exist`);
    const ic = path.join(resDir, d, 'ic_launcher.webp');
    assert.ok(fs.existsSync(ic), `${d}/ic_launcher.webp must exist`);
    const icRound = path.join(resDir, d, 'ic_launcher_round.webp');
    assert.ok(fs.existsSync(icRound), `${d}/ic_launcher_round.webp must exist`);
  }

  // Check splash drawable files exist
  for (const d of ['drawable-mdpi', 'drawable-hdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi']) {
    const sp = path.join(resDir, d, 'splashscreen_logo.png');
    assert.ok(fs.existsSync(sp), `${d}/splashscreen_logo.png must exist`);
  }
});

test('6. Context-aware skeletons match destination layouts and dropdowns', () => {
  const h = createHarness();
  const {
    ProfileSkeleton,
    DashboardCardsSkeleton,
    SubmissionListSkeleton,
    TrackDetailsSkeleton,
    NotificationsSkeleton,
    SettingsSkeleton,
    DropdownSkeleton,
  } = h.load('src/components/common/Skeleton.jsx');

  // ProfileSkeleton
  const profTree = h.instance(ProfileSkeleton).output;
  assert.equal(profTree.props.accessibilityLabel, 'Loading profile');
  assert.ok(nodes(profTree).some(n => n.props?.width === 84 && n.props?.height === 84 && n.props?.radius >= 42), 'Must render avatar circle matching sizes.avatarProfile');

  // DashboardCardsSkeleton
  const dashTree = h.instance(DashboardCardsSkeleton).output;
  assert.equal(dashTree.props.accessibilityLabel, 'Loading dashboard totals');
  const tones = h.load('src/theme/tokens.js').dashboardTones;
  for (const key of ['total', 'pending', 'approved', 'rejected']) assert.ok(nodes(dashTree).some(n => n.props?.style?.backgroundColor === tones[key].background), 'Loading retains the four-card tonal layout');

  // SubmissionListSkeleton
  const subTree = h.instance(SubmissionListSkeleton, { count: 2 }).output;
  assert.equal(subTree.props.accessibilityLabel, 'Loading submissions');

  // TrackDetailsSkeleton
  const trackTree = h.instance(TrackDetailsSkeleton, { staff: true }).output;
  assert.equal(trackTree.props.accessibilityLabel, 'Loading submission details');
  assert.ok(nodes(trackTree).some(n => n.props?.style?.backgroundColor === h.load('src/theme/tokens.js').colors.ticket), 'Must render the current ticket banner surface');

  // NotificationsSkeleton
  const notifTree = h.instance(NotificationsSkeleton, { count: 3 }).output;
  assert.equal(notifTree.props.accessibilityLabel, 'Loading notifications');

  // SettingsSkeleton
  const setTree = h.instance(SettingsSkeleton).output;
  assert.equal(setTree.props.accessibilityLabel, 'Loading settings');

  // DropdownSkeleton
  const dropTree = h.instance(DropdownSkeleton, { count: 3 }).output;
  assert.equal(dropTree.props.accessibilityLabel, 'Loading options');
  assert.equal(dropTree.props.children.length, 3, 'Must render three option rows');
  for (const row of dropTree.props.children) {
    assert.equal(row.props.style.minHeight, 48, 'Loading rows match the accessible option target');
    assert.ok(nodes(row).some(n => n.props?.width && n.props?.height), 'Each row contains a text placeholder');
  }

  // Dropdown loading integration in SelectField (inline presentation when open)
  const SelectField = h.load('src/components/staff/SelectField.jsx').default;
  const selectInst = h.instance(SelectField, { label: 'Status', isLoading: true, options: [], presentation: 'inline' });
  // Open the select
  const touchable = nodes(selectInst.output).find(n => n.props?.accessibilityRole === 'button');
  assert.ok(touchable, 'SelectField touch target must exist');
  selectInst.render({ label: 'Status', isLoading: true, options: [], presentation: 'inline' });
  // Trigger open
  touchable.props.onPress();
  const openedTree = selectInst.render();
  const selectDropdownSkel = nodes(openedTree).find(n => n.type?.name === 'DropdownSkeleton');
  assert.ok(selectDropdownSkel, 'SelectField must render DropdownSkeleton when isLoading is true in open presentation');

  // AcademicYearFilterSheet loading integration
  const filterHarness = createHarness({
    '../../hooks/useAcademicYears': {
      useAcademicYears: () => ({ data: [], isLoading: true }),
    },
  });
  const FilterComponent = filterHarness.load('src/components/submissions/AcademicYearFilterSheet.jsx').default;
  const filterTree = filterHarness.instance(FilterComponent, { visible: true, years: null }).output;
  const filterDropdownSkel = nodes(filterTree).find(n => n.type?.name === 'DropdownSkeleton');
  assert.ok(filterDropdownSkel, 'AcademicYearFilterSheet must render DropdownSkeleton when isLoading is true and years are empty');
});
