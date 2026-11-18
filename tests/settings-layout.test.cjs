const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const dataHarness = createHarness();
const { LEGAL_DOCUMENTS, CONTACT_EMAIL, APP_VERSION } = dataHarness.load('src/data/legalContent.js');
const { getManualForRole, STUDENT_MANUAL, STAFF_MANUAL, FALLBACK_MANUAL } = dataHarness.load('src/data/userManualContent.js');

test('SettingsHeader renders white back button, bold white title, and supports VISTA icon across from back button', () => {
  const h = createHarness();
  const SettingsHeader = h.load('src/components/settings/SettingsHeader.jsx').default;

  let backPressed = false;

  const tree = h.instance(SettingsHeader, {
    title: 'Settings',
    onBack: () => { backPressed = true; },
    showVistaIcon: true,
  }).output;

  // Header row layout
  const style = Object.assign({}, ...[].concat(tree.props.style || {}));
  assert.equal(style.flexDirection, 'row');
  assert.equal(style.alignItems, 'center');

  // Back button on left
  const backBtn = nodes(tree).find(n => n.props?.accessibilityRole === 'button' && n.props?.accessibilityLabel === 'Go back');
  assert.ok(backBtn, 'Back button must exist');
  assert.ok(backBtn.props.style?.width >= 48, 'Back button must have min 48dp width touch target');
  assert.ok(backBtn.props.style?.height >= 48, 'Back button must have min 48dp height touch target');
  backBtn.props.onPress();
  assert.equal(backPressed, true, 'Back button press callback should fire');

  // Back icon is white
  const backIcon = nodes(backBtn).find(n => n.props?.name === 'chevron-left');
  assert.ok(backIcon, 'Back icon must be chevron-left');
  assert.equal(backIcon.props.color, '#FFFFFF', 'Back icon must be white (#FFFFFF)');

  // Title beside it in white (18sp bold)
  const titleNode = nodes(tree).find(n => n.type === 'Text' && textOf(n) === 'Settings');
  assert.ok(titleNode, 'Settings title must exist');
  assert.equal(titleNode.props.style.color, '#FFFFFF', 'Title must be white (#FFFFFF)');
  assert.equal(titleNode.props.style.fontFamily, 'DMSans_700Bold');
  assert.equal(titleNode.props.style.fontSize, 18, 'Title must be 18sp bold');
  assert.ok(style.minHeight >= 48 && style.minHeight <= 52, 'Header visual height must be 48-52dp');

  // Right-side VISTA logo icon sits across from back button
  const vistaIcon = nodes(tree).find(n => n.type === 'Image' && n.props?.accessibilityLabel === 'VISTA official logo');
  assert.ok(vistaIcon, 'VISTA logo icon must be present across from the back button when showVistaIcon is true');
  assert.ok(vistaIcon.props.style?.width >= 24, 'VISTA logo icon width should be around 28-30dp');

  // Default without showVistaIcon has no image
  const defaultTree = h.instance(SettingsHeader, {
    title: 'Subpage',
    onBack: () => {},
  }).output;
  const noIcon = nodes(defaultTree).find(n => n.type === 'Image');
  assert.equal(noIcon, undefined, 'Default header should not render VISTA icon unless showVistaIcon is set');
});

