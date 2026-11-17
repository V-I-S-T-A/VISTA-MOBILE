const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRealtimeController, deriveWebSocketUrl } = require('../src/services/realtimeController.cjs');

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.closed = false;
    this.closeCode = null;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }

  send(data) {
    this.sent.push(data);
  }

  close(code) {
    this.closed = true;
    this.closeCode = code;
    if (this.onclose) this.onclose({ code });
  }

  triggerOpen() {
    if (this.onopen) this.onopen();
  }

  triggerMessage(data) {
    if (this.onmessage) this.onmessage({ data: typeof data === 'object' ? JSON.stringify(data) : data });
  }

  triggerClose(code = 1000) {
    this.close(code);
  }
}

function createTestHarness(overrides = {}) {
  const invalidations = [];
  const queryDataUpdates = [];
  const createdSockets = [];
  let appState = 'active';
  const scheduledTimers = [];
  let clearedCache = false;

  const queryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidations.push(queryKey);
    },
    setQueriesData: ({ queryKey }, updater) => {
      queryDataUpdates.push({ queryKey, updater });
    },
    clear: () => {
      clearedCache = true;
    },
  };

  const apiClient = {
    get: async endpoint => {
      if (overrides.authFail) throw new Error('401 Unauthorized');
      return { data: { user_id: 'user-1', role: 'student' } };
    },
  };

  const tokenStore = {
    getAccessToken: () => overrides.token || 'jwt-access-token-abc',
  };

  const controller = createRealtimeController({
    queryClient,
    user: overrides.user || { user_id: 'student-uuid-1', role: 'student' },
    apiClient,
    tokenStore,
    getAppState: () => appState,
    createWebSocket: url => {
      const ws = new MockWebSocket(url);
      createdSockets.push(ws);
      return ws;
    },
    apiUrl: overrides.apiUrl || 'http://127.0.0.1:8000/api',
    setTimer: (fn, ms) => {
      const id = scheduledTimers.length + 1;
      scheduledTimers.push({ id, fn, ms });
      return id;
    },
    clearTimer: id => {
      const idx = scheduledTimers.findIndex(t => t.id === id);
      if (idx !== -1) scheduledTimers.splice(idx, 1);
    },
    random: () => 0.5,
    ...overrides,
  });

  return {
    controller,
    queryClient,
    invalidations,
    queryDataUpdates,
    createdSockets,
    scheduledTimers,
    hasClearedCache: () => clearedCache,
    setAppState: state => { appState = state; },
  };
}

test('deriveWebSocketUrl converts http and https endpoints correctly', () => {
  assert.equal(deriveWebSocketUrl('http://127.0.0.1:8000/api'), 'ws://127.0.0.1:8000/ws/notifications/');
  assert.equal(deriveWebSocketUrl('https://vista-backend-production-10d7.up.railway.app/api'), 'wss://vista-backend-production-10d7.up.railway.app/ws/notifications/');
  assert.equal(deriveWebSocketUrl('http://192.168.1.100:8000/api/'), 'ws://192.168.1.100:8000/ws/notifications/');
  assert.equal(deriveWebSocketUrl('https://api.vista.local/api'), 'wss://api.vista.local/ws/notifications/');
});

test('authenticated WebSocket connection connects and sends JWT frame on open', async () => {
  const h = createTestHarness();
  await h.controller.connect();

  assert.equal(h.createdSockets.length, 1);
  const ws = h.createdSockets[0];
  assert.equal(ws.url, 'ws://127.0.0.1:8000/ws/notifications/');

  ws.triggerOpen();
  assert.equal(ws.sent.length, 1);
  assert.deepEqual(JSON.parse(ws.sent[0]), { token: 'jwt-access-token-abc' });
});

test('invalid credentials with 4401 close code halts retry loop', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerClose(4401);
  assert.equal(h.scheduledTimers.length, 0, 'Should not schedule retry when explicit 4401 rejection occurs');
});

test('logout disconnects active socket and clears pending state', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  h.controller.disconnect();
  assert.equal(ws.closed, true);
  assert.equal(h.controller.getSocket(), null);
});

