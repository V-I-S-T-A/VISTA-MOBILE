const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...(Array.isArray(value) ? value : [value]));

test('motion preference handles live changes, a late initial read, and unmount cleanup', async () => {
  const h = createHarness(); let resolve, change, removed = 0;
  h.native.AccessibilityInfo.isReduceMotionEnabled = () => new Promise(r => { resolve = r; });
  h.native.AccessibilityInfo.addEventListener = (event, callback) => {
    assert.equal(event, 'reduceMotionChanged'); change = callback;
    return { remove() { removed++; } };
  };
  const useReducedMotion = h.load('src/hooks/useReducedMotion.js').default;
  const view = h.instance(() => useReducedMotion());
  assert.equal(view.output, true, 'Initial preference must not flash motion');
  change(true); resolve(false); await Promise.resolve();
  assert.equal(view.render(), true, 'An older read must not override a system-settings change');
  change(false); assert.equal(view.render(), false);
  view.unmount(); change(true); assert.equal(removed, 1);
  assert.equal(view.state[0], false, 'Unmounted subscriptions cannot update state');
});

test('pill navigation retains immediate actions, stable press bounds and cancellable press motion', async () => {
  const h = createHarness(); let change, calls = 0, timings = 0, stops = 0;
  h.native.AccessibilityInfo.addEventListener = (_, callback) => { change = callback; return { remove() {} }; };
  h.native.Animated.Value.prototype.interpolate = function (config) { return { config, value: this.value }; };
  h.native.Animated.Value.prototype.stopAnimation = () => { stops++; };
  h.native.Animated.timing = (value, config) => { timings++; return { start() { value.setValue(config.toValue); } }; };
  const Item = h.load('src/components/common/BottomNavItem.jsx').default;
  const tokens = h.load('src/theme/tokens.js');
  const item = h.instance(Item, { label: 'Submissions', icon: 'file-text', onPress: () => calls++ });
  await Promise.resolve(); item.render();
  item.render({ ...item.props, selected: true });
  const resting = flat(item.output.props.style);
  assert.equal(resting.minHeight, 48); assert.equal(resting.minWidth, 48);
  assert.equal(resting.flex, 1, 'Each static slot must share the complete bar width');
  assert.equal(item.output.props.activeOpacity, tokens.motion.pressedOpacity);
  assert.equal(item.output.props.accessibilityState.selected, true);
  item.output.props.onPress(); assert.equal(calls, 1, 'Navigation must not wait for animation completion');
  const circle = nodes(item.output).find(n => n.type === 'AnimatedView');
  assert.equal(flat(circle.props.style).minWidth, flat(circle.props.style).height);
  assert.equal(flat(circle.props.style).backgroundColor, undefined, 'Regular icons retain transparent wrappers');
  change(true); item.render();
  const before = timings;
  item.render({ ...item.props, selected: false });
  assert.equal(timings, before, 'Reduced motion changes selection without a timing animation');
  item.unmount(); assert.ok(stops >= 2);
});

test('all staff actions and role-specific student destinations remain in their original order', () => {
  const calls = [], h = createHarness({ '@react-navigation/native': { useNavigation: () => ({ navigate: name => calls.push(name) }) } });
  const staff = h.instance(h.load('src/components/staff/StaffBottomNav.jsx').default, {
    activeTab: 'reports', onHomePress: () => calls.push('home'), onProfilePress: () => calls.push('entry'),
    onScanPress: () => calls.push('scan'), onReportsPress: () => calls.push('reviews'), onCloudPress: () => calls.push('drive'),
  });
  const staffItems = nodes(staff.output).filter(n => n.type?.name === 'BottomNavItem');
  assert.deepEqual(staffItems.map(n => n.props.label), ['Home', 'Document entry', 'Scan document', 'Submissions', 'Google Drive']);
  staffItems.forEach(n => n.props.onPress());
  assert.deepEqual(calls, ['home', 'entry', 'scan', 'reviews', 'drive']);
  assert.equal(staffItems.filter(n => n.props.selected).length, 1);
  assert.equal(staffItems[3].props.selected, true);
  const student = h.instance(h.load('src/components/students/StudentBottomNav.jsx').default, {
    activeTab: 'tracker', onHomePress: () => calls.push('student-home'), onTrackerPress: () => calls.push('tracker'),
  });
  const items = nodes(student.output).filter(n => n.type?.name === 'BottomNavItem');
  assert.deepEqual(items.map(n => n.props.label), ['Home', 'Review tracker', 'All notifications']);
  items.forEach(n => n.props.onPress());
  assert.deepEqual(calls.slice(-3), ['student-home', 'tracker', 'StudentNotifications']);
});