test('SettingsScreen uses neutral inset groups while preserving every action and VISTA branding', () => {
  const navigatedTo = [];
  const navigation = {
    navigate: (route, params) => navigatedTo.push({ route, params }),
    canGoBack: () => true,
    goBack: () => navigatedTo.push({ route: 'GO_BACK' }),
  };

  const user = { user_id: 1, email: 'student@example.test', role: 'student' };
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ user, role: 'student' }) },
    '../../theme/layout': {
      useStaffLayout: () => ({ horizontal: { paddingHorizontal: 16 } }),
      useBottomNavClearance: () => 68,
    },
    '../../components/common/AppBottomSheet': { default: 'AppBottomSheet', __esModule: true },
    '../../components/common/AppButton': { default: 'AppButton', __esModule: true },
  });

  const SettingsScreen = h.load('src/screens/shared/SettingsScreen.jsx').default;
  const tree = h.instance(SettingsScreen, { navigation }).output;

  // 1. The landing page opts into a neutral grouped surface.
  const rootStyle = Object.assign({}, ...[].concat(tree.props.style || {}));
  assert.equal(rootStyle.backgroundColor, '#F3F3F3');

  // 2. All four sections retain their content and use the grouped variant.
  const sections = nodes(tree).filter(n => n.type?.name === 'SettingsSection');
  assert.equal(sections.length, 4, 'Preserve preferences, existing app updates, help, and legal groups');
  assert.equal(sections[0].props.title, 'Preferences');
  assert.equal(sections[1].props.title, 'App updates');
  assert.equal(sections[2].props.title, 'Help & support');
  assert.equal(sections[3].props.title, 'Legal & information');
  assert.ok(sections.every(section => section.props.variant === 'grouped'));

  // Verify section label color and compact typography inside SettingsSection component
  const SectionComponent = h.load('src/components/settings/SettingsSection.jsx').default;
  const sampleSection = h.instance(SectionComponent, { title: 'Preferences', children: null, variant: 'grouped' }).output;
  const sectionLabelText = nodes(sampleSection).find(n => n.type === 'Text' && textOf(n) === 'Preferences');
  assert.ok(sectionLabelText, 'Section title text must exist');
  assert.equal(sectionLabelText.props.style.color, '#64748B', 'Group captions use the shared secondary text color');
  assert.equal(sectionLabelText.props.style.fontSize, 12, 'Section labels use readable metadata type');
  assert.equal(sampleSection.props.style[0].marginBottom, 24);

  // 3. Verify white container card inside section with 16-18dp radius
  const cardContainer = nodes(sampleSection).find(n => n.props?.style?.backgroundColor === '#FFFFFF');
  assert.ok(cardContainer, 'Settings grouped container must be white (#FFFFFF) for contrast');
  assert.equal(cardContainer.props.style.borderRadius, 16, 'Settings groups use the shared inset radius');
  assert.equal(cardContainer.props.style.borderWidth, 1);
  assert.equal(cardContainer.props.style.boxShadow, undefined, 'Inset settings groups do not float as individual cards');

  // 4. Preserve every existing action and expose the optional replay tour.
  const rows = nodes(tree).filter(n => n.type?.name === 'SettingsRow');
  assert.equal(rows.length, 11, 'Preserve existing rows alongside the optional app tour');

  const rowLabels = rows.map(r => r.props.label);
  assert.deepEqual(rowLabels, [
    'Notifications',
    'Check for updates',
    'View app tour',
    'User Guide',
    'Frequently Asked Questions',
    'Contact OSA Support',
    'Report a Technical Issue',
    'Privacy Policy',
    'Terms of Service',
    'Community & Submission Guidelines',
    'About VISTA',
  ]);

  // 5. Test row navigation
  rows[0].props.onPress(); // Notifications
  assert.equal(navigatedTo.at(-1).route, 'NotificationPreferences');

  rows.find(row => row.props.label === 'User Guide').props.onPress();
  assert.equal(navigatedTo.at(-1).route, 'UserGuide');

  rows.find(row => row.props.label === 'View app tour').props.onPress();
  assert.equal(navigatedTo.at(-1).route, 'AppTour');

  rows.find(row => row.props.label === 'Privacy Policy').props.onPress();
  assert.equal(navigatedTo.at(-1).route, 'LegalDocument');
  assert.equal(navigatedTo.at(-1).params?.documentType, 'privacy');

  rows.find(row => row.props.label === 'Terms of Service').props.onPress();
  assert.equal(navigatedTo.at(-1).route, 'LegalDocument');
  assert.equal(navigatedTo.at(-1).params?.documentType, 'terms');

  rows.find(row => row.props.label === 'Community & Submission Guidelines').props.onPress();
  assert.equal(navigatedTo.at(-1).route, 'LegalDocument');
  assert.equal(navigatedTo.at(-1).params?.documentType, 'guidelines');

  rows.find(row => row.props.label === 'About VISTA').props.onPress();
  assert.equal(navigatedTo.at(-1).route, 'LegalDocument');
  assert.equal(navigatedTo.at(-1).params?.documentType, 'about');

  // 6. Grouped rows use quiet outline icons and growing, readable touch targets.
  const RowComponent = h.load('src/components/settings/SettingsRow.jsx').default;
  const sampleRow = h.instance(RowComponent, rows[0].props).output;
  const iconTile = nodes(sampleRow).find(n => n.type === 'View' && n.props?.style?.width === 24 && n.props?.style?.height === 24);
  assert.equal(iconTile.props.style.backgroundColor, undefined);
  assert.equal(iconTile.props.importantForAccessibility, 'no-hide-descendants');
  const rowBtn = nodes(sampleRow).find(n => n.type === 'TouchableOpacity');
  assert.equal(rowBtn.props.style.minHeight, 64, 'Descriptive settings rows have a minimum height and may grow with text');
  const labelNode = nodes(sampleRow).find(n => n.type === 'Text' && textOf(n) === 'Notifications');
  assert.ok(labelNode.props.style.fontSize >= 13 && labelNode.props.style.fontSize <= 14, 'Setting label must be 13-14sp');
  assert.equal(labelNode.props.numberOfLines, undefined, 'Large text must not truncate setting labels');
  const descNode = nodes(sampleRow).find(n => n.type === 'Text' && textOf(n) === 'Push and in-app alerts');
  assert.equal(descNode.props.style.fontSize, 12, 'Descriptions use readable metadata type');

  // 7. Verify VISTA logo icon is placed across the header
  const headerNode = nodes(tree).find(n => n.type?.name === 'SettingsHeader');
  assert.ok(headerNode, 'SettingsHeader must exist on SettingsScreen');
  assert.equal(headerNode.props.showVistaIcon, true, 'SettingsScreen must pass showVistaIcon to place VISTA icon across the header');
  assert.equal(headerNode.props.variant, 'grouped');
  const headerTree = h.instance(headerNode.type, headerNode.props).output;
  const logoImage = nodes(headerTree).find(n => n.type === 'Image' && n.props?.accessibilityLabel === 'VISTA official logo');
  assert.ok(logoImage, 'Official VISTA logo must exist in the header across from the back button');

  // 8. Verify Footer Branding: Version AND other caption ("USTP Office of Student Affairs")
  const versionText = nodes(tree).find(n => n.type === 'Text' && textOf(n) === `VISTA Mobile v${APP_VERSION}`);
  assert.ok(versionText, `Version label must be "VISTA Mobile v${APP_VERSION}"`);
  assert.equal(versionText.props.style.color, '#64748B');

  const officeCaption = nodes(tree).find(n => n.type === 'Text' && textOf(n) === 'USTP Office of Student Affairs');
  assert.ok(officeCaption, 'Footer must bring back the "USTP Office of Student Affairs" caption');

  // 9. Verify reduced bottom gap
  const scrollView = nodes(tree).find(n => n.type === 'ScrollView');
  assert.ok(scrollView, 'ScrollView must exist');
  const scrollStyle = Object.assign({}, ...[].concat(scrollView.props.contentContainerStyle || {}));
  assert.ok(scrollStyle.paddingBottom <= 40, `Bottom padding must be compact (was ${scrollStyle.paddingBottom}) to reduce the very big gap from the bottom`);
});

