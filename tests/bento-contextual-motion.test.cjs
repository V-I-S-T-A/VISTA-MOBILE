const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...[value].flat());

test('sheet keeps its content through exit, reverses from the displayed pose and restores focus only after release', () => {
  let reduced = false;
  const timings = [], focus = []; let entryFrame;
  const h = createHarness({
    './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true, useOverlayActive: () => true },
    '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced },
  }, { requestAnimationFrame(callback) { entryFrame = callback; return 1; }, cancelAnimationFrame() {} });
  h.native.Animated.timing = (value, config) => ({ start(finish) { timings.push({ value, config, finish }); } });
  h.native.AccessibilityInfo.setAccessibilityFocus = node => focus.push(node);
  const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
  const host = h.instance(Sheet, { visible: true, title: 'Original title', children: 'Unsent draft', returnFocusRef: { current: 'trigger' } });
  const surface = h.instance(host.output.props.children.type, host.output.props.children.props);
  const panel = nodes(surface.output).find(node => node.props?.onLayout);
  panel.props.onLayout({ nativeEvent: { layout: { height: 280 } } });
  entryFrame();
  const offset = timings.at(-1).value;
  timings.at(-1).finish({ finished: true });
  host.render({ ...host.props, visible: false, children: null, title: '' });
  surface.render(host.output.props.children.props);
  assert.match(textOf(surface.output), /Original titleUnsent draft/);
  assert.equal(timings.at(-1).config.toValue, 280);
  assert.equal(timings.at(-2).config.toValue, 0);
  assert.equal(nodes(surface.output).find(node => node.props?.onLayout).props.pointerEvents, 'none');
  assert.deepEqual(focus, []);
  const staleExit = timings.at(-1).finish;
  offset.setValue(120);
  host.render({ ...host.props, visible: true, title: 'Reopened', children: 'Kept draft' });
  surface.render(host.output.props.children.props);
  assert.equal(offset.value, 120, 'Reversal continues from the presented offset');
  entryFrame();
  assert.equal(timings.at(-1).config.toValue, 0);
  staleExit({ finished: true }); host.render(); assert.ok(host.output);
  host.render({ ...host.props, visible: false }); surface.render(host.output.props.children.props);
  timings.at(-1).finish({ finished: true }); host.render();
  assert.equal(host.output, null);
  assert.deepEqual(focus, ['trigger']);
  surface.unmount(); host.unmount();
});

test('reduced motion cancels an exiting sheet and stale completion cannot retain a hidden overlay', () => {
  let reduced = false, entryFrame; const timelines = [];
  const h = createHarness({
    './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true, useOverlayActive: () => true },
    '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced },
  }, { requestAnimationFrame(callback) { entryFrame = callback; return 1; }, cancelAnimationFrame() {} });
  h.native.Animated.timing = (value, config) => ({ start(finish) { timelines.push({ value, config, finish }); } });
  const host = h.instance(h.load('src/components/common/AppBottomSheet.jsx').default, { visible: true });
  const surface = h.instance(host.output.props.children.type, host.output.props.children.props);
  nodes(surface.output).find(node => node.props?.onLayout).props.onLayout({ nativeEvent: { layout: { height: 240 } } });
  entryFrame();
  host.render({ visible: false }); surface.render(host.output.props.children.props);
  const pendingExit = timelines.at(-1).finish, count = timelines.length;
  reduced = true; surface.render(); host.render();
  assert.equal(host.output, null); assert.equal(timelines.length, count);
  pendingExit({ finished: true }); host.render(); assert.equal(host.output, null);
  surface.unmount(); host.unmount();
});

test('button feedback is native-driven and never moves the touch target or delays the action', () => {
  let reduced = false, pressed = 0, pressIn = 0; const timelines = [];
  const h = createHarness({ './useReducedMotion': { __esModule: true, default: () => reduced } });
  h.native.Animated.timing = (value, config) => ({ start() { timelines.push({ value, config }); } });
  const button = h.instance(h.load('src/components/common/AppButton.jsx').default, { label: 'Continue', onPress: () => pressed++, onPressIn: () => pressIn++ });
  assert.equal(flat(button.output.props.style).minHeight, 48);
  assert.equal(flat(button.output.props.style).transform, undefined);
  button.output.props.onPressIn(); button.output.props.onPress();
  assert.equal(pressed, 1); assert.equal(pressIn, 1);
  assert.equal(timelines.at(-1).config.toValue, .96);
  assert.equal(timelines.at(-1).config.useNativeDriver, true);
  button.output.props.onPressOut(); assert.equal(timelines.at(-1).config.toValue, 1);
  reduced = true; button.render(); const count = timelines.length;
  button.output.props.onPressIn(); assert.equal(timelines.length, count);
  button.render({ ...button.props, busy: true });
  assert.equal(button.output.props.disabled, true);
  assert.equal(button.output.props.accessibilityState.busy, true);
  button.unmount();
});

