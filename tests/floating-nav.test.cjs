const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createBottomNavScroll } = require('../src/utils/bottomNavScroll.cjs');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...(Array.isArray(value) ? value : [value]));
const event = (y, content = 2000, viewport = 600) => ({ nativeEvent: { contentOffset: { y }, contentSize: { height: content }, layoutMeasurement: { height: viewport } } });

test('downward intent hides, upward intent reveals; samples do not notify unless visibility changes', () => {
  const behavior = createBottomNavScroll(); const changes = [];
  behavior.subscribe(value => changes.push(value));
  const scroll = behavior.scrollProps;
  scroll.onScrollBeginDrag(event(0));
  for (const y of [5, 10, 12, 18, 26, 31]) scroll.onScroll(event(y));
  assert.equal(behavior.isHidden(), false);
  scroll.onScroll(event(32)); assert.equal(behavior.isHidden(), true);
  for (let y = 33; y <= 200; y++) scroll.onScroll(event(y));
  scroll.onScroll(event(196)); assert.equal(behavior.isHidden(), true);
  scroll.onScroll(event(192)); assert.equal(behavior.isHidden(), false);
  assert.deepEqual(changes, [true, false]);
});

test('tiny direction reversals do not flicker, and top/refresh always restore navigation', () => {
  const behavior = createBottomNavScroll(); const s = behavior.scrollProps;
  s.onScrollBeginDrag(event(100)); s.onScroll(event(122));
  for (const y of [120, 123, 119, 122, 118]) s.onScroll(event(y));
  assert.equal(behavior.isHidden(), true);
  s.onScroll(event(9)); assert.equal(behavior.isHidden(), false);
  s.onScroll(event(-50)); s.onScroll(event(0)); assert.equal(behavior.isHidden(), false);
});

test('short content and elastic bottom overscroll cannot hide or falsely reveal the bar', () => {
  const short = createBottomNavScroll().scrollProps;
  const behavior = createBottomNavScroll(); const s = behavior.scrollProps;
  s.onScrollBeginDrag(event(1300)); s.onScroll(event(1400));
  assert.equal(behavior.isHidden(), true);
  for (const y of [1450, 1470, 1420, 1400]) s.onScroll(event(y));
  assert.equal(behavior.isHidden(), true, 'Bounce back to the real bottom is not up-scroll');
  s.onScroll(event(1391)); assert.equal(behavior.isHidden(), false);
  const tiny = createBottomNavScroll();
  tiny.scrollProps.onScrollBeginDrag(event(0, 400));
  tiny.scrollProps.onScroll(event(100, 400)); assert.equal(tiny.isHidden(), false);
  assert.equal(short.scrollEventThrottle, 16);
});

test('programmatic keyboard/layout scrolling is ignored, momentum is supported, and screens are isolated', () => {
  const a = createBottomNavScroll(), b = createBottomNavScroll(); const s = a.scrollProps;
  s.onScroll(event(500)); assert.equal(a.isHidden(), false);
  s.onScrollBeginDrag(event(500)); s.onScroll(event(525)); s.onScrollEndDrag();
  assert.equal(a.isHidden(), true); assert.equal(b.isHidden(), false);
  s.onScroll(event(400)); assert.equal(a.isHidden(), true, 'Keyboard scrollTo cannot flip direction');
  s.onMomentumScrollBegin(event(400)); s.onScroll(event(390)); s.onMomentumScrollEnd();
  assert.equal(a.isHidden(), false);
  s.onScroll(event(NaN)); s.onScroll({}); assert.equal(a.isHidden(), false);
  s.onScrollBeginDrag(event(300)); s.onScroll(event(325)); a.show();
  assert.equal(a.isHidden(), false);
});

test('focus restores a cached tab without changing its controller or scroll position', () => {
  let focus, removed = 0;
  const navigation = { addListener(name, callback) { assert.equal(name, 'focus'); focus = callback; return () => removed++; } };
  const h = createHarness(); const useScroll = h.load('src/hooks/useBottomNavScroll.js').default;
  const hook = h.instance(() => useScroll(navigation)); const behavior = hook.output;
  behavior.scrollProps.onScrollBeginDrag(event(100)); behavior.scrollProps.onScroll(event(130));
  assert.equal(behavior.isHidden(), true); focus(); assert.equal(behavior.isHidden(), false);
  hook.render(); assert.equal(hook.output, behavior);
  hook.unmount(); assert.equal(removed, 1);
});

