const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const { createBottomNavStore } = require('../src/navigation/bottomNavStore.cjs');
const flat = value => Object.assign({}, ...(Array.isArray(value) ? value.flat(Infinity) : [value]));

test('persistent bar keeps its element during cold navigation and stale cleanup cannot remove the next route', () => {
  const store = createBottomNavStore(), home = {}, history = {}, first = {}, second = {}, seen = [];
  const unsubscribe = store.subscribe(value => seen.push(value));
  store.publish(home, first); store.release(home);
  assert.equal(store.getSnapshot(), first, 'Page unmount/blur must not blank the bar during a transition');
  store.publish(history, second); store.release(home);
  assert.equal(store.getSnapshot(), second);
  store.publish(history, second); assert.deepEqual(seen, [first, second]);
  unsubscribe(); store.publish(home, first); assert.equal(seen.length, 2);
});

test('navigator layout places a single navbar host beside animated content and hides it on profile/settings routes', () => {
  const h = createHarness(), { BottomNavLayout, BottomNavHost } = h.load('src/navigation/PersistentBottomNav.jsx');
  const page = { type: 'AnimatedPage', props: {} };
  const descriptors = { home: { options: { bottomNav: true } }, profile: { options: {} } };
  const layout = h.instance(BottomNavLayout, { children: page, descriptors, state: { index: 0, routes: [{ key: 'home' }] } });
  const store = layout.output.props.value;
  let host = nodes(layout.output).find(n => n.type === BottomNavHost);
  const parent = nodes(layout.output).find(n => n.props?.children?.includes?.(host));
  assert.equal(parent.type, 'View'); assert.equal(parent.props.children[0], page);
  assert.equal(host.props.visible, true);
  store.publish({}, { type: 'BottomNavFrame', props: {} });
  const view = h.instance(BottomNavHost, host.props);
  assert.equal(view.output.type, 'BottomNavFrame');
  layout.render({ ...layout.props, state: { index: 0, routes: [{ key: 'profile' }] } });
  host = nodes(layout.output).find(n => n.type === BottomNavHost);
  assert.equal(host.props.store, store); assert.equal(host.props.visible, false);
  view.render(host.props); assert.equal(view.output, null);
  view.unmount();
});

test('focused pages publish controls; inactive cached scenes cannot replace the visible navbar', () => {
  let focused = true; const store = createBottomNavStore();
  const h = createHarness({ '@react-navigation/native': { useIsFocused: () => focused } });
  h.mocks.react.useContext = () => store;
  const { PersistentBottomNav } = h.load('src/navigation/PersistentBottomNav.jsx');
  const a = { type: 'BarA' }, b = { type: 'BarB' }, inactive = { type: 'Inactive' };
  const pageA = h.instance(PersistentBottomNav, { children: a });
  assert.equal(pageA.output, null); assert.equal(store.getSnapshot(), a);
  const pageB = h.instance(PersistentBottomNav, { children: b });
  focused = false; pageA.render({ children: inactive });
  assert.equal(store.getSnapshot(), b);
  pageA.unmount(); assert.equal(store.getSnapshot(), b);
  focused = true; pageB.render({ children: a }); assert.equal(store.getSnapshot(), a);
});

test('both role navigators expose the persistent layout and preserve only existing navbar routes', () => {
  for (const role of ['Staff', 'Student']) {
    const file = `src/navigation/${role}Navigator.jsx`;
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const mocks = { './createPushStackNavigator': { createPushStackNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) }, '../context/AuthContext': { useAuth: () => ({ user: { role: role.toLowerCase() } }) } };
    for (const [, name] of source.matchAll(/from ["'](\.\.\/screens\/[^"']+)["']/g)) mocks[name] = { __esModule: true, default: 'Page' };
    const h = createHarness(mocks), nav = h.instance(h.load(file).default).output;
    assert.equal(typeof nav.props.layout, 'function');
    const routes = nodes(nav).filter(n => n.type === 'Screen');
    for (const name of [`${role}Home`, role === 'Staff' ? 'StaffDocumentEntry' : 'StudentTracker']) assert.equal(routes.find(n => n.props.name === name).props.options.bottomNav, true, name);
    for (const name of [`${role}Profile`, role === 'Staff' ? 'ReviewPanelDetails' : 'StudentSubmissionDetails', 'Settings', 'UserGuide', 'LegalDocument', 'NotificationPreferences']) assert.notEqual(routes.find(n => n.props.name === name).props.options.bottomNav, true, name);
  }
  const custom = fs.readFileSync(path.join(__dirname, '../src/navigation/createPushStackNavigator.jsx'), 'utf8');
  assert.match(custom, /screenOptions, layout, UNSTABLE_router \}/, 'Android must pass the official navigator layout and back-boundary override to useNavigationBuilder');
});

