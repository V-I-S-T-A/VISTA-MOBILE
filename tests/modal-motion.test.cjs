const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...(Array.isArray(value) ? value : [value]));

function modalHarness({ reduced = false, platform = 'android', available = true } = {}) {
  const state = { reduced, timings: [], stops: 0 };
  const h = createHarness({
    './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => available },
    '../../hooks/useReducedMotion': { __esModule: true, default: () => state.reduced },
  });
  h.native.Platform.OS = platform;
  h.native.Animated.Value.prototype.interpolate = function (config) { return { progress: this, config }; };
  h.native.Animated.Value.prototype.stopAnimation = () => state.stops++;
  h.native.Animated.timing = (value, config) => ({ start(finish) { state.timings.push({ value, config, finish }); } });
  return { h, state, Modal: h.load('src/components/common/AppModal.jsx').default };
}

test('Android portal modals coordinate scrim fade and subtle card scale on one native timeline', () => {
  const { h, state, Modal } = modalHarness();
  const draft = { type: 'Draft', props: { value: 'Unsent remarks' } };
  const host = h.instance(Modal, { visible: true, children: draft });
  assert.equal(host.output.type, 'OverlayPortal');
  const element = host.output.props.children;
  const surface = h.instance(element.type, element.props);
  assert.equal(state.timings.length, 1);
  const { value, config } = state.timings[0];
  assert.equal(value.value, 0, 'Entry starts on the first mounted frame');
  assert.equal(config.toValue, 1);
  assert.equal(config.duration, h.load('src/theme/tokens.js').motion.modal);
  assert.equal(config.useNativeDriver, true);
  const layers = nodes(surface.output).filter(n => n.type === 'AnimatedView');
  assert.equal(layers.length, 2);
  assert.equal(flat(layers[0].props.style).opacity, value);
  assert.equal(flat(layers[1].props.style).opacity, value);
  const scale = flat(layers[1].props.style).transform[0].scale;
  assert.equal(scale.progress, value);
  assert.deepEqual(Array.from(scale.config.inputRange), [0, 1]);
  assert.deepEqual(Array.from(scale.config.outputRange), [0.98, 1]);
  assert.equal(layers[1].props.accessibilityViewIsModal, true);
  const scroll = nodes(surface.output).find(n => n.type === 'ScrollView');
  assert.equal(scroll.props.children, draft);
  assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
  surface.unmount(); host.unmount();
});

test('portal modal actions and guarded dismissal remain immediate while entry is still running', () => {
  const { h, state, Modal } = modalHarness(); let dismissed = 0, actions = 0, released = 0;
  const action = { type: 'Action', props: { onPress: () => actions++ } };
  const host = h.instance(Modal, { visible: true, onClose: () => dismissed++, onDismiss: () => released++, children: action, dismissible: false });
  const surface = h.instance(host.output.props.children.type, host.output.props.children.props);
  host.output.props.onRequestClose();
  nodes(surface.output).find(n => n.type === 'Pressable').props.onPress();
  assert.equal(dismissed, 0);
  action.props.onPress(); assert.equal(actions, 1);
  assert.equal(state.timings[0].value.value, 0, 'Actions do not wait for animation completion');
  host.render({ ...host.props, dismissible: true });
  surface.render(host.output.props.children.props);
  nodes(surface.output).find(n => n.type === 'Pressable').props.onPress();
  assert.equal(dismissed, 1);
  host.render({ ...host.props, visible: false });
  assert.ok(host.output, 'Retain the original card until the coordinated exit finishes');
  assert.equal(released, 0);
  surface.render(host.output.props.children.props);
  assert.equal(state.timings.at(-1).config.toValue, 0);
  assert.equal(nodes(surface.output).find(n => n.props?.accessibilityViewIsModal).props.pointerEvents, 'none');
  host.output.props.onRequestClose(); assert.equal(dismissed, 1, 'Repeated dismissal is ignored during exit');
  state.timings.at(-1).finish({ finished: true }); host.render();
  assert.equal(host.output, null, 'Completed exit releases its overlay');
  assert.equal(released, 1);
  const beforeUnmount = state.stops;
  surface.unmount(); host.unmount();
  assert.ok(state.stops > beforeUnmount, 'Removing the portal cancels the native timeline');
});

test('reduced motion skips portal entry and a live change cancels entry at its final position', () => {
  for (const initiallyReduced of [false, true]) {
    const { h, state, Modal } = modalHarness({ reduced: initiallyReduced });
    const host = h.instance(Modal, { visible: true });
    const surface = h.instance(host.output.props.children.type, host.output.props.children.props);
    const card = () => nodes(surface.output).find(n => n.props?.accessibilityViewIsModal);
    const progress = flat(card().props.style).opacity;
    assert.equal(state.timings.length, initiallyReduced ? 0 : 1);
    assert.equal(progress.value, initiallyReduced ? 1 : 0);
    const stops = state.stops;
    state.reduced = true; host.render(); surface.render(host.output.props.children.props);
    assert.equal(progress.value, 1);
    if (!initiallyReduced) assert.ok(state.stops > stops);
    assert.equal(state.timings.length, initiallyReduced ? 0 : 1, 'Reduced motion must not schedule a replacement animation');
    surface.unmount(); host.unmount();
  }
});

test('interrupted exit reverses the same timeline and stale completion cannot hide a reopened modal', () => {
  const { h, state, Modal } = modalHarness();
  const host = h.instance(Modal, { visible: true });
  const first = h.instance(host.output.props.children.type, host.output.props.children.props);
  const oldProgress = state.timings[0].value;
  host.render({ ...host.props, visible: false }); first.render(host.output.props.children.props);
  const abandonedExit = state.timings.at(-1).finish;
  host.render({ ...host.props, visible: true });
  first.render(host.output.props.children.props);
  assert.equal(state.timings.at(-1).value, oldProgress);
  assert.equal(state.timings.at(-1).config.toValue, 1);
  abandonedExit({ finished: true }); host.render(); assert.ok(host.output);
  host.render({ ...host.props, visible: false }); first.render(host.output.props.children.props);
  state.timings.at(-1).finish({ finished: true }); host.render(); assert.equal(host.output, null);
  first.unmount();
  host.render({ ...host.props, visible: true });
  const second = h.instance(host.output.props.children.type, host.output.props.children.props);
  assert.notEqual(state.timings.at(-1).value, oldProgress);
  assert.equal(state.timings.at(-1).value.value, 0);
  second.unmount(); host.unmount();
});

test('iOS and standalone Android animate content inside a native window without a duplicate transition', () => {
  for (const platform of ['ios', 'android']) for (const reduced of [false, true]) {
    const { h, state, Modal } = modalHarness({ platform, reduced, available: platform === 'ios' });
    const modal = h.instance(Modal, { visible: true, children: 'Existing content' });
    assert.equal(modal.output.type, 'Modal');
    assert.equal(modal.output.props.animationType, 'none');
    const surface = h.instance(modal.output.props.children.type, modal.output.props.children.props);
    assert.equal(state.timings.length, reduced ? 0 : 1);
    assert.equal(nodes(surface.output).find(n => n.type === 'ScrollView').props.children, 'Existing content');
    surface.unmount(); modal.unmount();
  }
});
