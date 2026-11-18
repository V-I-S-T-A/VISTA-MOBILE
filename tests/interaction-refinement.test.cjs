const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('bell selection navigates immediately while unread persistence remains pending or fails', async () => {
  for (const role of ['staff', 'student']) {
    const calls = []; let reject, reads = 0;
    const item = { notification_id: 'notice', submission_id: 'submission', is_read: false };
    const h = createHarness({
      '@react-navigation/native': { useNavigation: () => ({ navigate: (...args) => calls.push(args) }) },
      '../../context/AuthContext': { useAuth: () => ({ role }) },
      '../../hooks/useStudentNotifications': {
        useNotifications: () => ({ data: { results: [item] }, refetch() {} }),
        useMarkNotificationRead: () => ({ mutateAsync(id) {
          reads++; assert.equal(id, 'notice'); return new Promise((_, fail) => { reject = fail; });
        } }),
      },
    });
    const bell = h.instance(h.load('src/components/students/StudentNotificationBell.jsx').default);
    const list = nodes(bell.output).find(n => n.props?.renderItem);
    list.props.renderItem({ item }).props.onPress();
    assert.equal(calls.length, 1, 'Route opens before read request resolves');
    assert.equal(calls[0][0], role === 'staff' ? 'ReviewPanelDetails' : 'StudentSubmissionDetails');
    assert.equal(calls[0][1].submission.submission_id, 'submission');
    assert.equal(reads, 1);
    reject(Error('offline')); await Promise.resolve();
    assert.equal(calls.length, 1, 'Read failure neither reverses nor repeats navigation');
    list.props.renderItem({ item: { ...item, is_read: true } }).props.onPress();
    assert.equal(reads, 1, 'Already-read notices do not generate another mutation');
  }
});

test('notification page keeps its account header fixed and its body scrollable through loading, empty, stale and denied states', () => {
  const item = { notification_id: 'notice', submission_id: 'submission', is_read: false, created_at: new Date().toISOString() };
  for (const role of ['staff', 'student']) for (const state of ['pending', 'empty', 'content', 'stale', 'denied', 'error']) {
    let refreshed = 0, retried = 0, reads = 0;
    const hasRecords = ['content', 'stale', 'denied'].includes(state);
    const h = createHarness({
      '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
      '../../context/AuthContext': { useAuth: () => ({ role }) },
      '../../hooks/useStudentNotifications': {
        useNotifications: () => ({ data: { results: hasRecords ? [item] : [] }, isPending: state === 'pending',
          isError: ['stale', 'denied', 'error'].includes(state), error: state === 'denied' ? { status: 403 } : null,
          refetch: () => retried++ }),
        useMarkNotificationRead: () => ({ mutateAsync: async () => { reads++; } }),
      },
      '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh: () => refreshed++ }) },
    });
    const screen = h.instance(h.load('src/screens/student/StudentNotificationsScreen.jsx').default, { navigation: {} });
    const list = nodes(screen.output).find(n => n.props?.renderItem);
    assert.equal(nodes(screen.output).filter(n => n.props?.renderItem).length, 1);
    assert.equal(nodes(screen.output).filter(n => n.type?.name === 'AccountHeader').length, 1, 'Account header stays fixed outside the refreshing list');
    assert.ok(!nodes(list.props.ListHeaderComponent).some(n => n.type?.name === 'AccountHeader'));
    assert.match(textOf(list.props.ListHeaderComponent), /Notifications/);
    assert.equal(list.props.stickyHeaderIndices, undefined);
    assert.equal(list.props.contentContainerStyle.paddingBottom, 80);
    assert.equal(list.props.data.length, ['content', 'stale'].includes(state) ? 1 : 0);
    list.props.refreshControl.props.onRefresh(); assert.equal(refreshed, 1);
    if (state === 'pending') assert.equal(list.props.ListEmptyComponent.type.name, 'NotificationsSkeleton');
    const empty = list.props.ListEmptyComponent;
    const renderedEmpty = empty.type?.name === 'ContentState' ? h.instance(empty.type, empty.props).output : empty;
    if (state === 'empty') assert.match(textOf(renderedEmpty), /caught up/);
    if (state === 'stale') assert.ok(nodes(list.props.ListHeaderComponent).some(n => n.type?.name === 'StaleWarningBanner'));
    if (['denied', 'error'].includes(state)) {
      assert.match(textOf(renderedEmpty), state === 'denied' ? /Access unavailable/ : /Could not load notifications/);
      nodes(renderedEmpty).find(n => n.props?.label === 'Try again').props.onPress();
      assert.equal(retried, 1);
    }
    assert.equal(reads, 0, 'Scrolling/loading a page never marks notices read');
  }
});

test('new controls reuse the resolved motion preference without waiting for another native read', async () => {
  const h = createHarness();
  const useReducedMotion = h.load('src/hooks/useReducedMotion.js').default;
  const root = h.instance(() => useReducedMotion());
  await Promise.resolve(); assert.equal(root.render(), false);
  let resolve;
  h.native.AccessibilityInfo.isReduceMotionEnabled = () => new Promise(done => { resolve = done; });
  const next = h.instance(() => useReducedMotion());
  assert.equal(next.output, false, 'Cached preference is available on its first render');
  next.unmount(); resolve(true); await Promise.resolve();
  assert.equal(next.state[0], false); root.unmount();
});

test('sheet content appears on its measured frame even if native preference resolution stalls', () => {
  const h = createHarness({ './OverlayPortal': { useOverlayAvailable: () => false, useOverlayActive: () => true } });
  h.native.AccessibilityInfo.isReduceMotionEnabled = () => new Promise(() => {});
  const host = h.instance(h.load('src/components/common/AppBottomSheet.jsx').default, { visible: true }).output;
  const surface = h.instance(host.props.children.type, host.props.children.props);
  const panel = nodes(surface.output).find(n => n.props?.onLayout);
  panel.props.onLayout({ nativeEvent: { layout: { height: 300 } } });
  const style = Object.assign({}, ...panel.props.style);
  assert.equal(style.transform[0].translateY.value, 0, 'No native Promise can hold the sheet offscreen');
  surface.unmount();
});
