const { test } = require('node:test');
const assert = require('node:assert/strict');
const { StackRouter, CommonActions, StackActions } = require('@react-navigation/routers');
const { withTabBackBoundaries, backBoundary } = require('../src/navigation/tabBackPolicy.cjs');
const { dragDirection } = require('../src/utils/gestureDirection.cjs');
const { PULL_REFRESH, resistedPull } = require('../src/utils/pullRefreshPolicy.cjs');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

for (const role of ['Staff', 'Student']) test(`${role} main tabs retain cached keys and animation navigation while back only pops nested screens`, () => {
  const roots = role === 'Staff' ? ['StaffHome', 'StaffDocumentEntry', 'StaffReviewPanel', 'GDriveSync'] : ['StudentHome', 'StudentTracker', 'StudentNotifications'];
  const detail = role === 'Staff' ? 'ReviewPanelDetails' : 'StudentSubmissionDetails';
  const routeNames = [...roots, detail, 'Settings'];
  const original = StackRouter({ initialRouteName: roots[0] });
  const router = { ...original, ...withTabBackBoundaries(original) };
  const options = { routeNames, routeParamList: {}, routeGetIdList: Object.fromEntries(roots.map(name => [name, () => 'main-tab'])) };
  let state = router.getInitialState(options); const keys = new Map();
  const apply = action => { const next = router.getStateForAction(state, action, options); if (next) state = next; return next; };
  for (let n = 0; n < 4; n++) for (const name of roots) {
    const expected = original.getStateForAction(state, CommonActions.navigate(name), options);
    apply(CommonActions.navigate(name));
    assert.equal(state.routes.at(-1).name, expected.routes.at(-1).name);
    if (keys.has(name)) assert.equal(state.routes.at(-1).key, keys.get(name));
    else keys.set(name, state.routes.at(-1).key);
    assert.equal(apply(CommonActions.goBack()), null, `${name} has no eligible back parent`);
    assert.equal(apply(StackActions.pop(1)), null);
  }
  assert.equal(state.routes.length, roots.length);
  const parentKey = state.routes.at(-1).key;
  apply(StackActions.push(detail, { submissionId: 'one' })); const firstKey = state.routes.at(-1).key;
  apply(StackActions.push('Settings')); assert.equal(backBoundary(state).depth, 2);
  apply(CommonActions.goBack()); assert.equal(state.routes.at(-1).key, firstKey);
  apply(CommonActions.goBack()); assert.equal(state.routes.at(-1).key, parentKey);
  assert.equal(apply(CommonActions.goBack()), null);
  apply(StackActions.push(detail)); apply(StackActions.push('Settings'));
  apply(StackActions.pop(100)); assert.equal(state.routes.at(-1).key, parentKey);
  apply(StackActions.push(detail)); apply(StackActions.popToTop());
  assert.equal(state.routes.at(-1).key, parentKey, 'Pop-to-top stops at the current tab, not the first visited tab');
});

test('gesture direction requires clear single-axis intent rather than a diagonal or tiny movement', () => {
  for (const [dx, dy, direction] of [[0, 0, null], [8, 4, null], [30, 25, null], [40, 5, 'horizontal'], [5, 40, 'vertical'], [-40, 3, 'horizontal']]) assert.equal(dragDirection(dx, dy), direction);
});