test('reference navbar uses equal icon-only hit areas, a larger lifted scan circle, and immediate actions', () => {
  const h = createHarness(); let calls = 0;
  const Bar = h.load('src/components/staff/StaffBottomNav.jsx').default;
  const bar = h.instance(Bar, { activeTab: 'reports', onScanPress: () => calls++ }).output;
  const items = nodes(bar).filter(n => n.type?.name === 'BottomNavItem');
  assert.equal(items.length, 5);
  for (const item of items) {
    const tree = h.instance(item.type, item.props).output;
    assert.equal(flat(tree.props.style).flex, 1);
    assert.equal(flat(tree.props.style).minWidth, 48);
    assert.equal(textOf(tree), '');
    assert.ok(tree.props.accessibilityLabel);
  }
  const scan = h.instance(items[2].type, items[2].props).output;
  const visual = flat(nodes(scan).find(n => n.type === 'AnimatedView').props.style);
  assert.equal(visual.width, 60); assert.equal(visual.borderWidth, 1.5);
  assert.equal(visual.transform[0].translateY, -10);
  scan.props.onPress(); assert.equal(calls, 1);
});

test('refresh deduplicates pulls, awaits every active read, and recovers after rejected queries without writes', async () => {
  const calls = []; let release, actions = 0;
  const h = createHarness({ '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: args => { calls.push(args); return args.queryKey[0] === 'a' ? new Promise(r => { release = r; }) : Promise.reject(Error('offline')); } }) } });
  const useRefresh = h.load('src/hooks/useScreenRefresh.js').useScreenRefresh;
  const refresh = h.instance(() => useRefresh([['a'], ['b']], () => { actions++; }));
  const first = refresh.output.onRefresh(), second = refresh.output.onRefresh();
  assert.equal(first, second); refresh.render(); assert.equal(refresh.output.refreshing, true);
  await Promise.resolve(); assert.equal(calls.length, 2); assert.equal(actions, 1);
  assert.ok(calls.every(call => call.refetchType === 'active'));
  release(); await first; refresh.render(); assert.equal(refresh.output.refreshing, false);
  const next = refresh.output.onRefresh(); await Promise.resolve(); release(); await next;
  assert.equal(calls.length, 4);
});

test('profile bottom baseline ignores system-bar changes, compensates a small resize, and allows keyboard/rotation', () => {
  let dimensions = { width: 360, height: 800 }, bottom = 0;
  const h = createHarness(); h.native.useWindowDimensions = () => dimensions;
  h.mocks['react-native-safe-area-context'].useSafeAreaInsets = () => ({ top: 24, left: 0, right: 0, bottom });
  const hook = h.instance(h.load('src/hooks/useStableBottomLayout.js').default);
  assert.equal(hook.output.bottom, 0);
  bottom = 48; dimensions = { width: 360, height: 752 }; hook.render();
  assert.equal(hook.output.bottom, 0); assert.equal(hook.output.marginBottom, -48);
  dimensions = { width: 360, height: 800 }; bottom = 0; hook.render();
  assert.equal(hook.output.marginBottom, 0);
  dimensions = { width: 360, height: 500 }; hook.render(); assert.equal(hook.output.marginBottom, 0);
  dimensions = { width: 800, height: 360 }; bottom = 24; hook.render(); assert.equal(hook.output.bottom, 24);
});

test('profile avatar spans the unpadded panel and bordered image layers fit inside the ring', () => {
  const h = createHarness({ '../../context/AuthContext': { useAuth: () => ({ user: { user_id: 7, role: 'staff' }, updateUser() {} }) } });
  const profile = h.instance(h.load('src/screens/shared/EditProfileScreen.jsx').default, { navigation: {} }).output;
  const panel = nodes(profile).find(n => n.props?.className === 'flex-1 bg-[#245EA9]');
  assert.equal(flat(panel.props.style).paddingLeft, undefined);
  const avatarWrap = nodes(panel).find(n => n.props?.style?.top === -34);
  assert.equal(avatarWrap.props.style.left, 0); assert.equal(avatarWrap.props.style.right, 0);
  assert.equal(avatarWrap.props.style.alignItems, 'center');
  const picture = h.instance(h.load('src/components/common/UserAvatar.jsx').default, { uri: 'https://images.test/profile.jpg', size: 84, style: { borderWidth: 3 } }).output;
  const images = nodes(picture).filter(n => n.type === 'Image');
  assert.equal(images.length, 2);
  for (const image of images) { assert.equal(image.props.style.width, '100%'); assert.equal(image.props.style.height, '100%'); }
});

test('every routed page exposes a pullable main refresh surface, including short bundled pages and forms', () => {
  const files = [
    'screens/SplashScreen.jsx', 'screens/auth/LoginScreen.jsx', 'screens/shared/EditProfileScreen.jsx',
    'screens/shared/SettingsScreen.jsx', 'screens/shared/NotificationPreferencesScreen.jsx', 'screens/shared/UserGuideScreen.jsx', 'screens/shared/LegalDocumentScreen.jsx',
    'screens/staff/home/StaffHomeContent.jsx', 'screens/staff/StaffReviewPanel.jsx', 'screens/staff/home/StaffSubmissionHistory.jsx', 'screens/staff/GDriveSync.jsx',
    'screens/staff/docEntry/StaffDocumentEntryContent.jsx', 'screens/staff/analysisResults/StaffAnalysisResultsContent.jsx', 'screens/staff/StaffSubmissionConfirmation.jsx',
    'screens/student/StudentHomeScreen.jsx', 'screens/student/StudentTrackerScreen.jsx', 'screens/student/StudentNotificationsScreen.jsx', 'components/submissions/SubmissionDetailsScreen.jsx',
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
    assert.match(source, /refreshControl=/, file); assert.match(source, /alwaysBounceVertical/, file);
    assert.match(source, file==='screens/SplashScreen.jsx' ? /overScrollMode=\{error \? 'always' : 'never'\}/ : /overScrollMode="always"/, file);
  }
});

test('document-entry refresh refetches reference lists without changing entered values or submitting', async () => {
  const requests = [], writes = [];
  const h = createHarness({
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: args => requests.push(args.queryKey) }) },
    '../../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'AttachmentPreview' },
    '../../../components/common/AccountHeader': { __esModule: true, default: 'AccountHeader' },
    '../../../services/prepareAttachment': {}, '../../../utils/documentScan': {},
    '../../../hooks/useOrganizations': { useOrganizations: () => ({ data: [{ org_id: 3, name: 'Organization' }] }), useOrganizationUsers: () => ({ data: [] }) },
    '../../../hooks/useCategories': { useCategories: () => ({ data: [] }) },
    '../../../hooks/useDocumentTypes': { useDocumentTypes: () => ({ data: [] }) },
    '../../../hooks/useAcademicYears': { useActiveAcademicYear: () => ({ data: { academic_year_id: 9, year: '2026' } }) },
    '../../../hooks/useSubmissions': { useAutofillDocument: () => ({}) },
  });
  const page = h.instance(h.load('src/screens/staff/docEntry/StaffDocumentEntryContent.jsx').default, { navigation: { navigate: (...args) => writes.push(args) } });
  const title = () => nodes(page.output).find(n => n.props?.accessibilityLabel === 'Document title');
  title().props.onChangeText('Unsaved title'); page.render();
  let organization = nodes(page.output).find(n => n.props?.label === 'Organization');
  organization.props.onChange(organization.props.options[0]); page.render();
  const scroll = nodes(page.output).find(n => n.type === 'ScrollView');
  await scroll.props.refreshControl.props.onRefresh(); page.render();
  assert.equal(title().props.value, 'Unsaved title');
  organization = nodes(page.output).find(n => n.props?.label === 'Organization'); assert.equal(organization.props.value.id, 3);
  assert.deepEqual(requests.map(k => k[0]), ['organizations', 'categories', 'document-types', 'academic-years', 'users']);
  assert.equal(writes.length, 0);
});

