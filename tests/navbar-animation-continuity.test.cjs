const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/mobileComponentHarness.cjs');
const { createBottomNavScroll } = require('../src/utils/bottomNavScroll.cjs');

const event = y => ({ nativeEvent: { contentOffset: { y }, contentSize: { height: 2000 }, layoutMeasurement: { height: 600 } } });
const style = output => Object.assign({}, ...output.props.style);

test('navbar retains its native fade/slide nodes through scroll reversals and unrelated renders', async () => {
  const h = createHarness({ '../../hooks/useReducedMotion': { __esModule: true, default: () => false } });
  const BaseValue = h.native.Animated.Value;
  h.native.Animated.Value = class extends BaseValue {
    interpolate(config) { return { parent: this, ...config }; }
  };
  const starts = [];
  // Keep the animation in flight instead of jumping to its end as the general harness does.
  h.native.Animated.timing = (value, config) => ({ start() { starts.push({ value, config, from: value.value }); } });
  const behavior = createBottomNavScroll();
  const Frame = h.load('src/components/common/BottomNavFrame.jsx').default;
  const frame = h.instance(Frame, { scrollBehavior: behavior, children: 'navbar' });
  await Promise.resolve(); frame.render();
  const original = style(frame.output);
  frame.render({ ...frame.props, children: 'updated badges' });
  assert.equal(style(frame.output).opacity, original.opacity, 'A parent update must not replace the native opacity node');
  assert.equal(style(frame.output).transform[0].translateY, original.transform[0].translateY, 'A parent update must not replace the native translation node');
  behavior.scrollProps.onScrollBeginDrag(event(100));
  behavior.scrollProps.onScroll(event(130)); frame.render();
  starts.at(-1).value.value = 0.4;
  behavior.scrollProps.onScroll(event(110)); frame.render();
  assert.equal(starts.at(-1).from, 0.4, 'Reversing retains the displayed animation value');
  assert.equal(starts.at(-1).config.toValue, 0);
  assert.equal(starts.at(-1).config.duration, 240);
  assert.equal(starts.at(-1).config.useNativeDriver, true);
  assert.equal(style(frame.output).opacity, original.opacity);
  assert.equal(style(frame.output).transform[0].translateY, original.transform[0].translateY);
  const count = starts.length;
  frame.render();
  assert.equal(starts.length, count, 'An ordinary rerender does not restart the fade');
  frame.unmount();
});

test('navbar updates only the slide range when measured height changes, retaining the fade node', async () => {
  const h = createHarness();
  const BaseValue = h.native.Animated.Value;
  h.native.Animated.Value = class extends BaseValue {
    interpolate(config) { return { parent: this, ...config }; }
  };
  const frame = h.instance(h.load('src/components/common/BottomNavFrame.jsx').default);
  await Promise.resolve(); frame.render();
  const original = style(frame.output);
  frame.output.props.onLayout({ nativeEvent: { layout: { height: 72 } } }); frame.render();
  const resized = style(frame.output);
  assert.equal(resized.opacity, original.opacity);
  assert.notEqual(resized.transform[0].translateY, original.transform[0].translateY);
  assert.equal(resized.transform[0].translateY.outputRange[1], 72 + 8 + 24);
  frame.render();
  assert.equal(style(frame.output).transform[0].translateY, resized.transform[0].translateY);
  frame.unmount();
});
