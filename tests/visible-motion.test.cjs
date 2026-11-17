const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...(Array.isArray(value) ? value : [value]));

test('navigation press feedback keeps stationary hit targets and never gates the navigation action', () => {
  let reduced = false, pressed = 0, stopped = 0;
  const timings = [];
  const h = createHarness({ '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced } });
  h.native.Animated.Value.prototype.interpolate = function () { return this; };
  h.native.Animated.Value.prototype.stopAnimation = () => stopped++;
  h.native.Animated.timing = (value, config) => ({ start() { timings.push({ value, config }); } });
  const item = h.instance(h.load('src/components/common/BottomNavItem.jsx').default,
    { label: 'Review tracker', icon: 'file-text', onPress: () => pressed++ });
  const target = flat(item.output.props.style);
  assert.equal(target.minWidth, 48); assert.equal(target.minHeight, 48);
  assert.equal(target.transform, undefined, 'The hit target never scales or shifts');
  const glyph = nodes(item.output).find(n => n.type === 'AnimatedView');
  const scale = flat(glyph.props.style).transform.find(t => t.scale).scale;
  item.output.props.onPressIn();
  assert.equal(timings.at(-1).config.toValue, 0.96);
  assert.equal(timings.at(-1).config.duration, 90);
  assert.equal(timings.at(-1).config.useNativeDriver, true);
  assert.equal(timings.at(-1).value, scale);
  item.output.props.onPress(); assert.equal(pressed, 1, 'Navigation runs while feedback is still in flight');
  item.output.props.onPressOut();
  assert.equal(timings.at(-1).config.toValue, 1); assert.equal(timings.at(-1).config.duration, 130);
  reduced = true; item.render();
  const before = timings.length;
  item.output.props.onPressIn(); item.output.props.onPressOut();
  assert.equal(scale.value, 1); assert.equal(timings.length, before);
  item.output.props.onPress(); assert.equal(pressed, 2);
  const stops = stopped; item.unmount(); assert.ok(stopped > stops);
});

test('sheet scrim fades with entry and live reduced motion cancels both native timelines', async () => {
  let change, stopped = 0; const calls = [];
  const h = createHarness({ './OverlayPortal': { useOverlayAvailable: () => false, useOverlayActive: () => true } });
  h.native.AccessibilityInfo.addEventListener = (_, callback) => { change = callback; return { remove() {} }; };
  h.native.Animated.Value.prototype.stopAnimation = () => stopped++;
  h.native.Animated.timing = (value, config) => ({ start() { calls.push({ value, config }); } });
  const host = h.instance(h.load('src/components/common/AppBottomSheet.jsx').default, { visible: true }).output;
  const surface = h.instance(host.props.children.type, host.props.children.props);
  await Promise.resolve(); surface.render();
  const panel = nodes(surface.output).find(n => n.props?.onLayout);
  const backdrop = nodes(surface.output).find(n => n.type === 'AnimatedView' && !n.props.onLayout);
  panel.props.onLayout({ nativeEvent: { layout: { height: 300 } } });
  assert.equal(calls.length, 2);
  assert.ok(calls.every(c => c.config.duration === 220 && c.config.useNativeDriver));
  const scrim = flat(backdrop.props.style).opacity;
  assert.equal(calls[0].value, scrim);
  assert.equal(scrim.value, 0);
  change(true); surface.render();
  assert.equal(scrim.value, 1);
  assert.equal(flat(panel.props.style).transform[0].translateY.value, 0);
  assert.equal(calls.length, 2, 'Changing preferences cancels entry instead of scheduling replacement motion');
  const stops = stopped; surface.unmount(); assert.ok(stopped > stops);
});

test('sheet commits its starting pose before timing and cancels a queued entry on dismissal', () => {
  const frames = new Map(), timings = []; let nextFrame = 0, closed = 0;
  const h = createHarness({
    './OverlayPortal': { useOverlayAvailable: () => false, useOverlayActive: () => true },
    '../../hooks/useReducedMotion': { __esModule: true, default: () => false },
  }, {
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  h.native.Animated.timing = (value, config) => ({ start() { timings.push({ value, config }); } });
  const host = h.instance(h.load('src/components/common/AppBottomSheet.jsx').default,
    { visible: true, onClose: () => closed++ }).output;
  const surface = h.instance(host.props.children.type, host.props.children.props);
  const panel = nodes(surface.output).find(n => n.props?.onLayout);
  panel.props.onLayout({ nativeEvent: { layout: { height: 300 } } });
  assert.equal(flat(panel.props.style).transform[0].translateY.value, 300);
  assert.equal(timings.length, 0, 'Measured starting position commits before timing starts');
  assert.equal(frames.size, 1);
  const staleFrame = [...frames.values()][0];
  nodes(surface.output).find(n => n.type === 'Pressable').props.onPress();
  assert.equal(closed, 1, 'Dismissal never waits for the first animation frame');
  surface.render({ ...surface.props, visible: false });
  assert.equal(frames.size, 0);
  staleFrame(); assert.equal(timings.length, 0, 'A cancelled frame cannot animate the dismissed sheet');
  surface.render({ ...surface.props, visible: true });
  assert.equal(frames.size, 1);
  [...frames.values()][0]();
  assert.equal(timings.length, 2);
  assert.ok(timings.every(({ config }) => config.useNativeDriver && config.duration === 220));
  surface.unmount();
});

test('hierarchical push and back actions execute immediately on press without waiting timers', () => {
  const scheduledDelays = [];
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate: (...args) => calls.push(['navigate', ...args]), goBack: () => calls.push(['goBack']) }) },
  }, {
    setTimeout(_fn, ms) { scheduledDelays.push(ms); return 1; },
  });
  const calls = [];
  const tokens = h.load('src/theme/tokens.js');
  assert.ok(tokens.motion.page > 0 && tokens.motion.page < 400, 'Page transition duration stays snappy');

  const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
  const card = h.instance(Card, {
    submission: { submission_id: 's1', title: 'Activity Proposal', org_name: 'CS Society', status: 'under_review', submitted_at: '2026-11-16T00:00:00Z' },
    onPress: () => calls.push(['open', 's1']),
  });
  card.output.props.onPress();
  assert.deepEqual(calls, [['open', 's1']]);

  const BackButton = h.load('src/components/common/BackButton.jsx').default;
  const back = h.instance(BackButton, {});
  back.output.props.onPress();
  assert.deepEqual(calls.at(-1), ['goBack']);

  const SettingsRow = h.load('src/components/settings/SettingsRow.jsx').default;
  const row = h.instance(SettingsRow, { label: 'User Guide', onPress: () => calls.push(['guide']) });
  nodes(row.output).find(n => n.props?.accessibilityRole === 'button').props.onPress();
  assert.deepEqual(calls.at(-1), ['guide']);

  const SettingsHeader = h.load('src/components/settings/SettingsHeader.jsx').default;
  const header = h.instance(SettingsHeader, { title: 'Settings', onBack: () => calls.push(['settings-back']) });
  nodes(header.output).find(n => n.props?.accessibilityLabel === 'Go back').props.onPress();
  assert.deepEqual(calls.at(-1), ['settings-back']);

  assert.equal(scheduledDelays.length, 0, 'Navigation presses never schedule a delay timer');
});