test('dashboard summaries and loading reflow together for a narrow viewport and measured containers', () => {
  const h = createHarness();
  h.native.useWindowDimensions = () => ({ width: 320, fontScale: 1 });
  const Cards = h.load('src/components/submissions/SubmissionDashboardCards.jsx').default;
  const summary = h.instance(Cards, { total: 10 });
  assert.deepEqual(Array.from(summary.output.props.children, row => row.props.children.length), [2, 2]);
  const loading = h.instance(Cards, { isLoading: true });
  const skeleton = h.instance(loading.output.type, loading.output.props);
  assert.deepEqual(Array.from(skeleton.output.props.children, row => row.props.children.length), [2, 2]);
  h.native.useWindowDimensions = () => ({ width: 480, fontScale: 1 });
  const wider = h.instance(Cards, {});
  assert.deepEqual(Array.from(wider.output.props.children, row => row.props.children.length), [2, 2]);
  wider.output.props.onLayout({ nativeEvent: { layout: { width: 240 } } }); wider.render();
  assert.deepEqual(Array.from(wider.output.props.children, row => row.props.children.length), [1, 1, 1, 1]);
});

test('notification failures keep cached rows while authentication failures hide them; rapid taps open one sheet', () => {
  let refreshes = 0, writes = 0;
  const row = { notification_id: 'n1', submission_id: 's1', is_read: false, created_at: new Date().toISOString() };
  const query = { data: { results: [row], unread_count: 1 }, isError: true, error: { status: 503 }, refetch: () => refreshes++ };
  const h = createHarness({
    '../../hooks/useStudentNotifications': { useNotifications: () => query, useMarkNotificationRead: () => ({ mutateAsync: () => writes++ }) },
    '../../context/AuthContext': { useAuth: () => ({ role: 'student' }) },
  });
  const bell = h.instance(h.load('src/components/students/StudentNotificationBell.jsx').default);
  const trigger = nodes(bell.output).find(node => node.props?.accessibilityLabel === 'Notifications, 1 unread');
  for (let i = 0; i < 3; i++) trigger.props.onPress(); bell.render();
  const sheets = nodes(bell.output).filter(node => node.type?.name === 'AppBottomSheet');
  assert.equal(sheets.length, 1); assert.equal(sheets[0].props.visible, true);
  assert.equal(nodes(bell.output).find(node => node.type === 'FlatList').props.data[0], row);
  assert.ok(nodes(bell.output).some(node => node.type?.name === 'StaleWarningBanner'));
  assert.equal(refreshes, 3); assert.equal(writes, 0);
  for (const status of [401, 403]) {
    query.error = { status }; bell.render();
    assert.equal(nodes(bell.output).find(node => node.type === 'FlatList'), undefined);
    assert.ok(nodes(bell.output).some(node => node.type?.name === 'ContentState'));
  }
});

test('dashboards keep their original summary-to-recent layout without extra quick-action tiles', () => {
  for (const role of ['staff', 'student']) {
    const navigated = [];
    const navigation = { navigate: (...args) => navigated.push(args) };
    const auth = { useAuth: () => ({ user: { user_id: 'viewer', role }, role }) };
    const submissions = { useSubmissions: () => ({ data: { results: [] } }) };
    const refresh = { useScreenRefresh: () => ({}) };
    const h = createHarness({
      '@react-navigation/native': { useNavigation: () => navigation },
      '@tanstack/react-query': { useQueries: () => Array.from({ length: 4 }, () => ({ data: { count: 1 } })) },
      '../../../context/AuthContext': auth, '../../context/AuthContext': auth, '../context/AuthContext': auth,
      '../../../hooks/useSubmissions': submissions, '../../hooks/useSubmissions': submissions,
      '../../../hooks/useScreenRefresh': refresh, '../../hooks/useScreenRefresh': refresh,
    });
    const file = role === 'staff' ? 'src/screens/staff/home/StaffHomeContent.jsx' : 'src/screens/student/StudentHomeScreen.jsx';
    const screen = h.instance(h.load(file).default, { navigation });
    const action = nodes(screen.output).find(node => node.type?.name === 'DashboardQuickAction');
    assert.equal(action, undefined);
    const recent = nodes(screen.output).find(node => node.type?.name === 'RecentSubmissions');
    const recentTree = recent ? h.instance(recent.type, recent.props).output : screen.output;
    const heading = nodes(recentTree).find(node => node.type?.name === 'RecentSubmissionsHeading');
    assert.ok(heading); heading.props.onViewAll();
    assert.deepEqual(JSON.parse(JSON.stringify(navigated)), [[role === 'staff' ? 'StaffReviewPanel' : 'StudentTracker']]);
  }
});

test('guide expansion uses the shared contextual duration and a live reduced-motion change removes layout motion', () => {
  let reduced = false;
  const h = createHarness({
    '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced },
    '../../context/AuthContext': { useAuth: () => ({ user: {}, role: 'student' }) },
    'react-native-reanimated': { __esModule: true, default: { View: 'AnimatedView' }, LinearTransition: { duration: duration => ({ duration }) } },
  });
  const screen = h.instance(h.load('src/screens/shared/UserGuideScreen.jsx').default, { navigation: {} });
  const cards = () => nodes(screen.output).filter(node => node.type === 'AnimatedView');
  assert.ok(cards().length >= 9);
  assert.ok(cards().every(node => node.props.layout.duration === h.load('src/theme/tokens.js').motion.contextual));
  reduced = true; screen.render();
  assert.ok(cards().every(node => node.props.layout === undefined));
});
