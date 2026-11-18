const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

function fixture() {
  const timelines = [];
  const h = createHarness({
    './useReducedMotion': { __esModule: true, default: () => false },
    './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true },
    '../common/OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true },
  });
  h.native.Animated.timing = (value, config) => ({ start(finish) { timelines.push({ value, config, finish }); } });
  return { h, timelines };
}

test('processing overlay retains its message until native fade completes and remains non-dismissible', () => {
  const { h, timelines } = fixture();
  const host = h.instance(h.load('src/components/common/VistaProcessing.jsx').default, { visible: true, message: 'Saving draft' });
  const surface = h.instance(host.output.props.children.type, host.output.props.children.props);
  assert.equal(timelines[0].config.useNativeDriver, true);
  host.output.props.onRequestClose(); assert.ok(host.output);
  host.render({ visible: false, message: '' }); surface.render(host.output.props.children.props);
  assert.equal(nodes(surface.output).find(node => node.type?.name === 'VistaLoader').props.message, 'Saving draft');
  assert.equal(timelines.at(-1).config.toValue, 0);
  assert.ok(host.output);
  timelines.at(-1).finish({ finished: true }); host.render(); assert.equal(host.output, null);
  surface.unmount(); host.unmount();
});

test('file preview retains its current document during close and releases after fade; stale callbacks cannot close a reopened file', () => {
  const { h, timelines } = fixture();
  const file = { document_id: 'file', file_url: 'https://example.test/paper.webp' };
  const host = h.instance(h.load('src/components/submissions/AttachmentPreview.jsx').default, { document: file, onClose() {} });
  const surface = h.instance(host.output.props.children.type, host.output.props.children.props);
  host.render({ ...host.props, document: null }); surface.render(host.output.props.children.props);
  assert.equal(nodes(surface.output).find(node => node.type?.name === 'PreviewContent').props.document, file);
  assert.equal(surface.output.props.pointerEvents, 'none');
  const abandoned = timelines.at(-1).finish;
  host.render({ ...host.props, document: file }); surface.render(host.output.props.children.props);
  abandoned({ finished: true }); host.render(); assert.ok(host.output);
  host.render({ ...host.props, document: null }); surface.render(host.output.props.children.props);
  timelines.at(-1).finish({ finished: true }); host.render(); assert.equal(host.output, null);
  surface.unmount(); host.unmount();
});

test('notice action executes once immediately; dismissal fades before removal and cleans up its timeout', () => {
  const { h, timelines } = fixture(); let actions = 0;
  const host = h.instance(h.load('src/components/common/Toast.jsx').ToastProvider, { children: 'App' });
  try {
    host.output.props.value.showAction('Local notice', 'Retry', () => actions++, 'info', 3000);
    host.render();
    const node = nodes(host.output).find(node => node.type?.name === 'ToastItem');
    const item = h.instance(node.type, node.props);
    const action = nodes(item.output).find(node => node.type === 'TouchableOpacity');
    action.props.onPress(); action.props.onPress(); assert.equal(actions, 1);
    host.render();
    const closing = nodes(host.output).find(node => node.type?.name === 'ToastItem');
    assert.equal(closing.props.toast.dismissed, true);
    item.render(closing.props);
    assert.match(textOf(item.output), /Local notice/);
    assert.equal(timelines.at(-1).config.toValue, 0);
    timelines.at(-1).finish({ finished: true }); host.render();
    assert.equal(nodes(host.output).find(node => node.type?.name === 'ToastItem'), undefined);
    item.unmount();
  } finally { host.unmount(); }
});