test('NotificationPreferencesScreen uses neutral grouped surfaces', () => {
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ role: 'student' }) },
    '../../theme/layout': {
      useStaffLayout: () => ({ horizontal: { paddingHorizontal: 16 } }),
      useBottomNavClearance: () => 68,
    },
  });

  const Screen = h.load('src/screens/shared/NotificationPreferencesScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: { goBack() {}, navigate() {} } }).output;

  const rootStyle = Object.assign({}, ...[].concat(tree.props.style || {}));
  assert.equal(rootStyle.backgroundColor, '#F3F3F3', 'NotificationPreferencesScreen must use the shared neutral background');

  const header = nodes(tree).find(n => n.type?.name === 'SettingsHeader');
  assert.ok(header, 'SettingsHeader must exist');
  assert.equal(header.props.title, 'Notification Preferences');

  const sections = nodes(tree).filter(n => n.type?.name === 'SettingsSection');
  assert.equal(sections.length, 3, 'Must render delivery channels, trigger events, and inbox sections');
  assert.equal(sections[0].props.title, 'Delivery channels');
  assert.equal(sections[1].props.title, 'Trigger events');
  assert.equal(sections[2].props.title, 'Notification inbox');
});

test('settings variants retain explicit brand support and aligned, accessible row separators', () => {
  const h = createHarness();
  const { colors, settingsLayout, space } = h.load('src/theme/tokens.js');
  const Header = h.load('src/components/settings/SettingsHeader.jsx').default;
  const Section = h.load('src/components/settings/SettingsSection.jsx').default;
  const Row = h.load('src/components/settings/SettingsRow.jsx').default;
  const groupedHeader = h.instance(Header, { variant: 'grouped', title: 'Settings' }).output;
  assert.equal(nodes(groupedHeader).find(n => n.props?.name === 'chevron-left').props.color, colors.blue);
  assert.equal(nodes(groupedHeader).find(n => n.type === 'Text' && textOf(n) === 'Settings').props.style.color, colors.navy);
  const brandSection = h.instance(Section, { title: 'Delivery channels', variant: 'brand' }).output;
  assert.equal(nodes(brandSection).find(n => n.type === 'Text').props.style.color, colors.onBrand);
  const brandRow = h.instance(Row, { icon: 'bell', label: 'Existing subpage row', variant: 'brand' }).output;
  assert.ok(!nodes(brandRow).some(n => n.props?.style?.height === settingsLayout.iconSize));

  const ref = { current: null };
  const groupedRow = h.instance(Row, { variant: 'grouped', icon: 'mail', label: 'Contact support', hasDivider: true, triggerRef: ref, onPress() {} }).output;
  const button = nodes(groupedRow).find(n => n.type === 'TouchableOpacity');
  assert.equal(button.props.ref, ref);
  const separator = nodes(groupedRow).find(n => n.props?.style?.height === settingsLayout.separatorWidth);
  assert.equal(separator.props.style.marginLeft, space.lg + settingsLayout.iconSize + space.md);
  assert.equal(separator.props.style.backgroundColor, colors.divider);
});