test('account switching cleans up previous connection and binds new user', async () => {
  const h1 = createTestHarness({ user: { user_id: 'user-a', role: 'student' }, token: 'token-a' });
  await h1.controller.connect();
  const ws1 = h1.createdSockets[0];
  ws1.triggerOpen();
  assert.deepEqual(JSON.parse(ws1.sent[0]), { token: 'token-a' });

  h1.controller.disconnect();
  assert.equal(ws1.closed, true);

  const h2 = createTestHarness({ user: { user_id: 'user-b', role: 'staff' }, token: 'token-b' });
  await h2.controller.connect();
  const ws2 = h2.createdSockets[0];
  ws2.triggerOpen();
  assert.deepEqual(JSON.parse(ws2.sent[0]), { token: 'token-b' });
});

test('staff receives student review_reply.created event and refreshes open conversation', async () => {
  const h = createTestHarness({ user: { user_id: 'staff-uuid', role: 'staff' } });
  await h.controller.connect();
  const ws = h.createdSockets[0];
  ws.triggerOpen();

  ws.triggerMessage({
    version: 1,
    type: 'review_reply.created',
    submission_id: 'sub-123',
    review_log_id: 'log-456',
    reply_id: 'reply-789',
    parent_reply_id: null,
  });

  const matchingReplies = h.invalidations.filter(k => k[0] === 'review-replies' && k[1] === 'sub-123');
  const matchingLogs = h.invalidations.filter(k => k[0] === 'review-logs' && k[1] === 'sub-123');
  const matchingSubmissions = h.invalidations.filter(k => k[0] === 'submissions' && k[1] === 'sub-123');

  assert.ok(matchingReplies.length > 0, 'review-replies query for sub-123 must be invalidated');
  assert.ok(matchingLogs.length > 0, 'review-logs query for sub-123 must be invalidated');
  assert.ok(matchingSubmissions.length > 0, 'submissions query for sub-123 must be invalidated');
});

test('student receives staff review_reply.created event and conversation updates', async () => {
  const h = createTestHarness({ user: { user_id: 'student-uuid', role: 'student' } });
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'review_reply.created',
    submission_id: 'sub-student-1',
    review_log_id: 'log-1',
    reply_id: 'rep-1',
  });

  assert.ok(h.invalidations.some(k => k[0] === 'review-replies' && k[1] === 'sub-student-1'));
  assert.ok(h.invalidations.some(k => k[0] === 'review-logs' && k[1] === 'sub-student-1'));
});

test('submission.updated event refreshes ticket status and history without full remount', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'submission.updated',
    submission_id: 'sub-abc',
    status: 'approved',
  });

  assert.ok(h.invalidations.some(k => k[0] === 'submissions' && k[1] === 'sub-abc'), 'Detail query must be invalidated');
  assert.ok(h.invalidations.some(k => k[0] === 'review-logs' && k[1] === 'sub-abc'), 'Review log query must be invalidated');
  assert.ok(h.invalidations.some(k => k[0] === 'submissions' && k.length === 1), 'Submissions list must be invalidated');
});

test('review_log.created event (new staff remark) refreshes history and conversation', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'review_log.created',
    submission_id: 'sub-abc',
    review_log_id: 'log-new',
    has_remarks: true,
  });

  assert.ok(h.invalidations.some(k => k[0] === 'review-logs' && k[1] === 'sub-abc'));
  assert.ok(h.invalidations.some(k => k[0] === 'submissions' && k[1] === 'sub-abc'));
  assert.ok(h.invalidations.some(k => k[0] === 'review-replies' && k[1] === 'sub-abc'));
});

test('notification.created updates bell unread_count and refreshes notification list', async () => {
  const h = createTestHarness({ user: { user_id: 'student-99', role: 'student' } });
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'notification.created',
    notification_id: 'notif-100',
    submission_id: 'sub-100',
    unread_count: 5,
  });

  assert.ok(h.invalidations.some(k => k[0] === 'notifications'));
  assert.ok(h.invalidations.some(k => k[0] === 'notifications' && k[1] === 'student-99'));
  assert.ok(h.invalidations.some(k => k[0] === 'submissions' && k[1] === 'sub-100'));

  // Optimistic update of unread_count
  const bellUpdate = h.queryDataUpdates.find(u => u.queryKey[0] === 'notifications');
  assert.ok(bellUpdate, 'Should update notifications query data with unread_count');
  const dummyState = { results: [], unread_count: 4 };
  const updated = bellUpdate.updater(dummyState);
  assert.equal(updated.unread_count, 5);
});

