const { test } = require('node:test');
const assert = require('node:assert/strict');
const { revokePushDevice } = require('../src/services/revokePushDevice.cjs');
const invalid = () => Object.assign(new Error('invalid receipt'), { response: { status: 400, data: { detail: 'Invalid revocation credential.' } } });
test('invalid receipt falls back only after authenticated ownership verification', async () => {
  const calls = [];
  await revokePushDevice({ userId: '7', token: 'ExpoPushToken[fixture]', revokeKey: 'invalid' }, {
    revokeReceipt: async () => { throw invalid(); },
    client: { get: async path => { calls.push(path); return { data: { user_id: 7 } }; }, delete: async (path, body) => calls.push([path, body]) },
  });
  assert.equal(calls[0], '/auth/me/'); assert.deepEqual(calls[1], ['/notifications/devices/', { data: { token: 'ExpoPushToken[fixture]' } }]);
});
test('foreign or unknown owner, authentication failure and network failure never bypass cleanup', async () => {
  for (const owner of [8, null]) {
    let deleted = false;
    await assert.rejects(revokePushDevice({ userId: owner, revokeKey: 'invalid' }, { revokeReceipt: async () => { throw invalid(); }, client: { get: async () => ({ data: { user_id: 7 } }), delete: async () => { deleted = true; } } }));
    assert.equal(deleted, false);
  }
  for (const error of [new Error('offline'), { response: { status: 500 } }, { response: { status: 400, data: { detail: 'other failure' } } }]) {
    await assert.rejects(revokePushDevice({ userId: 7, revokeKey: 'key' }, { revokeReceipt: async () => { throw error; }, client: { get: async () => { throw Error('must not fallback'); } } }));
  }
});
test('valid receipt avoids authentication fallback; failed authenticated delete can be retried', async () => {
  await revokePushDevice({ revokeKey: 'valid' }, { revokeReceipt: async () => {}, client: {} });
  let fail = true, attempts = 0;
  const record = { userId: 7, token: 'fixture', revokeKey: 'invalid' };
  const deps = { revokeReceipt: async () => { throw invalid(); }, client: { get: async () => ({ data: { user_id: 7 } }), delete: async () => { attempts++; if (fail) throw Error('offline'); } } };
  await assert.rejects(revokePushDevice(record, deps)); assert.equal(record.revokeKey, 'invalid');
  fail = false; await revokePushDevice(record, deps); assert.equal(attempts, 2);
});