test('Android PushStackNavigator runs right-to-left push, left-to-right pop, keeps underlying mounted, and supports edge swipe', () => {
  let navState = { routes: [{ key: 'home-1', name: 'StaffHome' }], index: 0 };
  let navDescriptors = {
    'home-1': { options: { animation: 'fade' }, render: () => 'HomeScene' },
  };
  const goBackCalls = [];
  const timings = [];
  const frames = new Map();
  let nextFrame = 0;
  let panConfig = null;
  let canGoBack = () => navState.index > 0;

  const h = createHarness({
    '@react-navigation/native': {
      StackRouter: 'StackRouter',
      createNavigatorFactory: (Comp) => () => ({ Navigator: Comp, Screen: 'Screen' }),
      useNavigationBuilder: () => ({
        state: navState,
        descriptors: navDescriptors,
        navigation: {
          canGoBack: () => canGoBack(),
          goBack: () => {
            goBackCalls.push('goBack');
            if (navState.index > 0) {
              navState = { routes: navState.routes.slice(0, -1), index: navState.index - 1 };
            }
          },
        },
        NavigationContent: ({ children }) => children,
      }),
    },
    '@react-navigation/native-stack': { createNativeStackNavigator: () => ({ Navigator: 'NativeNavigator', Screen: 'Screen' }) },
    'react-native-screens': { Screen: 'NativeScreen', ScreenContainer: 'NativeScreenContainer' },
    '../components/common/OverlayPortal': { useIsOverlayOpen: () => false },
  }, {
    requestAnimationFrame(cb) { frames.set(++nextFrame, cb); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });

  h.native.Platform.OS = 'android';
  h.native.PanResponder = { create: (cfg) => { panConfig = cfg; return { panHandlers: { onStartShouldSetPanResponder: cfg.onStartShouldSetPanResponder } }; } };
  h.native.Animated.Value.prototype.interpolate = function (cfg) { return { source: this, ...cfg }; };
  h.native.Animated.timing = (value, config) => ({
    start(cb) {
      timings.push({ value, config, finish: () => { value.setValue(config.toValue); cb?.({ finished: true }); } });
    },
  });

  const { createPushStackNavigator } = h.load('src/navigation/createPushStackNavigator.jsx');
  const { Navigator } = createPushStackNavigator();

  // 1. Initial mount at rest (progress = 1) with Android navigationBarHidden preserved
  const nav = h.instance(Navigator, { initialRouteName: 'StaffHome', screenOptions: { navigationBarHidden: true } });
  const nativeScreen = nodes(nav.output).find(n => n.type === 'NativeScreen');
  assert.equal(nativeScreen?.props?.navigationBarHidden, true, 'Android system navigation bar stays hidden');
  const initialScenes = nodes(nav.output).filter(n => n.type === 'AnimatedView');
  assert.equal(initialScenes.length, 1);
  assert.equal(timings.length, 0);

  // 2. Push ReviewPanelDetails with ios_from_right: mounts offscreen right (progress = 0), then slides 0 -> 1 after onLayout
  navState = {
    routes: [{ key: 'home-1', name: 'StaffHome' }, { key: 'detail-2', name: 'ReviewPanelDetails' }],
    index: 1,
  };
  navDescriptors = {
    'home-1': { options: { animation: 'fade' }, render: () => 'HomeScene' },
    'detail-2': { options: { animation: 'ios_from_right' }, render: () => 'DetailScene' },
  };
  nav.render();
  const afterPushViews = nodes(nav.output).filter(n => n.type === 'AnimatedView' && n.props.children);
  const topView = afterPushViews.find(v => v.key === 'detail-2');
  const underlyingView = afterPushViews.find(v => v.key === 'home-1');
  const topTransform = flat(topView.props.style).transform[0].translateX;
  assert.deepEqual([...topTransform.outputRange], [360, 0], 'New screen slides in from right over current screen');
  assert.equal(topTransform.source.value, 0, 'Starts offscreen right before animation begins');
  const underTransform = flat(underlyingView.props.style).transform[0].translateX;
  assert.deepEqual([...underTransform.outputRange], [0, -360 * 0.24], 'Underlying screen shifts left with parallax');
  const underOpacity = flat(underlyingView.props.style).opacity;
  assert.deepEqual([...underOpacity.outputRange], [1, 0.3, 0], 'Outgoing screen fades out during push');
  assert.equal(timings.length, 1, 'Native slide starts on shell commit before destination layout');
  topView.props.onLayout();
  assert.equal(timings.length, 1, 'Layout does not start a duplicate timeline');
  assert.equal(timings[0].config.toValue, 1);
  assert.equal(timings[0].config.useNativeDriver, true);
  assert.ok(timings[0].config.duration > 0 && timings[0].config.duration < 400);
  const contentNode = topView.props.children[0];
  let destinationRenders = 0;
  const content = h.instance(contentNode.type, {
    ...contentNode.props, descriptor: { render: () => { destinationRenders++; return 'LoadedDetail'; } },
  });
  assert.equal(destinationRenders, 1);
  assert.equal(content.output, 'LoadedDetail', 'The destination owns loading UI from its first render');
  assert.equal(frames.size, 0, 'No deferred navigation loader precedes the destination skeleton');
  timings[0].finish();
  nav.render();

  // 3. Left-edge swipe-back gesture moves finger smoothly and triggers goBack past threshold
  assert.equal(panConfig.onStartShouldSetPanResponder(), false, 'Never intercepts normal taps');
  assert.equal(panConfig.onMoveShouldSetPanResponder({}, { x0: 16, dx: 24, dy: 2 }), true, 'Claims left-edge horizontal swipe');
  assert.equal(panConfig.onMoveShouldSetPanResponder({}, { x0: 180, dx: 24, dy: 2 }), false, 'Ignores mid-screen horizontal swipes');
  panConfig.onPanResponderGrant();
  panConfig.onPanResponderMove({}, { dx: 180 });
  assert.equal(topTransform.source.value, 0.5, 'Half-screen drag sets progress to 0.5');
  panConfig.onPanResponderRelease({}, { dx: 180, vx: 0.2 });
  assert.equal(goBackCalls.length, 1);

  // 4. Pop keeps closing scene mounted on top while animating 0.5 -> 0 (left-to-right), then unmounts on completion
  nav.render();
  const closingViews = nodes(nav.output).filter(n => n.type === 'AnimatedView' && n.props.children);
  assert.equal(closingViews.length, 2, 'Both underlying and closing screens stay rendered during pop');
  assert.equal(closingViews[1].key, topView.key, 'Pop preserves the route key instead of remounting the outgoing screen');
  assert.equal(closingViews[1].props.children[0].type, topView.props.children[0].type);
  const closingOpacity = flat(closingViews[1].props.style).opacity;
  assert.deepEqual([...closingOpacity.outputRange], [0, 0.7, 1], 'Popped screen fades out as it slides right');
  assert.equal(timings.length, 2);
  assert.equal(timings[1].config.toValue, 0);
  assert.equal(timings[1].config.useNativeDriver, true);
  timings[1].finish();
  nav.render();
  const settledViews = nodes(nav.output).filter(n => n.type === 'AnimatedView' && n.props.children);
  assert.equal(settledViews.length, 1, 'Closing scene unmounts after pop animation finishes');

  // 5. Reduced motion ('none') skips timing animations completely
  const prevTimingCount = timings.length;
  navState = {
    routes: [{ key: 'home-1', name: 'StaffHome' }, { key: 'settings-3', name: 'Settings' }],
    index: 1,
  };
  navDescriptors = {
    'home-1': { options: { animation: 'fade' }, render: () => 'HomeScene' },
    'settings-3': { options: { animation: 'none' }, render: () => 'SettingsScene' },
  };
  nav.render();
  assert.equal(timings.length, prevTimingCount);

  // Focusing an already-mounted tab starts a new native timeline with the
  // original key and content state, even though no route was added.
  navState = { routes: [navState.routes[1], navState.routes[0]], index: 1 };
  nav.render();
  assert.equal(timings.length, prevTimingCount, 'Returning to the same parent tab does not start a second stack animation');
  const reusedHome = nodes(nav.output).find(n => n.type === 'AnimatedView' && n.key === 'home-1');
  assert.equal(reusedHome.props.children[0].type, topView.props.children[0].type, 'Scene wrapper type stays stable');
  navDescriptors['home-1'].options.animation = 'none';
  nav.render();
  const provider = nodes(nav.output).find(n => n.type === 'ContextProvider');
  assert.equal(provider.props.value.isActive(), false, 'Live reduced motion releases pending list work');
  nav.unmount();
});
