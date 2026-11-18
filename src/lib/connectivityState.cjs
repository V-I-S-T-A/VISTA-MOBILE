function createConnectivityState(initialOnline = true) {
  let online = initialOnline;
  const listeners = new Set();
  return {
    isOnline: () => online,
    setOnline(value) {
      if (typeof value !== 'boolean' || value === online) return;
      online = value;
      listeners.forEach(listener => listener(online));
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

function offlineError() {
  const error = new Error('You are offline or VISTA cannot be reached. Connect and try again. Nothing was sent.');
  error.code = 'OFFLINE';
  return error;
}

function isConnectionError(error) {
  return !error?.response && ['OFFLINE', 'ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND'].includes(error?.code);
}

const connectivity = createConnectivityState();
module.exports = { connectivity, createConnectivityState, offlineError, isConnectionError };