test('Android recognizer never captures a tab root, only claims a nested horizontal edge gesture and cancels safely', () => {
  let state = { key: 'stack', routes: [{ key: 'home', name: 'StaffHome' }, { key: 'history', name: 'StaffReviewPanel' }], index: 1 };
  let overlay = false, pan, backs = 0; const timings = [];
  const descriptors = {};
  const add = route => { descriptors[route.key] = { options: { animation: 'ios_from_right' }, render: () => route.name }; };
  state.routes.forEach(add);
  const h = createHarness({
    '@react-navigation/native': { StackRouter: 'router', createNavigatorFactory: Component => () => ({ Navigator: Component }), useNavigationBuilder: () => ({ state, descriptors, navigation: { canGoBack: () => true, goBack: () => backs++ }, NavigationContent: 'NavigationContent' }) },
    '@react-navigation/native-stack': { createNativeStackNavigator() {} },
    'react-native-screens': { Screen: 'NativeScreen', ScreenContainer: 'NativeContainer' },
    '../components/common/OverlayPortal': { useIsOverlayOpen: () => overlay },
  });
  h.native.PanResponder = { create(config) { pan = config; return { panHandlers: {} }; } };
  h.native.Animated.Value.prototype.interpolate = function (config) { return { source: this, ...config }; };
  h.native.Animated.timing = (value, config) => ({ start(callback) { timings.push(config); value.setValue(config.toValue); callback?.({ finished: true }); } });
  const Navigator = h.load('src/navigation/createPushStackNavigator.jsx').createPushStackNavigator().Navigator;
  const nav = h.instance(Navigator, { screenOptions: {} });
  const drag = { x0: 4, dx: 100, dy: 3, vx: 0.8, numberActiveTouches: 1 };
  pan.onStartShouldSetPanResponderCapture(); assert.equal(pan.onMoveShouldSetPanResponderCapture({}, drag), false);
  const detail = { key: 'detail', name: 'ReviewPanelDetails' }; add(detail);
  state = { ...state, routes: [...state.routes, detail], index: 2 }; nav.render(); nav.render();
  pan.onStartShouldSetPanResponderCapture();
  assert.equal(pan.onMoveShouldSetPanResponderCapture({}, { ...drag, dx: 2, dy: 40 }), false);
  assert.equal(pan.onMoveShouldSetPanResponderCapture({}, drag), false, 'A vertical start cannot turn into a back swipe mid-pull');
  pan.onStartShouldSetPanResponderCapture(); assert.equal(pan.onMoveShouldSetPanResponderCapture({}, { ...drag, x0: 100 }), false);
  pan.onStartShouldSetPanResponderCapture(); assert.equal(pan.onMoveShouldSetPanResponderCapture({}, drag), true);
  pan.onPanResponderGrant(); pan.onPanResponderMove({}, { ...drag, dx: 60 });
  const scene = nodes(nav.output).find(n => n.key === 'detail' && n.type === 'AnimatedView');
  const style = Object.assign({}, ...scene.props.style); assert.ok(style.transform[0].translateX.source.value < 1);
  pan.onPanResponderRelease({}, { ...drag, dx: 40, vx: 0 }); assert.equal(backs, 0);
  assert.equal(timings.at(-1).toValue, 1); assert.equal(timings.at(-1).duration, 180);
  pan.onStartShouldSetPanResponderCapture(); pan.onPanResponderGrant(); pan.onPanResponderRelease({}, drag);
  assert.equal(backs, 1);
  overlay = true; nav.render(); pan.onStartShouldSetPanResponderCapture(); assert.equal(pan.onMoveShouldSetPanResponderCapture({}, drag), false);
  nav.unmount();
});

test('pull distance follows the finger with increasing resistance and a bounded activation threshold', () => {
  assert.equal(resistedPull(-30), 0);
  assert.equal(resistedPull(0), 0);
  assert.ok(resistedPull(80) < PULL_REFRESH.threshold);
  assert.ok(resistedPull(160) > PULL_REFRESH.threshold);
  assert.ok(resistedPull(160) - resistedPull(80) < resistedPull(80));
  assert.ok(resistedPull(10000) < PULL_REFRESH.maxDistance);
});