test('floating frame fades and slides with the native driver, disables hidden touches and cleans listeners', async () => {
  let reduced = false, removed = 0; const timings = [], accessibility = {}, keyboard = {};
  const h = createHarness({ '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced } });
  const BaseValue = h.native.Animated.Value;
  h.native.Animated.Value = class extends BaseValue {
    // Native interpolation nodes stay attached and read the current parent value;
    // the general harness's one-time numeric result cannot model that contract.
    interpolate(config) { return { __getValue: () => super.interpolate(config) }; }
  };
  const sample = value => value?.__getValue ? value.__getValue() : value;
  h.native.AccessibilityInfo.addEventListener = (name, cb) => { accessibility[name] = cb; return { remove() { removed++; } }; };
  h.native.Keyboard.addListener = (name, cb) => { keyboard[name] = cb; return { remove() { removed++; } }; };
  h.native.Animated.timing = (value, config) => ({ start() { timings.push(config); value.setValue(config.toValue); } });
  const behavior = createBottomNavScroll();
  const frame = h.instance(h.load('src/components/common/BottomNavFrame.jsx').default, { scrollBehavior: behavior, children: 'bar' });
  await Promise.resolve(); frame.render();
  assert.equal(flat(frame.output.props.style).bottom, 8);
  frame.output.props.onLayout({ nativeEvent: { layout: { height: 56 } } });
  behavior.scrollProps.onScrollBeginDrag(event(100)); behavior.scrollProps.onScroll(event(130)); frame.render();
  assert.equal(frame.output.props.pointerEvents, 'none');
  assert.equal(frame.output.props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(sample(flat(frame.output.props.style).opacity), 0);
  assert.ok(sample(flat(frame.output.props.style).transform[0].translateY) >= 56 + 8);
  assert.equal(timings.at(-1).useNativeDriver, true); assert.equal(timings.at(-1).isInteraction, false);
  assert.equal(timings.at(-1).duration, 240);
  behavior.scrollProps.onScroll(event(120)); frame.render();
  assert.equal(frame.output.props.pointerEvents, 'box-none');
  assert.equal(sample(flat(frame.output.props.style).opacity), 1);
  reduced = true; const before = timings.length;
  behavior.scrollProps.onScroll(event(160)); frame.render(); assert.equal(timings.length, before);
  keyboard.keyboardDidShow(); frame.render(); assert.equal(sample(flat(frame.output.props.style).opacity), 0);
  keyboard.keyboardDidHide(); behavior.show(); frame.render(); assert.equal(sample(flat(frame.output.props.style).opacity), 1);
  frame.unmount(); assert.equal(removed, 3);
  behavior.scrollProps.onScrollBeginDrag(event(100)); behavior.scrollProps.onScroll(event(130)); // unsubscribed
});

test('screen-reader changes and overlay visibility keep navigation reachable, including stale preference reads', async () => {
  let resolve, change, overlay = false;
  const h = createHarness({ './OverlayPortal': { useIsOverlayOpen: () => overlay }, '../../hooks/useReducedMotion': { __esModule: true, default: () => true } });
  h.native.AccessibilityInfo.isScreenReaderEnabled = () => new Promise(r => { resolve = r; });
  h.native.AccessibilityInfo.addEventListener = (_, cb) => { change = cb; return { remove() {} }; };
  const behavior = createBottomNavScroll();
  const frame = h.instance(h.load('src/components/common/BottomNavFrame.jsx').default, { scrollBehavior: behavior });
  behavior.scrollProps.onScrollBeginDrag(event(100)); behavior.scrollProps.onScroll(event(130)); frame.render();
  assert.equal(frame.output.props.pointerEvents, 'box-none');
  change(true); resolve(false); await Promise.resolve(); frame.render();
  assert.equal(frame.output.props.pointerEvents, 'box-none', 'Late initial read cannot override live TalkBack');
  change(false); frame.render(); assert.equal(frame.output.props.pointerEvents, 'none');
  overlay = true; frame.render(); assert.equal(frame.output.props.pointerEvents, 'box-none');
  frame.unmount();
});

test('icon-only navigation retains accessible names, selected state and instant actions at all text sizes', () => {
  const h = createHarness(); let calls = 0;
  const Item = h.load('src/components/common/BottomNavItem.jsx').default;
  const item = h.instance(Item, { label: 'Submissions', shortLabel: 'History', icon: 'file-text', selected: true, onPress: () => calls++ });
  assert.equal(textOf(item.output), '');
  assert.equal(item.output.props.accessibilityLabel, 'Submissions');
  assert.equal(item.output.props.accessibilityState.selected, true);
  assert.ok(flat(item.output.props.style).minWidth >= 48);
  item.output.props.onPress(); assert.equal(calls, 1);
  h.native.useWindowDimensions = () => ({ width: 320, height: 600, fontScale: 2 }); item.render();
  assert.equal(textOf(item.output), ''); assert.equal(item.output.props.accessibilityLabel, 'Submissions');
  assert.equal(flat(item.output.props.style).flex, 1);
});

test('all navbar screens wire their own main scroll surface while leaving refresh, pagination and keyboard props intact', () => {
  const files = [
    'screens/staff/StaffReviewPanel.jsx', 'screens/staff/GDriveSync.jsx', 'screens/staff/home/StaffSubmissionHistory.jsx',
    'screens/student/StudentHomeScreen.jsx', 'screens/student/StudentTrackerScreen.jsx', 'screens/student/StudentNotificationsScreen.jsx',
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
    assert.match(source, /useBottomNavScroll\(navigation\)/, file);
    assert.match(source, /<(?:ScrollView|KeyboardAwareScrollView|FlatList) \{\.\.\.navScroll.scrollProps\}/, file);
    assert.match(source, /<(?:StaffBottomNav|StudentBottomNav) scrollBehavior=\{navScroll\}/, file);
    assert.match(source, /refreshControl=/, file);
  }
  const details = fs.readFileSync(path.join(__dirname, '../src/components/submissions/SubmissionDetailsScreen.jsx'), 'utf8');
  assert.doesNotMatch(details, /<(?:StaffBottomNav|StudentBottomNav)/, 'Details use the approved back navigation without a bottom navbar');
  assert.match(details, /refreshControl=/, 'Details still support pull to refresh');
  for (const [root, child] of [['StaffHomeScreen', 'home/StaffHomeContent'], ['StaffDocumentEntry', 'docEntry/StaffDocumentEntryContent'], ['StaffAnalysisResults', 'analysisResults/StaffAnalysisResultsContent']]) {
    const parent = fs.readFileSync(path.join(__dirname, '../src/screens/staff', root + '.jsx'), 'utf8');
    const content = fs.readFileSync(path.join(__dirname, '../src/screens/staff', child + '.jsx'), 'utf8');
    assert.match(parent, /navScroll=\{navScroll\}/); assert.match(parent, /scrollBehavior=\{navScroll\}/);
    assert.match(content, /\{\.\.\.navScroll\?\.scrollProps\}/);
  }
});

test('downward scrolling hides the navbar as promptly as upward scrolling reveals it without pull-slop or double-momentum resets', async () => {
  const { nav } = createHarness().load('src/theme/tokens.js');
  assert.equal(nav.scroll.hideDistance, nav.scroll.revealDistance);
  assert.equal(nav.scroll.hideDistance, 8);
  assert.equal(nav.scroll.topEdge, 8);

  const behavior = createBottomNavScroll(nav.scroll);
  const s = behavior.scrollProps;
  s.onScrollBeginDrag(event(0));
  s.onScroll(event(8));
  assert.equal(behavior.isHidden(), false);
  s.onScroll(event(16));
  assert.equal(behavior.isHidden(), true, 'Downward scroll triggers hiding at the same 8px threshold past topEdge as upward reveal');
  s.onScroll(event(8));
  assert.equal(behavior.isHidden(), false);

  const shared = [], gestures = [];
  let layoutEffects = 0;
  const h = createHarness({
    '../../hooks/useReducedMotion': { __esModule: true, default: () => false },
    './OverlayPortal': { useIsOverlayOpen: () => false },
  });
  const baseLayoutEffect = h.mocks.react.useLayoutEffect;
  h.mocks.react.useLayoutEffect = (cb, deps) => { layoutEffects++; return baseLayoutEffect(cb, deps); };
  const gesture = kind => {
    const value = { kind, handlers: {}, config: {} };
    for (const name of ['enabled', 'manualActivation', 'maxPointers', 'blocksExternalGesture']) value[name] = option => { value.config[name] = option; return value; };
    for (const name of ['onTouchesDown', 'onTouchesMove', 'onStart', 'onUpdate', 'onEnd', 'onFinalize']) value[name] = callback => { value.handlers[name] = callback; return value; };
    gestures.push(value); return value;
  };
  h.mocks['react-native-gesture-handler'] = { GestureDetector: 'GestureDetector', Gesture: { Pan: () => gesture('pan'), Native: () => gesture('native') } };
  h.native.TurboModuleRegistry = { get: () => ({}) };
  h.mocks['react-native-reanimated'] = {
    __esModule: true, default: { View: 'AnimatedView', ScrollView: 'ScrollView', FlatList: 'FlatList' },
    useSharedValue(initial) { const value = h.mocks.react.useRef({ value: initial }).current; if (!shared.includes(value)) shared.push(value); return value; },
    useAnimatedStyle: callback => callback(),
    useAnimatedScrollHandler: handlers => handlers,
    cancelAnimation() {}, runOnJS: callback => callback,
    withSpring: toValue => toValue,
  };
  const { PullRefreshScrollView } = h.load('src/components/common/PullRefresh.jsx');
  const pullBehavior = createBottomNavScroll(nav.scroll);
  const wrapper = h.instance(PullRefreshScrollView, {
    ...pullBehavior.scrollProps,
    refreshControl: { props: { refreshing: false, onRefresh() {} } },
  });
  const view = h.instance(wrapper.output.type, wrapper.output.props);
  await Promise.resolve();
  view.render();
  const inner = nodes(view.output).find(n => n.type === 'ScrollView');
  assert.equal(inner.props.onScrollBeginDrag, undefined);
  assert.equal(inner.props.onScrollEndDrag, undefined);
  assert.equal(inner.props.onMomentumScrollBegin, undefined);
  assert.equal(inner.props.onMomentumScrollEnd, undefined);
  assert.equal(typeof inner.props.onScroll.onBeginDrag, 'function');
  assert.equal(typeof inner.props.onScroll.onEndDrag, 'function');

  // Upward finger drag (scrolling down from y=0) fails pull gesture early at dy = -5
  const pan = gestures.find(g => g.kind === 'pan');
  let failed = false;
  const mgr = { fail() { failed = true; }, activate() {} };
  pan.handlers.onTouchesDown({ numberOfTouches: 1, allTouches: [{ absoluteX: 0, absoluteY: 100 }] }, mgr);
  assert.equal(failed, false);
  pan.handlers.onTouchesMove({ numberOfTouches: 1, allTouches: [{ absoluteX: 0, absoluteY: 95 }] }, mgr);
  assert.equal(failed, true);

  inner.props.onScroll.onBeginDrag(event(0).nativeEvent);
  inner.props.onScroll.onScroll(event(16).nativeEvent);
  assert.equal(pullBehavior.isHidden(), true);

  const Frame = h.load('src/components/common/BottomNavFrame.jsx').default;
  const frame = h.instance(Frame, { scrollBehavior: pullBehavior, children: 'bar' });
  assert.ok(layoutEffects > 0, 'BottomNavFrame uses useLayoutEffect for immediate commit-time animation start');
  frame.unmount();
  view.unmount();
});

test('pill pagination renders Previous/Next pill buttons, ellipsis gaps, and tight bottom spacing', () => {
  const h = createHarness();
  const Pagination = h.load('src/components/submissions/SubmissionPagination.jsx').default;
  const p = h.instance(Pagination, { currentPage: 2, totalPages: 17, onPageChange() {} });
  const text = textOf(p.output);
  assert.match(text, /Previous/);
  assert.match(text, /Next/);
  assert.match(text, /\.\.\./);
  assert.equal(p.output.props.style.borderRadius, 999);
  assert.equal(p.output.props.className, 'mt-1');
});
