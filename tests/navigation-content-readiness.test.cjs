const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

test('read-only content waits for real native completion, keeps cached content, and cancels stale subscriptions', () => {
  const h = createHarness();
  const { createNavigationTransition, NavigationTransitionContext } = h.load('src/navigation/NavigationTransitionContext.js');
  const transition = createNavigationTransition();
  NavigationTransitionContext.value = transition;
  let deferred = null;
  h.mocks.react.useDeferredValue = (value, initial) => { assert.equal(initial, null); return deferred; };
  const useReady = h.load('src/hooks/useNavigationContentReady.js').default;
  const view = h.instance(({ key }) => useReady(key), { key: 'All' });
  assert.equal(view.output, false, 'Cold content must first commit its skeleton');
  transition.setActive(true);
  deferred = 'All'; view.render();
  assert.equal(view.output, false);
  view.render(); assert.equal(view.output, false, 'Background preparation cannot race the slide');
  transition.setActive(false); view.render();
  assert.equal(view.output, true);
  transition.setActive(true); view.render();
  assert.equal(view.output, true, 'Cached content stays visible on exit, revisit, or a cancelled swipe');
  view.render({ key: 'Approved' }); assert.equal(view.output, false);
  deferred = 'Approved'; view.render();
  view.render({ key: 'Rejected' });
  transition.setActive(false); view.render();
  assert.equal(view.output, false, 'An obsolete filter completion cannot reveal the newest result');
  deferred = 'Rejected'; view.render(); view.render();
  assert.equal(view.output, true);
  const before = view.state.slice();
  view.unmount(); transition.setActive(true); transition.setActive(false);
  assert.deepEqual(view.state, before, 'Unmount removes native listeners');
});

test('read-only content settles without an Android transition provider (iOS and initial/reduced-motion routes)', () => {
  const h = createHarness();
  const useReady = h.load('src/hooks/useNavigationContentReady.js').default;
  const view = h.instance(() => useReady());
  assert.equal(view.output, false);
  view.render(); assert.equal(view.output, true);
  view.unmount();
});

for (const role of ['student', 'staff']) test(`${role} notifications commit their header and skeleton before rows without delaying their query`, async () => {
  let ready = false, requests = 0;
  const reads = [], navigated = [];
  const markRead = async id => { reads.push(id); };
  const items = Array.from({ length: 40 }, (_, i) => ({ notification_id: `n${i}`, submission_id: `s${i}`,
    created_at: new Date().toISOString(), is_read: false }));
  const h = createHarness({
    '../../hooks/useNavigationContentReady': { __esModule: true, default: () => ready },
    '../../context/AuthContext': { useAuth: () => ({ role }) },
    '../../hooks/useStudentNotifications': {
      useNotifications: () => { requests++; return { data: { results: items }, dataUpdatedAt: 1, isFetching: false }; },
      useMarkNotificationRead: () => ({ mutateAsync: markRead }),
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  });
  const Screen = h.load('src/screens/student/StudentNotificationsScreen.jsx').default;
  const view = h.instance(Screen, { navigation: { navigate: (...args) => navigated.push(args) } });
  const list = () => nodes(view.output).find(n => n.props?.renderItem);
  assert.equal(requests, 1);
  assert.equal(list().props.data.length, 0);
  assert.equal(list().props.ListEmptyComponent.type.name, 'NotificationsSkeleton');
  assert.ok(nodes(list().props.ListHeaderComponent).some(n => n.type?.name === 'NotificationTabs'));
  assert.ok(nodes(view.output).some(n => /BottomNav/.test(n.type?.name || '')));
  ready = true; view.render();
  assert.equal(list().props.data.length, 40, 'Virtualization does not truncate the retrieved notifications');
  assert.equal(list().props.initialNumToRender, 6);
  assert.equal(list().props.maxToRenderPerBatch, 4);
  const data = list().props.data, renderItem = list().props.renderItem;
  view.render();
  assert.equal(list().props.data, data);
  assert.equal(list().props.renderItem, renderItem, 'Query/focus rerenders do not invalidate every row renderer');
  const row = renderItem({ item: items.at(-1) });
  h.instance(row.type, row.props).output.props.onPress(); view.render();
  assert.deepEqual(reads, ['n39']);
  const sheet = nodes(view.output).find(n => n.type?.name === 'NotificationDetailSheet');
  assert.equal(sheet.props.notification, items.at(-1));
  sheet.props.onOpenSubmission();
  assert.equal(navigated[0][0], role === 'student' ? 'StudentSubmissionDetails' : 'ReviewPanelDetails');
  assert.equal(navigated[0][1].submission.submission_id, 's39');
  view.unmount();
});

test('notification timestamp optimization preserves locale output, invalid fallback, and relative time', () => {
  const h = createHarness();
  const { formatTime, relativeTimestamp } = h.load('src/components/students/StudentNotificationListItem.jsx');
  for (const value of ['2026-01-01T03:04:00Z', '2026-11-18T18:25:00Z']) {
    const expected = new Date(value).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    assert.equal(formatTime(value), expected);
  }
  assert.equal(formatTime(), ''); assert.equal(formatTime('invalid'), '');
  assert.equal(relativeTimestamp('2026-11-18T00:00:00Z', Date.parse('2026-11-18T02:00:00Z')), '2h ago');
});

test('notification rows preserve their focus target, unread changes and legacy bell action with memoized props', () => {
  const h = createHarness();
  let memoized;
  h.mocks.react.memo = component => { memoized = component; return component; };
  const Card = h.load('src/components/students/StudentNotificationListItem.jsx').default;
  assert.equal(Card, memoized, 'Unchanged row props can bail out of unrelated navigation rerenders');
  const calls = [], item = { notification_id: 'n', submission_title: 'Saved title', is_read: false };
  const view = h.instance(Card, { notification: item, onOpen: (...args) => calls.push(args) });
  const trigger = view.output.props.ref;
  view.output.props.onPress();
  assert.equal(calls[0][0], item); assert.equal(calls[0][1], trigger);
  assert.match(view.output.props.accessibilityLabel, /Unread/);
  view.render({ notification: { ...item, is_read: true }, onPress: ref => calls.push([ref]) });
  assert.match(view.output.props.accessibilityLabel, /, Read,/);
  view.output.props.onPress(); assert.equal(calls[1][0], trigger, 'Existing bell consumers keep their callback contract');
  view.unmount();
});