test('floating-bar clearance includes safe area and leaves final content above the floating pill', () => {
  for (const width of [320, 360, 600, 844]) for (const bottom of [0, 24, 34]) {
    const h = createHarness();
    h.native.useWindowDimensions = () => ({ width, height: 900, fontScale: 2 });
    h.mocks['react-native-safe-area-context'].useSafeAreaInsets = () => ({ top: 24, left: 0, right: 0, bottom });
    const { useBottomNavClearance, navigationStyles } = h.load('src/theme/layout.js');
    const { compact, nav, sizes } = h.load('src/theme/tokens.js');
    const clearance = useBottomNavClearance();
    assert.equal(clearance, compact.navHeight + Math.max(bottom, nav.bottomGap) + compact.footerGap);
    const renderedBarHeight = Math.max(sizes.touch, nav.indicator) + nav.padding * 2;
    assert.equal(compact.navHeight, renderedBarHeight, 'Clearance must include the actual control height and both shell paddings');
    const protrusion = Math.max(0, nav.lift - nav.padding);
    assert.ok(clearance > compact.navHeight + Math.max(bottom, nav.bottomGap) + protrusion);
    assert.ok((Math.min(width - 24, sizes.contentWidth) - navigationStyles.shell.paddingHorizontal * 2) / 5 >= nav.indicator,
      'Five circles must fit independently on a small phone');
  }
});

test('secondary routes use brief platform-native motion while core destinations and first-login routing remain stable', () => {
  for (const platform of ['android', 'ios']) for (const role of ['Staff', 'Student']) for (const reduced of [false, true]) {
    const file = `src/navigation/${role}Navigator.jsx`;
    const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
    const mocks = {
      './createPushStackNavigator': { createPushStackNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) },
      '../context/AuthContext': { useAuth: () => ({ user: { is_first_login: true } }) },
      '../hooks/useReducedMotion': { default: () => reduced, __esModule: true },
    };
    for (const [, name] of source.matchAll(/from ["'](\.\.\/screens\/[^"']+)["']/g)) mocks[name] = { default: 'Page', __esModule: true };
    const h = createHarness(mocks);
    h.native.Platform.OS = platform;
    const tree = h.instance(h.load(file).default).output;
    assert.equal(tree.props.initialRouteName, `${role}Profile`);
    const expected = reduced ? 'none' : platform === 'ios' ? 'simple_push' : 'ios_from_right';
    assert.equal(tree.props.screenOptions.animation, expected, 'Tab and main destinations use directional push/pop transitions unless motion is reduced');
    assert.equal(tree.props.screenOptions.animationDuration, h.load('src/theme/tokens.js').motion.tab);
    const routes = nodes(tree).filter(n => n.type === 'Screen');
    const detail = routes.find(n => n.props.name === (role === 'Staff' ? 'ReviewPanelDetails' : 'StudentSubmissionDetails'));
    assert.equal(detail.props.options.animation, expected);
    const settings = routes.find(n => n.props.name === 'Settings');
    assert.equal(settings.props.options.animation, expected);
    assert.equal(detail.props.options.animationDuration, h.load('src/theme/tokens.js').motion.page);
    assert.equal(settings.props.options.animationDuration, 180, 'The iOS push uses the short page-motion duration');
    if (role === 'Staff') {
      for (const name of ['StaffSubmissionConfirmation', 'StaffAnalysisResults', 'StaffSubmissionHistory', 'StaffNotifications', 'StaffProfile', 'StaffSettings', 'UserGuide', 'LegalDocument', 'NotificationPreferences']) {
        assert.equal(routes.find(n => n.props.name === name).props.options.animation, expected, `${name} uses hierarchical push/pop`);
      }
      for (const name of ['StaffHome', 'StaffDocumentEntry', 'StaffReviewPanel', 'GDriveSync']) {
        assert.equal(routes.find(n => n.props.name === name).props.options.animation, undefined, `${name} inherits directional push/pop from screenOptions`);
        assert.equal(routes.find(n => n.props.name === name).props.options.bottomNav, true);
      }
    } else {
      for (const name of ['StudentProfile', 'StudentSettings', 'UserGuide', 'LegalDocument', 'NotificationPreferences']) {
        assert.equal(routes.find(n => n.props.name === name).props.options.animation, expected, `${name} uses hierarchical push/pop`);
      }
      for (const name of ['StudentHome', 'StudentTracker', 'StudentNotifications']) {
        assert.equal(routes.find(n => n.props.name === name).props.options.animation, undefined, `${name} inherits directional push/pop from screenOptions`);
        assert.equal(routes.find(n => n.props.name === name).props.options.bottomNav, true);
      }
    }
    assert.ok(routes.some(n => n.props.name === `${role}Home`));
    assert.ok(routes.some(n => n.props.name === `${role}Notifications`));
    assert.ok(routes.some(n => n.props.name === 'UserGuide'));
  }
});