test('notification.read synchronizes unread state across sessions', async () => {
  const h = createTestHarness({ user: { user_id: 'student-99', role: 'student' } });
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'notification.read',
    notification_id: 'notif-100',
    unread_count: 4,
  });

  assert.ok(h.invalidations.some(k => k[0] === 'notifications'));
  const bellUpdate = h.queryDataUpdates.find(u => u.queryKey[0] === 'notifications');
  assert.ok(bellUpdate);
  const updated = bellUpdate.updater({ results: [], unread_count: 5 });
  assert.equal(updated.unread_count, 4);
});

test('background transition releases socket; returning to active reconnects', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  assert.equal(h.createdSockets.length, 1);
  const ws1 = h.createdSockets[0];

  // App goes to background
  h.setAppState('background');
  h.controller.onAppStateChange('background');
  assert.equal(ws1.closed, true, 'Socket should be closed in background');

  // App returns to foreground
  h.setAppState('active');
  await h.controller.onAppStateChange('active');
  assert.equal(h.createdSockets.length, 2, 'Should establish new connection on returning to active');
});

test('deduplication prevents dual fetch between WebSocket and Expo push notification', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  // 1. WebSocket event arrives
  ws.triggerMessage({
    version: 1,
    type: 'notification.created',
    event_id: 'event-uuid-dup',
    notification_id: 'notif-dup-1',
    unread_count: 1,
  });

  const countAfterSocket = h.invalidations.filter(k => k[0] === 'notifications').length;
  assert.ok(countAfterSocket > 0);

  // 2. Native Expo push arrives with same notification_id
  h.controller.onPushNotificationReceived({
    request: {
      content: {
        data: {
          notification_id: 'notif-dup-1',
        },
      },
    },
  });

  const countAfterPush = h.invalidations.filter(k => k[0] === 'notifications').length;
  assert.equal(countAfterPush, countAfterSocket, 'Duplicate push event should NOT trigger an extra invalidation');
});

test('reconnection performs bounded REST sync to recover missed events', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws1 = h.createdSockets[0];
  ws1.triggerOpen();
  ws1.triggerMessage({ type: 'ready' });

  // Simulate drop and reconnect
  ws1.triggerClose(1006);
  assert.equal(h.scheduledTimers.length, 1);
  const retryTimer = h.scheduledTimers[0];

  // Execute retry
  await retryTimer.fn();
  assert.equal(h.createdSockets.length, 2);
  const ws2 = h.createdSockets[1];
  ws2.triggerOpen();

  // Server sends ready on reconnected socket
  h.invalidations.length = 0;
  ws2.triggerMessage({ type: 'ready' });

  assert.ok(h.invalidations.some(k => k[0] === 'notifications'), 'Missed notifications must be synchronized via REST');
  assert.ok(h.invalidations.some(k => k[0] === 'submissions' && k[1] === 'list'), 'Missed submission list changes must be synchronized via REST');
});

test('exponential backoff includes jitter and sensible maximum', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerClose(1006);
  const timer = h.scheduledTimers[0];
  // Base delay: 1000 * 2^0 = 1000 + random()*500 (0.5*500 = 250) = 1250ms
  assert.equal(timer.ms, 1250);
});

test('exact match invalidation covers both string and numeric submission ID', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'review_reply.created',
    submission_id: '42',
    review_log_id: 'log-10',
    reply_id: 'reply-20',
  });

  const matchingString = h.invalidations.some(k => k[0] === 'review-replies' && k[1] === '42');
  const matchingNumber = h.invalidations.some(k => k[0] === 'review-replies' && k[1] === 42);
  assert.ok(matchingString, 'Should invalidate string key representation');
  assert.ok(matchingNumber, 'Should invalidate numeric key representation for TanStack Query strict equality');
});

test('student dashboard counts query key is invalidated on submission events and rest sync', async () => {
  const h = createTestHarness();
  await h.controller.connect();
  const ws = h.createdSockets[0];

  ws.triggerMessage({
    version: 1,
    type: 'submission.created',
    submission_id: '43',
  });

  assert.ok(h.invalidations.some(k => k[0] === 'student-submissions'), 'Student dashboard counts must be invalidated on submission.created');
  assert.ok(h.invalidations.some(k => k[0] === 'submissions'), 'Submissions must also be invalidated');
});

test('disconnect clears query cache to isolate accounts across logout', async () => {
  const h = createTestHarness();
  await h.controller.connect();

  assert.equal(h.hasClearedCache(), false);
  h.controller.disconnect();
  assert.equal(h.hasClearedCache(), true, 'QueryClient cache must be purged on disconnect');
});
