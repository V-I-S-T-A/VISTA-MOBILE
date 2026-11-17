const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPushRegistrationController } = require('../src/services/pushRegistrationController.cjs');
const { resolveApiUrl, DEPLOYED_API_URL } = require('../src/config/apiUrl.cjs');

function fixture(overrides = {}) {
  let saved = null;
  const calls = [], scheduled = [];
  const deps = {
    load: async () => saved,
    save: async value => { saved = value; },
    permission: async () => ({ granted: true, canAskAgain: true }),
    askPermission: async () => { calls.push('prompt'); return { granted: true }; },
    token: async () => 'ExpoPushToken[one]',
    register: async (token, previous) => { calls.push({ token, previous }); return { registered: true, revoke_key: 'signed-key' }; },
    revoke: async record => { calls.push({ revoke: record.token }); },
    isActive: () => true,
    setTimer: (callback, delay) => { scheduled.push({ callback, delay }); return scheduled.length; },
    clearTimer: () => {},
    ...overrides,
  };
  const controller = createPushRegistrationController(deps);
  return { controller, calls, scheduled, saved: () => saved };
}
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test('sign-in binds and reopening reconciles the same token without a user ID payload', async () => {
  const f = fixture();
  await f.controller.start('student-a');
  await f.controller.start('student-a');
  assert.equal(f.saved().userId, 'student-a');
  assert.equal(f.saved().revokeKey, 'signed-key');
  assert.equal(f.calls.filter(call => call.token).length, 2);
  assert.deepEqual(f.calls[0], { token: 'ExpoPushToken[one]', previous: undefined });
});
test('permission is requested only after sign-in and once per session', async () => {
  const f = fixture({ permission: async () => ({ granted: false, canAskAgain: true }) });
  assert.equal(f.calls.length, 0);
  await f.controller.start('student-a');
  await f.controller.request();
  assert.equal(f.calls.filter(call => call === 'prompt').length, 1);
});
test('token rotation sends the previous token for atomic replacement', async () => {
  let token = 'ExpoPushToken[one]';
  const f = fixture({ token: async () => token });
  await f.controller.start('student-a'); token = 'ExpoPushToken[two]';
  await f.controller.request();
  assert.deepEqual(f.calls[1], { token, previous: 'ExpoPushToken[one]' });
});
test('connectivity failure is journaled and retries automatically', async () => {
  let fail = true;
  const f = fixture({ register: async () => { if (fail) throw new Error('offline'); return { registered: true, revoke_key: 'key' }; } });
  await f.controller.start('student-a');
  assert.equal(f.scheduled.at(-1).delay, 2000);
  assert.equal(f.saved().token, 'ExpoPushToken[one]');
  fail = false; await f.scheduled.at(-1).callback();
  // Timer callbacks intentionally return no UI work; drain the shared request.
  await f.controller.request();
  assert.equal(f.saved().revokeKey, 'key');
});
test('logout drains an in-flight POST and unbinds its confirmed receipt', async () => {
  const gate = deferred(), started = deferred();
  const f = fixture({ register: async () => { started.resolve(); await gate.promise; return { registered: true, revoke_key: 'key' }; } });
  const registration = f.controller.start('student-a'); await started.promise;
  const logout = f.controller.logout(); gate.resolve();
  await Promise.all([registration, logout]);
  assert.equal(f.saved(), null);
  assert.deepEqual(f.calls, [{ revoke: 'ExpoPushToken[one]' }]);
});
test('logout while native token is pending never posts a late registration', async () => {
  const gate = deferred(), started = deferred();
  const f = fixture({ token: async () => { started.resolve(); return gate.promise; } });
  const registration = f.controller.start('student-a'); await started.promise;
  const logout = f.controller.logout(); gate.resolve('ExpoPushToken[one]');
  await Promise.all([registration, logout]);
  assert.equal(f.calls.length, 0);
});
test('offline logout fails closed and retains its revocation credential', async () => {
  const f = fixture({ revoke: async () => { throw new Error('offline'); } });
  await f.controller.start('student-a');
  await assert.rejects(f.controller.logout(), /offline/);
  assert.equal(f.saved().revokeKey, 'signed-key');
});
test('switching accounts revokes the old binding before posting the new one', async () => {
  const f = fixture(); await f.controller.start('student-a');
  await f.controller.start('student-b');
  assert.deepEqual(f.calls[1], { revoke: 'ExpoPushToken[one]' });
  assert.equal(f.saved().userId, 'student-b');
});
test('revoking notification permission unbinds the device', async () => {
  let granted = true;
  const f = fixture({ permission: async () => ({ granted, canAskAgain: false }) });
  await f.controller.start('student-a'); granted = false;
  await f.controller.request();
  assert.equal(f.saved(), null);
});
test('reconcile after authentication token refresh keeps the same device owner', async () => {
  const f = fixture(); await f.controller.start('student-a');
  await f.controller.request();
  assert.equal(f.saved().userId, 'student-a');
});
test('release always uses the deployed HTTPS API despite local .env overrides', () => {
  for (const override of ['http://localhost:8000/api', 'http://192.0.2.1:8000/api', 'http://127.0.0.1:8081']) {
    assert.equal(resolveApiUrl({ development: false, override }), DEPLOYED_API_URL);
  }
  assert.match(DEPLOYED_API_URL, /^https:\/\//);
  assert.equal(resolveApiUrl({ development: true, override: 'http://127.0.0.1:8000/api' }), 'http://127.0.0.1:8000/api');
});