test('settings support sheets retain their trigger refs and role-aware guide descriptions', () => {
  for (const role of ['student', 'staff']) {
    const h = createHarness({
      '../../context/AuthContext': { useAuth: () => ({ role, user: { user_id: 1 } }) },
      '../../components/common/AppBottomSheet': { default: 'AppBottomSheet', __esModule: true },
      '../../components/common/AppButton': { default: 'AppButton', __esModule: true },
    });
    const Screen = h.load('src/screens/shared/SettingsScreen.jsx').default;
    const screen = h.instance(Screen, { navigation: { navigate() {}, canGoBack: () => true, goBack() {} } });
    const getRow = label => nodes(screen.output).find(n => n.type?.name === 'SettingsRow' && n.props.label === label);
    assert.equal(getRow('User Guide').props.description, role === 'student' ? 'Student submission and tracking manual' : 'OSA staff review and processing manual');
    for (const [label, title] of [
      ['Frequently Asked Questions', 'Frequently Asked Questions'],
      ['Contact OSA Support', 'Contact OSA Support'],
      ['Report a Technical Issue', 'Report Technical Issue'],
    ]) {
      const row = getRow(label);
      row.props.onPress(); screen.render();
      let sheet = nodes(screen.output).find(n => n.type === 'AppBottomSheet' && n.props.title === title);
      assert.equal(sheet.props.visible, true);
      assert.equal(sheet.props.returnFocusRef, row.props.triggerRef);
      sheet.props.onClose(); screen.render();
      sheet = nodes(screen.output).find(n => n.type === 'AppBottomSheet' && n.props.title === title);
      assert.equal(sheet.props.visible, false);
    }
  }
});