test('confirmation refresh never creates or uploads; after creation it only retrieves the saved submission', async () => {
  let creates = 0, uploads = 0, gets = 0, emptyRead = false;
  const h = createHarness({
    '../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'AttachmentPreview' },
    '../../services/submissionsService': { submissionsService: {
      async createSubmission() { creates++; return { submission_id: 'saved' }; },
      async uploadSubmissionDocument() { uploads++; },
      async getSubmission(id) { gets++; assert.equal(id, 'saved'); return emptyRead ? null : { submission_id: id, status: 'under_review' }; },
    } },
    '../../components/common/AppDialog': { AppAlert: { alert() {} } },
  });
  const page = h.instance(h.load('src/screens/staff/StaffSubmissionConfirmation.jsx').default, { navigation: {}, route: { params: { draft: { title: 'Local draft' } } } });
  const refresh = () => nodes(page.output).find(n => n.type === 'ScrollView').props.refreshControl.props.onRefresh();
  await refresh(); assert.equal(creates + uploads + gets, 0);
  const confirm = nodes(page.output).find(n => n.type === 'TouchableOpacity' && textOf(n).includes('Confirm and submit'));
  await confirm.props.onPress(); page.render(); assert.equal(creates, 1);
  await refresh(); page.render(); assert.equal(gets, 1); assert.equal(creates, 1); assert.equal(uploads, 0);
  assert.match(textOf(page.output), /Submission created successfully/);
  emptyRead = true; await refresh(); page.render();
  assert.match(textOf(page.output), /Submission created successfully/);
  assert.equal(nodes(page.output).some(n => n.type === 'TouchableOpacity' && textOf(n).includes('Confirm and submit')), false, 'An invalid refresh cannot reopen creation and duplicate the submission');
  assert.equal(creates, 1);
});