async function refreshHarness(refresh = async () => {}, options = {}) {
  let focused = true, overlay = false, reduced = false;
  const listeners = {}, springs = [];
  const shared = [], gestures = [];
  let navigating = false; const subscribers = new Set();
  const transition = { isActive: () => navigating, subscribe: listener => { subscribers.add(listener); return () => subscribers.delete(listener); }, setActive: value => { navigating = value; subscribers.forEach(listener => listener()); } };
  const h = createHarness({
    '@react-navigation/native': { useIsFocused: () => focused },
    './OverlayPortal': { useIsOverlayOpen: () => overlay },
    '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced },
    '../../navigation/NavigationTransitionContext': { NavigationTransitionContext: { value: transition } },
  });
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
    withSpring(toValue, config) { springs.push({ toValue, ...config }); return toValue; },
  };
  h.native.Keyboard.addListener = (name, listener) => { listeners[name] = listener; return { remove() { delete listeners[name]; } }; };
  const Wrapper = h.load('src/components/common/PullRefresh.jsx').PullRefreshScrollView;
  const props = { refreshControl: { props: { refreshing: false, onRefresh: refresh } }, ...options };
  const wrapper = h.instance(Wrapper, props);
  const view = h.instance(wrapper.output.type, wrapper.output.props);
  await Promise.resolve(); await Promise.resolve(); view.render();
  const scroll = () => nodes(view.output).find(node => node.type === 'ScrollView');
  const translation = () => ({ get value() { return shared[0].value; }, setValue(value) { shared[0].value = value; } });
  const drag = { dx: 2, dy: 200, numberActiveTouches: 1 };
  const current = () => gestures.findLast(value => value.kind === 'pan');
  let claimed = false, failed = false;
  const manager = { fail() { failed = true; }, activate() { claimed = true; current().handlers.onStart({ translationY: latestDrag.dy }); } };
  let latestDrag = drag;
  const touches = g => ({ numberOfTouches: g.numberActiveTouches, allTouches: [{ absoluteX: g.dx, absoluteY: g.dy }] });
  const move = g => {
    latestDrag = g;
    if (!failed) current().handlers.onTouchesMove(touches(g), manager);
    return claimed && !failed;
  };
  // Simulate the public native gesture callbacks, including failure ownership.
  const pan = { onMoveShouldSetPanResponderCapture: (_event, g) => move(g) };
  const nativeOnScroll = scroll().props.onScroll;
  const adaptScroll = () => {
    const node = scroll(); node.props.onScroll = event => nativeOnScroll.onScroll(event.nativeEvent);
    node.props.onMomentumScrollBegin = event => nativeOnScroll.onMomentumBegin(event.nativeEvent || event);
    node.props.onMomentumScrollEnd = event => nativeOnScroll.onMomentumEnd(event.nativeEvent || event);
    return node;
  };
  return { h, view, props, scroll: adaptScroll, translation, springs, listeners, transition,
    setFocused: value => { focused = value; view.render(); },
    setOverlay: value => { overlay = value; view.render(); },
    setReduced: value => { reduced = value; view.render(); },
    start(g = drag) { claimed = false; failed = false; latestDrag = g; current().handlers.onTouchesDown(touches({ ...g, dx: 0, dy: 0 }), manager); if (!current().config.enabled) failed = true; return move(g); },
    claim() { view.render(); },
    move(g = drag) { if (shared[5].value) current().handlers.onUpdate({ translationY: g.dy }); },
    release() { if (claimed && !failed) { current().handlers.onEnd({}, true); current().handlers.onFinalize({}, true); } else current().handlers.onFinalize({}, false); claimed = false; view.render(); },
    terminate() { if (claimed && !failed) current().handlers.onEnd({}, false); current().handlers.onFinalize({}, false); claimed = false; view.render(); },
    pan: () => pan, drag, gesture: current,
  };
}

test('Android content follows downward pulls; short pulls spring home, armed release holds and refreshes exactly once', async () => {
  let calls = 0, resolve;
  const r = await refreshHarness(() => { calls++; return new Promise(done => { resolve = done; }); });
  const short = { ...r.drag, dy: 50 };
  assert.equal(r.start(short), true); r.claim(short); r.move(short);
  assert.equal(r.translation().value, resistedPull(50));
  assert.equal(r.gesture().config.blocksExternalGesture.kind, 'native');
  r.release(); assert.equal(r.translation().value, 0); assert.equal(calls, 0);
  assert.equal(r.springs.at(-1).overshootClamping, true);
  assert.equal(r.start(), true); r.claim(); r.move();
  assert.ok(r.translation().value > PULL_REFRESH.threshold);
  r.release(); assert.equal(r.translation().value, PULL_REFRESH.hold);
  await Promise.resolve(); assert.equal(calls, 1);
  assert.equal(r.start(), false, 'No second request while fetching');
  r.release(); assert.equal(calls, 1);
  assert.equal(r.translation().value, PULL_REFRESH.hold, 'Rejected gestures during refresh do not collapse the held content');
  assert.equal(r.scroll().props.refreshControl, undefined, 'Custom pulls attach the native recognizer directly to the scroll view, without an Android SwipeRefreshLayout wrapper');
  resolve(); await new Promise(done => setImmediate(done)); r.view.render();
  assert.equal(r.translation().value, 0);
  assert.notEqual(r.scroll().props.scrollEnabled, false);
  r.view.unmount();
});

test('vertical refresh only starts at the top, never from a horizontal edge swipe, diagonal, multitouch or momentum', async () => {
  const r = await refreshHarness();
  assert.equal(r.start({ ...r.drag, dx: 100, dy: 3 }), false);
  assert.equal(r.pan().onMoveShouldSetPanResponderCapture({}, r.drag), false, 'Horizontal start stays locked');
  assert.equal(r.start({ ...r.drag, dx: 50, dy: 45 }), false);
  assert.equal(r.start({ ...r.drag, numberActiveTouches: 2 }), false);
  r.scroll().props.onScroll({ nativeEvent: { contentOffset: { y: 100 } } });
  assert.equal(r.start(), false);
  r.scroll().props.onScroll({ nativeEvent: { contentOffset: { y: 0 } } });
  r.scroll().props.onMomentumScrollBegin({}); assert.equal(r.start(), false);
  r.scroll().props.onMomentumScrollEnd({}); assert.equal(r.start(), true);
  r.view.unmount();
});