test('settings update action exposes pending feedback and blocks repeated checks until it completes', async () => {
  let finishCheck, checks = 0, informed = 0;
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ role: 'staff', user: { user_id: 1 } }) },
    '../../components/common/UpdateManager': { useUpdateManager: () => ({ checkNow() { checks++; return new Promise(resolve => { finishCheck = resolve; }); } }) },
    '../../components/common/Toast': { useToast: () => ({ info() { informed++; }, error() {} }) },
    '../../components/common/AppBottomSheet': { default: 'AppBottomSheet', __esModule: true },
    '../../components/common/AppButton': { default: 'AppButton', __esModule: true },
  });
  const Screen = h.load('src/screens/shared/SettingsScreen.jsx').default;
  const Row = h.load('src/components/settings/SettingsRow.jsx').default;
  const screen = h.instance(Screen, { navigation: {} });
  const updateRow = () => nodes(screen.output).find(n => n.type?.name === 'SettingsRow' && n.props.icon === 'download');
  const pending = updateRow().props.onPress(); screen.render();
  assert.equal(updateRow().props.busy, true);
  const renderedRow = h.instance(Row, updateRow().props).output;
  const button = nodes(renderedRow).find(n => n.type === 'TouchableOpacity');
  assert.equal(button.props.disabled, true);
  assert.equal(button.props.accessibilityState.busy, true);
  assert.ok(nodes(renderedRow).some(n => n.type === 'ActivityIndicator'));
  await updateRow().props.onPress();
  assert.equal(checks, 1);
  finishCheck(null); await pending; screen.render();
  assert.equal(updateRow().props.busy, false);
  assert.equal(informed, 1);
});

test('Role-aware User Guide: uses neutral grouped surfaces and isolates Student vs Staff manuals', () => {
  // 1. Student User
  const studentManual = getManualForRole('student');
  assert.equal(studentManual.role, 'student');
  assert.equal(studentManual.title, 'Student User Manual');
  assert.equal(studentManual.badge, 'Student Guide');
  assert.equal(studentManual.sections.length, 9);

  // Verify Student sections include student features
  const studentSectionTitles = studentManual.sections.map(s => s.title);
  assert.ok(studentSectionTitles.some(t => t.includes('Signing In')));
  assert.ok(studentSectionTitles.some(t => t.includes('Student Dashboard')));
  assert.ok(studentSectionTitles.some(t => t.includes('Review Tracker')));
  assert.ok(studentSectionTitles.some(t => t.includes('Submission Statuses')));
  assert.ok(studentSectionTitles.some(t => t.includes('Organization Submissions')));
  assert.ok(studentSectionTitles.some(t => t.includes('Staff Remarks')));
  assert.ok(studentSectionTitles.some(t => t.includes('Replying to Conversation')));

  // Ensure Student Manual NEVER discloses internal Staff procedures
  const studentFullText = JSON.stringify(studentManual);
  assert.equal(studentFullText.includes('Document Entry'), false, 'Student Manual must NOT disclose Document Entry');
  assert.equal(studentFullText.includes('OCR output is strictly an assistive'), false, 'Student Manual must NOT disclose OCR SOP');
  assert.equal(studentFullText.includes('Google Drive Archival Workflow'), false, 'Student Manual must NOT disclose Drive Archival Workflow');

  // 2. Staff User
  const staffManual = getManualForRole('staff');
  assert.equal(staffManual.role, 'staff');
  assert.equal(staffManual.title, 'OSA Staff User Manual');
  assert.equal(staffManual.badge, 'Staff SOP');
  assert.equal(staffManual.sections.length, 12);

  const staffSectionTitles = staffManual.sections.map(s => s.title);
  assert.ok(staffSectionTitles.some(t => t.includes('Staff Dashboard')));
  assert.ok(staffSectionTitles.some(t => t.includes('Submission Registration')));
  assert.ok(staffSectionTitles.some(t => t.includes('Review Panel')));
  assert.ok(staffSectionTitles.some(t => t.includes('Submission History')));
  assert.ok(staffSectionTitles.some(t => t.includes('OCR-Assisted Document Processing')));
  assert.ok(staffSectionTitles.some(t => t.includes('Status Updates & Reviewer Remarks')));
  assert.ok(staffSectionTitles.some(t => t.includes('Google Drive Archival Workflow')));

  // 3. Fallback manual for unknown roles
  const fallbackManual = getManualForRole('unknown_role');
  assert.equal(fallbackManual.role, 'guest');
  assert.equal(fallbackManual.title, 'VISTA General Platform Guide');

  // 4. Test UserGuideScreen component rendering
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ role: 'student', user: { first_name: 'Student' } }) },
    '../../theme/layout': {
      useStaffLayout: () => ({ horizontal: { paddingHorizontal: 16 } }),
    },
  });

  const Screen = h.load('src/screens/shared/UserGuideScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: { goBack() {} } }).output;

  const rootStyle = Object.assign({}, ...[].concat(tree.props.style || {}));
  assert.equal(rootStyle.backgroundColor, '#F3F3F3', 'UserGuideScreen must use the shared neutral background');

  const header = nodes(tree).find(n => n.type?.name === 'SettingsHeader');
  assert.ok(header, 'SettingsHeader must exist');
  assert.equal(header.props.title, 'User Guide');
});