test('confirmation motion changes with preferences and guarded dismissal remains intact', async () => {
  const h = createHarness(); let change, closed = 0;
  h.native.AccessibilityInfo.addEventListener = (_, callback) => { change = callback; return { remove() {} }; };
  const Modal = h.load('src/components/common/AppModal.jsx').default;
  const modal = h.instance(Modal, { visible: true, dismissible: false, onClose: () => closed++ });
  assert.equal(modal.output.props.animationType, 'none');
  await Promise.resolve(); modal.render(); assert.equal(modal.output.props.animationType, 'none', 'Only the inner card/scrim animate, avoiding duplicate native transitions');
  const timings = [];
  h.native.Animated.timing = (value, config) => ({ start() { timings.push(config); } });
  const surface = h.instance(modal.output.props.children.type, modal.output.props.children.props);
  assert.equal(timings.length, 1);
  assert.equal(timings[0].toValue, 1);
  assert.equal(timings[0].useNativeDriver, true);
  modal.output.props.onRequestClose(); assert.equal(closed, 0);
  change(true); modal.render({ ...modal.props, dismissible: true });
  assert.equal(modal.output.props.animationType, 'none');
  surface.render(modal.output.props.children.props);
  assert.equal(timings.length, 1, 'Reduced motion sets the end state without starting another timeline');
  modal.output.props.onRequestClose(); assert.equal(closed, 1);
  surface.unmount(); modal.unmount();
});

test('search focus is visible without changing the query or filter callbacks', () => {
  const h = createHarness(), changes = []; let filtered = 0;
  const Search = h.load('src/screens/staff/reviewPanel/StaffReviewSearch.jsx').default;
  const search = h.instance(Search, { searchQuery: 'kept', setSearchQuery: value => changes.push(value), onFilterPress: () => filtered++ });
  const input = () => nodes(search.output).find(n => n.props?.accessibilityLabel === 'Search submissions');
  input().props.onFocus(); search.render();
  assert.ok(nodes(search.output).some(n => n.props?.style?.borderColor === '#1A59A5'));
  assert.equal(input().props.value, 'kept');
  input().props.onChangeText('next'); assert.deepEqual(changes, ['next']);
  nodes(search.output).find(n => n.props?.accessibilityLabel === 'Filter submissions').props.onPress();
  assert.equal(filtered, 1);
  input().props.onBlur(); search.render();
  assert.ok(!nodes(search.output).some(n => n.props?.style?.borderColor === '#1A59A5'));
});

test('sheet close uses a stable full-size touch target and busy sheets cannot dismiss', () => {
  const h = createHarness({ './OverlayPortal': { useOverlayAvailable: () => false, useOverlayActive: () => true } });
  const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
  let closed = 0;
  const sheet = h.instance(Sheet, { visible: true, title: 'Filter', onClose: () => closed++ });
  const surfaceNode = sheet.output.props.children;
  const surface = h.instance(surfaceNode.type, surfaceNode.props);
  const close = nodes(surface.output).find(n => n.props?.accessibilityLabel === 'Close sheet');
  assert.equal(typeof close.props.style, 'object', 'Geometry is provided statically through the styling bridge');
  assert.equal(flat(close.props.style).minHeight, 48);
  assert.equal(flat(close.props.style).minWidth, 48);
  close.props.onPress(); assert.equal(closed, 1);
  sheet.render({ ...sheet.props, busy: true });
  const busy = sheet.output.props.children;
  surface.render(busy.props);
  const busyClose = nodes(surface.output).find(n => n.props?.accessibilityLabel === 'Close sheet');
  assert.equal(busyClose.props.disabled, true);
  busyClose.props.onPress(); assert.equal(closed, 1);
});
