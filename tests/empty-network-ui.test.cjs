const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = v => Object.assign({}, ...[].concat(v || []));

test('empty, offline, HTTP and authorization states stay distinct with bundled artwork and working recovery', () => {
  const h = createHarness(), State = h.load('src/components/common/ContentState.jsx').default;
  let retries = 0;
  for (const [props, expected] of [
    [{ title: 'No submissions yet' }, 'No submissions yet'],
    [{ variant: 'error', error: { code: 'OFFLINE' } }, 'Let’s reconnect'],
    [{ variant: 'error', title: 'Could not load submissions', error: { status: 500 } }, 'Could not load submissions'],
    [{ variant: 'error', error: { status: 403, code: 'OFFLINE' } }, 'Access unavailable'],
  ]) {
    const tree = h.instance(State, { ...props, onRetry: () => retries++ }).output;
    assert.ok(textOf(tree).includes(expected));
    const image = nodes(tree).find(n => n.type === 'Image');
    assert.match(image.props.source, /state-(empty|connection)\.webp$/);
    assert.equal(image.props.accessible, false);
    assert.equal(image.props.importantForAccessibility, 'no-hide-descendants');
    nodes(tree).find(n => n.props?.label === 'Try again').props.onPress();
    assert.equal(flat(tree.props.style).height, undefined, 'Copy can grow with accessibility text');
  }
  assert.equal(retries, 4);
  for (const asset of ['state-empty.webp', 'state-connection.webp', 'login-students.webp']) {
    const buffer = fs.readFileSync(path.resolve(__dirname, '../src/assets', asset));
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  }
});

test('submission state changes preserve cached cards, loading, auth isolation and clearing academic-year filters', () => {
  const h = createHarness(), List = h.load('src/screens/staff/reviewPanel/StaffReviewList.jsx').default;
  const row = { submission_id: 'cached' }, retry = () => {}, clear = () => {};
  const list = h.instance(List, { isLoading: true });
  assert.equal(list.output.type.name, 'SubmissionListSkeleton');
  list.render({ isError: true, error: { code: 'OFFLINE' }, submissions: [row] });
  assert.ok(nodes(list.output).some(n => n.type?.name === 'SubmissionListCard'));
  assert.ok(!nodes(list.output).some(n => n.type?.name === 'ContentState'));
  list.render({ isError: true, error: { status: 403 }, submissions: [row], onRetry: retry });
  assert.equal(list.output.type.name, 'ContentState');
  assert.equal(list.output.props.onRetry, retry);
  assert.ok(!nodes(list.output).some(n => n.type?.name === 'SubmissionListCard'));
  list.render({ submissions: [], academicYearId: 'year', onClearFilter: clear });
  assert.match(list.output.props.message, /selected academic year/);
  assert.equal(nodes(list.output).find(n => n.props?.accessibilityLabel === 'Clear academic year filter').props.onPress, clear);
});

test('connection notice overlays without page movement, stays dismissed across pages, hides after timeout and returns only on another outage', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let online = false, checks = 0;
  const h = createHarness({
    '../../hooks/useConnectivity': { __esModule: true, default: () => online },
    '../../lib/networkRuntime': { checkConnection: async () => { checks++; } },
  });
  const Notice = h.load('src/components/common/OfflineBanner.jsx').default;
  const notice = h.instance(Notice, { bottomOffset: 80 });
  assert.equal(notice.output.props.style.position, 'absolute');
  assert.ok(notice.output.props.style.bottom >= 80);
  await nodes(notice.output).find(n => n.props?.label === 'Retry').props.onPress(); notice.render();
  assert.equal(checks, 1);
  nodes(notice.output).find(n => n.props?.accessibilityLabel === 'Dismiss connection notice').props.onPress();
  assert.equal(notice.render(), null);
  assert.equal(notice.render({ bottomOffset: 0 }), null, 'Changing pages must not reannounce the same outage');
  online = true; notice.render();
  online = false; notice.render(); notice.render();
  assert.ok(notice.output);
  t.mock.timers.tick(8001); assert.equal(notice.render(), null);
  notice.unmount();
});

test('connection notice remains dismissible for screen readers and never covers an open keyboard', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const listeners = {};
  const h = createHarness({ '../../hooks/useConnectivity': { __esModule: true, default: () => false } });
  h.native.AccessibilityInfo.isScreenReaderEnabled = async () => true;
  h.native.Keyboard.addListener = (event, fn) => { listeners[event] = fn; return { remove() {} }; };
  const notice = h.instance(h.load('src/components/common/OfflineBanner.jsx').default);
  await Promise.resolve();
  t.mock.timers.tick(20000); assert.ok(notice.render());
  listeners.keyboardDidShow(); assert.equal(notice.render(), null);
  listeners.keyboardDidHide(); assert.ok(notice.render());
  notice.unmount();
});