test('LegalDocumentScreen uses neutral grouped surfaces and approved Web legal policies', () => {
  const h = createHarness({
    '../../theme/layout': {
      useStaffLayout: () => ({ horizontal: { paddingHorizontal: 16 } }),
    },
  });

  const Screen = h.load('src/screens/shared/LegalDocumentScreen.jsx').default;
  const tree = h.instance(Screen, {
    navigation: { goBack() {} },
    route: { params: { documentType: 'privacy' } },
  }).output;

  const rootStyle = Object.assign({}, ...[].concat(tree.props.style || {}));
  assert.equal(rootStyle.backgroundColor, '#F3F3F3', 'LegalDocumentScreen must use the shared neutral background');

  const headingNode = nodes(tree).find(n => n.type === 'Text' && textOf(n) === 'Privacy Policy');
  assert.ok(headingNode, 'Privacy Policy heading must render');

  const approvedBadge = nodes(tree).find(n => n.type === 'Text' && textOf(n) === 'Approved');
  assert.ok(approvedBadge, 'Approved status badge must render on Privacy Policy');

  const contactText = nodes(tree).find(n => n.type === 'Text' && textOf(n) === CONTACT_EMAIL);
  assert.ok(contactText, 'Contact email vista.ustp.edu.ph@gmail.com must be visible');
});

test('Settings page and subpages render compactly across 320dp, 360dp, and 393dp screen widths for Student and Staff', () => {
  const widths = [320, 360, 393];
  const roles = ['student', 'staff'];

  for (const width of widths) {
    for (const role of roles) {
      const h = createHarness({
        '../../context/AuthContext': { useAuth: () => ({ role, user: { user_id: 1, email: `${role}@ustp.edu.ph` } }) },
        'react-native': {
          ...createHarness().native,
          useWindowDimensions: () => ({ width, height: 800, fontScale: 1 }),
        },
      });

      // 1. SettingsScreen
      const SettingsScreen = h.load('src/screens/shared/SettingsScreen.jsx').default;
      const screenTree = h.instance(SettingsScreen, { navigation: { navigate() {}, goBack() {}, canGoBack: () => true } }).output;
      assert.ok(screenTree, `SettingsScreen must render at ${width}dp for ${role}`);

      const scroll = nodes(screenTree).find(n => n.type === 'ScrollView');
      assert.equal(scroll.props.contentContainerStyle.paddingHorizontal, 16, `Horizontal padding must be 16dp at ${width}dp`);
      assert.ok(scroll.props.contentContainerStyle.paddingBottom <= 40, `Bottom padding must be compact at ${width}dp`);

      // 2. SettingsHeader visual height and title
      const SettingsHeader = h.load('src/components/settings/SettingsHeader.jsx').default;
      const headerTree = h.instance(SettingsHeader, { title: 'Settings', onBack() {}, showVistaIcon: true }).output;
      assert.ok(headerTree.props.style.minHeight >= 48 && headerTree.props.style.minHeight <= 52, `Header height must be 48-52dp at ${width}dp`);
      const title = nodes(headerTree).find(n => n.type === 'Text' && textOf(n) === 'Settings');
      assert.equal(title.props.style.fontSize, 18, `Page title must be 18sp at ${width}dp`);

      // 3. UserGuideScreen
      const UserGuideScreen = h.load('src/screens/shared/UserGuideScreen.jsx').default;
      const guideTree = h.instance(UserGuideScreen, { navigation: { goBack() {} } }).output;
      assert.ok(guideTree, `UserGuideScreen must render at ${width}dp for ${role}`);

      // 4. NotificationPreferencesScreen
      const NotifScreen = h.load('src/screens/shared/NotificationPreferencesScreen.jsx').default;
      const notifTree = h.instance(NotifScreen, { navigation: { goBack() {} } }).output;
      assert.ok(notifTree, `NotificationPreferencesScreen must render at ${width}dp for ${role}`);
    }
  }
});

