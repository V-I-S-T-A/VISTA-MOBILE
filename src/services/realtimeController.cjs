// Shared real-time WebSocket controller for VISTA-MOBILE
// Connects to /ws/notifications/, authenticates via JWT handshake,
// routes server events to React Query invalidations, and deduplicates with Expo push.

function deriveWebSocketUrl(baseUrl) {
  const clean = (baseUrl || '').replace(/\/+$/, '');
  const wsBase = clean.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  const hostOnly = wsBase.replace(/\/api\/?$/i, '');
  return `${hostOnly}/ws/notifications/`;
}

function createRealtimeController({
  queryClient,
  user,
  apiClient,
  tokenStore,
  getAppState = () => 'active',
  createWebSocket = url => new WebSocket(url),
  apiUrl,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = id => clearTimeout(id),
  random = Math.random,
}) {
  let disposed = false;
  let socket = null;
  let retryTimer = null;
  let attempts = 0;
  let generation = 0;
  let wasConnected = false;

  // Bounded deduplication set: id -> timestamp
  const recentEvents = new Map();
  const DEDUPE_WINDOW_MS = 15000;

  function pruneRecentEvents() {
    const now = Date.now();
    for (const [key, time] of recentEvents.entries()) {
      if (now - time > DEDUPE_WINDOW_MS) recentEvents.delete(key);
    }
  }

  function isDuplicate(...ids) {
    pruneRecentEvents();
    const validIds = ids.filter(Boolean);
    for (const id of validIds) {
      if (recentEvents.has(id)) return true;
    }
    const now = Date.now();
    for (const id of validIds) {
      recentEvents.set(id, now);
    }
    while (recentEvents.size > 200) {
      const oldest = recentEvents.keys().next().value;
      recentEvents.delete(oldest);
    }
    return false;
  }

  function invalidateSubmissionScoped(prefix, submissionId) {
    if (!submissionId || !queryClient) return;
    queryClient.invalidateQueries({ queryKey: [prefix, submissionId] });
    const numId = Number(submissionId);
    if (!Number.isNaN(numId) && String(numId) === String(submissionId)) {
      queryClient.invalidateQueries({ queryKey: [prefix, numId] });
    }
  }

  function performBoundedRestSync() {
    if (!queryClient) return;
    try {
      // Refresh notifications feed and unread count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (user?.user_id) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.user_id] });
      }
      // Refresh visible submission lists and dashboard counts for both roles
      queryClient.invalidateQueries({ queryKey: ['submissions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['student-submissions'] });
    } catch {}
  }

  function handleServerMessage(message) {
    if (!message || typeof message !== 'object') return;
    const type = message.type;

    if (type === 'ready') {
      attempts = 0;
      if (wasConnected) {
        // Reconnection occurred: perform REST sync to catch up on missed events
        performBoundedRestSync();
      }
      wasConnected = true;
      return;
    }

    if (type === 'pong') {
      return;
    }

    // Check event deduplication by all provided identifiers
    if (isDuplicate(message.event_id, message.notification_id, message.id)) {
      return;
    }

    if (!queryClient) return;

    switch (type) {
      case 'notification.created':
      case 'notification.read':
      case 'notification.unread_count_changed':
      case 'notification.changed': {
        // Optimistically update unread count if provided
        if (typeof message.unread_count === 'number') {
          queryClient.setQueriesData({ queryKey: ['notifications'] }, old => {
            if (!old) return old;
            return { ...old, unread_count: message.unread_count };
          });
        }
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        if (user?.user_id) {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.user_id] });
        }
        if (message.submission_id) {
          invalidateSubmissionScoped('submissions', message.submission_id);
        }
        break;
      }

      case 'submission.created': {
        // Refresh submission lists and dashboard cards for staff and students
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
        queryClient.invalidateQueries({ queryKey: ['student-submissions'] });
        if (message.submission_id) {
          invalidateSubmissionScoped('submissions', message.submission_id);
        }
        break;
      }

      case 'submission.updated': {
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
        queryClient.invalidateQueries({ queryKey: ['student-submissions'] });
        if (message.submission_id) {
          invalidateSubmissionScoped('submissions', message.submission_id);
          invalidateSubmissionScoped('review-logs', message.submission_id);
        }
        break;
      }

      case 'review_log.created': {
        if (message.submission_id) {
          invalidateSubmissionScoped('review-logs', message.submission_id);
          invalidateSubmissionScoped('submissions', message.submission_id);
          invalidateSubmissionScoped('review-replies', message.submission_id);
        }
        break;
      }

      case 'review_reply.created': {
        if (message.submission_id) {
          invalidateSubmissionScoped('review-replies', message.submission_id);
          invalidateSubmissionScoped('review-logs', message.submission_id);
          invalidateSubmissionScoped('submissions', message.submission_id);
        }
        break;
      }

      default:
        break;
    }
  }

  async function connect() {
    if (disposed || getAppState() === 'background' || !user) return;
    const current = ++generation;

    try {
      // Revalidate / refresh access token through authenticated client if needed
      if (apiClient?.get) {
        await apiClient.get('/auth/me/');
      }
      if (disposed || current !== generation) return;

      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
        socket = null;
      }

      const wsUrl = deriveWebSocketUrl(apiUrl);
      const ws = createWebSocket(wsUrl);
      socket = ws;

      ws.onopen = () => {
        if (disposed || current !== generation) {
          ws.close();
          return;
        }
        const token = tokenStore?.getAccessToken?.();
        if (token) {
          ws.send(JSON.stringify({ token }));
        }
      };

      ws.onmessage = event => {
        try {
          const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          handleServerMessage(message);
        } catch {}
      };

      ws.onclose = event => {
        if (current !== generation || disposed) return;
        socket = null;
        if (event && event.code === 4401) {
          // Token expired or invalid: do not tight-loop retry
          return;
        }
        scheduleRetry();
      };

      ws.onerror = () => {
        if (socket === ws) {
          try { ws.close(); } catch {}
        }
      };
    } catch {
      if (current === generation && !disposed) {
        scheduleRetry();
      }
    }
  }

  function scheduleRetry() {
    clearTimer(retryTimer);
    if (!disposed && getAppState() !== 'background') {
      const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) + random() * 500;
      retryTimer = setTimer(connect, delay);
    }
  }

  function onAppStateChange(nextState) {
    generation++;
    clearTimer(retryTimer);
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      try { socket.close(); } catch {}
      socket = null;
    }
    if (nextState === 'active') {
      return connect();
    }
  }

  function onPushNotificationReceived(notification) {
    const data = notification?.request?.content?.data || notification?.data || notification;
    const notifId = data?.notification_id || data?.id;
    const eventId = data?.event_id;
    if (isDuplicate(eventId, notifId)) {
      // Already handled via WebSocket
      return;
    }
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (user?.user_id) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.user_id] });
      }
    }
  }

  function disconnect() {
    disposed = true;
    generation++;
    clearTimer(retryTimer);
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      try { socket.close(); } catch {}
      socket = null;
    }
    recentEvents.clear();
    if (queryClient?.clear) {
      try { queryClient.clear(); } catch {}
    }
  }

  return {
    connect,
    disconnect,
    onAppStateChange,
    onPushNotificationReceived,
    handleServerMessage,
    getSocket: () => socket,
    isDuplicate,
  };
}

module.exports = {
  createRealtimeController,
  deriveWebSocketUrl,
};