test('overlays, keyboard, focus loss and a back transition cancel pulls and block behind-screen refresh', async () => {
  let calls = 0; const r = await refreshHarness(() => calls++);
  for (const [block, unblock] of [
    [() => r.setOverlay(true), () => r.setOverlay(false)],
    [() => { r.listeners.keyboardDidShow(); r.view.render(); }, () => { r.listeners.keyboardDidHide(); r.view.render(); }],
    [() => r.setFocused(false), () => r.setFocused(true)],
    [() => r.transition.setActive(true), () => r.transition.setActive(false)],
  ]) {
    assert.equal(r.start(), true); r.claim(); r.move(); block();
    assert.equal(r.translation().value, 0); r.release(); assert.equal(r.start(), false);
    await Promise.resolve(); assert.equal(calls, 0); unblock();
  }
  assert.equal(r.start(), true); r.claim(); r.move(); r.terminate(); assert.equal(r.translation().value, 0);
  r.view.unmount();
});

test('failed refresh returns content home; reversing a re-grab reduces its visual offset and cannot reuse a stale threshold', async () => {
  let calls = 0; const r = await refreshHarness(() => { calls++; return Promise.reject(new Error('Offline')); });
  assert.equal(r.start(), true); r.claim(); r.move(); r.release();
  await new Promise(done => setImmediate(done)); r.view.render();
  assert.equal(calls, 1); assert.equal(r.translation().value, 0);
  const short = { ...r.drag, dy: 20 };
  assert.equal(r.start(short), true); r.claim(short); r.release();
  await Promise.resolve(); assert.equal(calls, 1, 'Grant/release without a move cannot reuse previous armed offset');
  r.translation().setValue(35);
  assert.equal(r.start(short), true); r.claim(short); r.move({ ...short, dy: -30 });
  assert.ok(r.translation().value < 35, 'Pulling up during a re-grab decreases displacement');
  r.terminate(); r.view.unmount();
});

test('refresh wrappers preserve iOS native bounce, lists and screen callbacks, with a native Android accessibility fallback', async () => {
  const h = createHarness(); h.native.Platform.OS = 'ios';
  const { PullRefreshScrollView, PullRefreshFlatList } = h.load('src/components/common/PullRefresh.jsx');
  const props = { refreshControl: { props: { refreshing: false, onRefresh() {} } }, onScroll() {}, data: [1], contentContainerStyle: { paddingBottom: 80 } };
  for (const [Component, type] of [[PullRefreshScrollView, 'ScrollView'], [PullRefreshFlatList, 'FlatList']]) {
    const node = h.instance(Component, props).output;
    assert.equal(node.type, type); assert.equal(node.props.refreshControl, props.refreshControl); assert.equal(node.props.onScroll, props.onScroll); assert.equal(node.props.data, props.data);
  }
  const events = [];
  const r = await refreshHarness(async () => events.push('refresh'), { onScroll: event => events.push(event), contentContainerStyle: props.contentContainerStyle });
  const event = { nativeEvent: { contentOffset: { y: 0 } } };
  r.scroll().props.onScroll(event); assert.equal(events[0].nativeEvent, event.nativeEvent);
  assert.equal(r.scroll().props.contentContainerStyle, props.contentContainerStyle);
  r.setReduced(true); assert.equal(r.start(), false);
  assert.equal(r.scroll().props.refreshControl.props.enabled, true);
  r.scroll().props.refreshControl.props.onRefresh(); await new Promise(done => setImmediate(done));
  assert.equal(events.length, 2); assert.equal(events[1], 'refresh'); r.view.unmount();
});

test('an older native client retains startup and native refresh without requiring an unavailable enforcing module', () => {
  const h = createHarness();
  Object.defineProperty(h.mocks, 'react-native-gesture-handler', { get() { throw new Error('Must not load native gesture code'); } });
  const runtime = h.load('src/lib/nativeGestures.js');
  assert.equal(runtime.nativeGesturesAvailable, false);
  assert.equal(runtime.GestureHandlerRootView, 'View');
  const Wrapper = h.load('src/components/common/PullRefresh.jsx').PullRefreshScrollView;
  const control = { props: { refreshing: false, onRefresh() {} } };
  const view = h.instance(Wrapper, { refreshControl: control });
  assert.equal(view.output.type, 'ScrollView'); assert.equal(view.output.props.refreshControl, control);
});

test('a pull canceled after arming or unmounted before dispatch never requests data', async () => {
  let calls = 0; const r = await refreshHarness(() => calls++);
  r.start(); r.claim(); r.move(); r.terminate(); await Promise.resolve();
  assert.equal(calls, 0); assert.equal(r.translation().value, 0);
  r.start(); r.claim(); r.move(); r.release(); r.view.unmount();
  await new Promise(done => setImmediate(done)); assert.equal(calls, 0);
});
