const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const axios = require('axios');

test('a late JWT refresh cannot replace another account tokens', async () => {
  const exports = {};
  const store = { access: 'expired-a', refresh: 'refresh-a', getAccessToken() { return this.access; }, getRefreshToken() { return this.refresh; }, async setTokens(tokens) { this.access = tokens.access; this.refresh = tokens.refresh; }, async clear() { this.access = this.refresh = null; } };
  const code = babel.transformSync(fs.readFileSync('src/lib/apiClient.js', 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  vm.runInNewContext(code, { exports, require: name => name === 'axios' ? axios : name.includes('connectivityState') ? require('../src/lib/connectivityState.cjs') : name.includes('tokenStore') ? { tokenStore: store } : { API_CONFIG: { BASE_URL: 'https://api.example.com/api', DEFAULT_TIMEOUT_MS: 1000 }, API_ENDPOINTS: { AUTH: { REFRESH: '/auth/token/refresh/' } } } });
  const client = exports.createAuthenticatedApiClient({ baseURL: 'https://api.example.com/api', store });
  let release, ready;
  const started = new Promise(resolve => { ready = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const original = axios.defaults.adapter;
  const adapter = async config => {
    if (config.url.endsWith('/auth/token/refresh/')) { ready(); await gate; return { data: { access: 'late-a', refresh: 'rotated-a' }, status: 200, headers: {}, config }; }
    throw new axios.AxiosError('expired', 'ERR_BAD_REQUEST', config, {}, { status: 401, data: {}, config });
  };
  axios.defaults.adapter = client.defaults.adapter = adapter;
  try {
    const pending = client.post('/notifications/devices/', { token: 'ExpoPushToken[one]' });
    await started;
    await store.setTokens({ access: 'access-b', refresh: 'refresh-b' });
    release();
    await assert.rejects(pending, /session changed/);
    assert.equal(store.access, 'access-b');
    assert.equal(store.refresh, 'refresh-b');
  } finally { axios.defaults.adapter = original; }
});

test('SecureStore writes are serialized across refresh, logout and another login', async () => {
  const exports = {}, values = new Map();
  let release, ready;
  const started = new Promise(resolve => { ready = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const storage = { async getItemAsync(key) { return values.get(key) || null; }, async setItemAsync(key, value) { if (value === 'slow-a') { ready(); await gate; } values.set(key, value); }, async deleteItemAsync(key) { values.delete(key); } };
  const code = babel.transformSync(fs.readFileSync('src/lib/tokenStore.js', 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  vm.runInNewContext(code, { exports, require: name => name === 'react-native' ? { Platform: { OS: 'android' } } : storage });
  const store = exports.tokenStore;
  const oldWrite = store.setTokens({ access: 'slow-a', refresh: 'refresh-a' });
  await started;
  const logout = store.clear();
  const login = store.setTokens({ access: 'access-b', refresh: 'refresh-b' });
  release(); await Promise.all([oldWrite, logout, login]);
  assert.equal(store.getAccessToken(), 'access-b');
  assert.equal(values.get('vista.accessToken'), 'access-b');
  await assert.rejects(store.setTokens({ access: 'late-a' }, { expectedRefreshToken: 'refresh-a' }), /session changed/);
  assert.equal(store.getAccessToken(), 'access-b');
});

test('concurrent authenticated registration requests refresh JWT once and retain the owner', async () => {
  const exports = {};
  const store = { access: 'expired', refresh: 'refresh-a', getAccessToken() { return this.access; }, getRefreshToken() { return this.refresh; }, async setTokens(tokens) { this.access = tokens.access; this.refresh = tokens.refresh || this.refresh; }, async clear() { this.access = this.refresh = null; } };
  const code = babel.transformSync(fs.readFileSync('src/lib/apiClient.js', 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  vm.runInNewContext(code, { exports, require: name => name === 'axios' ? axios : name.includes('connectivityState') ? require('../src/lib/connectivityState.cjs') : name.includes('tokenStore') ? { tokenStore: store } : { API_CONFIG: { BASE_URL: 'https://api.example.com/api', DEFAULT_TIMEOUT_MS: 1000 }, API_ENDPOINTS: { AUTH: { REFRESH: '/auth/token/refresh/' } } } });
  const client = exports.createAuthenticatedApiClient({ baseURL: 'https://api.example.com/api', store });
  let refreshes = 0;
  const original = axios.defaults.adapter;
  const adapter = async config => {
    if (config.url.endsWith('/auth/token/refresh/')) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: { access: 'fresh-a', refresh: 'rotated-a' }, status: 200, headers: {}, config };
    }
    if (config.headers.Authorization !== 'Bearer fresh-a') {
      throw new axios.AxiosError('expired', 'ERR_BAD_REQUEST', config, {}, { status: 401, data: {}, config });
    }
    return { data: { registered: true }, status: 200, headers: {}, config };
  };
  axios.defaults.adapter = adapter;
  client.defaults.adapter = adapter;
  try {
    const responses = await Promise.all([client.post('/notifications/devices/', { token: 'ExpoPushToken[one]' }), client.post('/notifications/devices/', { token: 'ExpoPushToken[two]' })]);
    assert.equal(refreshes, 1);
    assert.equal(store.access, 'fresh-a');
    assert.equal(store.refresh, 'rotated-a');
    assert.ok(responses.every(response => response.data.registered));
  } finally { axios.defaults.adapter = original; }
});