test('settings account card displays cached identity without a profile navigation action', () => {
  for (const role of ['student', 'staff']) {
    const visits = [];
    const user = { user_id: 7, first_name: 'Alex', last_name: 'Student', email: 'alex@example.test', image_url: 'https://example.test/avatar.webp' };
    const h = createHarness({ '../../context/AuthContext': { useAuth: () => ({ role, user }) } });
    const Screen = h.load('src/screens/shared/SettingsScreen.jsx').default;
    const tree = h.instance(Screen, { navigation: { navigate: route => visits.push(route) } }).output;
    const card = nodes(tree).find(n => n.type === 'View' && [].concat(n.props?.children || []).some(child => child?.type?.name === 'UserAvatar'));
    assert.ok(card);
    assert.ok(textOf(card).includes('Alex Student'));
    assert.ok(textOf(card).includes(user.email));
    const avatar = nodes(card).find(n => n.type?.name === 'UserAvatar');
    assert.equal(avatar.props.uri, user.image_url);
    assert.equal(avatar.props.size, 48);
    assert.equal(card.props.onPress, undefined);
    assert.equal(card.props.accessibilityRole, undefined);
    assert.ok(!nodes(card).some(n => n.props?.name === 'chevron-right'));
    assert.deepEqual(visits, []);
    const header = nodes(tree).find(n => n.type?.name === 'SettingsHeader');
    assert.equal(typeof header.props.onBack, 'function');
  }
});

test('all legal variants retain every policy paragraph and readable wrapped metadata', () => {
  const h = createHarness();
  const Screen = h.load('src/screens/shared/LegalDocumentScreen.jsx').default;
  for (const [documentType, doc] of Object.entries(LEGAL_DOCUMENTS)) {
    const tree = h.instance(Screen, { navigation: { goBack() {} }, route: { params: { documentType } } }).output;
    const text = textOf(tree);
    for (const section of doc.sections) {
      for (const paragraph of [...(section.paragraphs || []), ...(section.bullets || [])]) assert.ok(text.includes(paragraph));
    }
    assert.ok(text.includes(doc.status));
    const header = nodes(tree).find(n => n.type?.name === 'SettingsHeader');
    assert.equal(header.props.variant, 'grouped');
    const eyebrow = nodes(tree).find(n => n.type === 'Text' && textOf(n) === doc.eyebrow);
    const metaRow = nodes(tree).find(n => n.props?.style?.flexWrap === 'wrap');
    assert.ok(metaRow, 'Long policy metadata and status badge must wrap within the card');
    assert.equal(eyebrow.props.style.flexShrink, 1);
    const support = nodes(tree).find(n => n.props?.accessibilityLabel === 'Send email inquiry regarding policy');
    assert.ok(support.props.style.minHeight >= 48);
  }
});

test('restyled role manuals preserve expand, collapse, individual toggles and full step text', () => {
  for (const role of ['student', 'staff']) {
    const h = createHarness({ '../../context/AuthContext': { useAuth: () => ({ role, user: {} }) } });
    const Screen = h.load('src/screens/shared/UserGuideScreen.jsx').default;
    const screen = h.instance(Screen, { navigation: { goBack() {} } });
    const buttons = () => nodes(screen.output).filter(n => n.props?.accessibilityState?.expanded !== undefined);
    assert.equal(buttons().filter(n => n.props.accessibilityState.expanded).length, 2);
    nodes(screen.output).find(n => n.props?.accessibilityLabel === 'Expand all sections').props.onPress(); screen.render();
    const manual = getManualForRole(role);
    assert.equal(buttons().filter(n => n.props.accessibilityState.expanded).length, manual.sections.length);
    for (const section of manual.sections) for (const step of section.steps) assert.ok(textOf(screen.output).includes(step));
    nodes(screen.output).find(n => n.props?.accessibilityLabel === 'Collapse all sections').props.onPress(); screen.render();
    assert.equal(buttons().filter(n => n.props.accessibilityState.expanded).length, 0);
    buttons()[0].props.onPress(); screen.render();
    assert.equal(buttons()[0].props.accessibilityState.expanded, true);
    assert.ok(buttons()[0].props.style.minHeight >= 48);
  }
});
