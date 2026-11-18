const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { normalizeApiError } = require('../src/lib/apiErrors.cjs');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('nested validation errors produce readable text and preserve every field message', () => {
  const error = normalizeApiError({ response: { status: 400, data: {
    code: 'validation_error', profile: { email: ['Enter a valid email address.'], name: ['This field is required.'] },
  } } });
  assert.equal(error.message, 'Profile email: Enter a valid email address.');
  assert.deepEqual(error.fieldErrors, { 'profile.email': ['Enter a valid email address.'], 'profile.name': ['This field is required.'] });
  assert.equal(error.code, 'validation_error'); assert.equal(error.status, 400);
  assert.ok(!error.message.includes('[object Object]'));
});

test('explicit detail, non-field and message errors retain their intended priority', () => {
  for (const data of [{ detail: ['Please sign in again.'] }, { non_field_errors: ['Please sign in again.'] }, { message: 'Please sign in again.' }, { detail: { nested: ['Please sign in again.'] } }]) {
    assert.equal(normalizeApiError({ response: { status: 401, data } }).message, 'Please sign in again.');
  }
  assert.equal(normalizeApiError({ response: { status: 403, data: { code: 'drive_reauth_required', detail: 'Reconnect Google Drive.' } } }).code, 'drive_reauth_required');
});

test('server failures and HTML responses show recovery text instead of raw technical output', () => {
  for (const data of ['<html>Internal error: private details</html>', { detail: 'Traceback: private details' }, { stack: 'private details' }]) {
    const error = normalizeApiError({ response: { status: 503, data }, message: 'Request failed with status code 503' });
    assert.equal(error.message, 'VISTA could not complete the request. Please try again shortly.');
    assert.equal(error.status, 503); assert.ok(!error.message.includes('private'));
    assert.deepEqual(error.fieldErrors, {});
  }
  assert.match(normalizeApiError({ response: { status: 400, data: '<html>Bad request</html>' } }).message, /check the information/);
});

test('offline, timeout, cancellation, rate limit and missing errors remain distinguishable', () => {
  const offline = normalizeApiError({ code: 'OFFLINE', message: 'You are offline. Nothing was sent.' });
  assert.equal(offline.code, 'OFFLINE'); assert.match(offline.message, /offline/);
  for (const code of ['ECONNABORTED', 'ETIMEDOUT']) {
    const error = normalizeApiError({ code, message: 'technical timeout' });
    assert.equal(error.code, code); assert.match(error.message, /took too long/); assert.ok(!error.message.includes('Nothing was sent'));
  }
  assert.match(normalizeApiError({ code: 'ERR_CANCELED' }).message, /cancelled/);
  assert.match(normalizeApiError({ response: { status: 429, data: { code: 'throttled' } } }).message, /wait a moment/);
  for (const value of [undefined, null, {}, { response: { data: { code: 'unknown' } } }]) assert.equal(typeof normalizeApiError(value).message, 'string');
});

test('deep, malformed and prototype-named validation fields cannot crash normalization', () => {
  const data = { toString: ['Please choose another value.'] }; data.circular = data;
  const error = normalizeApiError({ response: { status: 400, data } });
  assert.equal(error.message, 'ToString: Please choose another value.');
  assert.equal(Object.getPrototypeOf(error.fieldErrors), Object.prototype);
  assert.ok(Object.keys(error.fieldErrors).length <= 40);
  const polluted = normalizeApiError({ response: { status: 400, data: JSON.parse('{"__proto__":{"polluted":["bad"]},"title":["Enter a title."]}') } });
  assert.equal(polluted.message, 'Title: Enter a title.'); assert.equal({}.polluted, undefined);
});

function boundaryFixture() {
  let splashHidden = 0;
  const h = createHarness({ 'expo-splash-screen': { hideAsync: async () => { splashHidden++; } } });
  h.mocks.react.Component = class { constructor(props) { this.props = props; } setState(value) { this.state = { ...this.state, ...value }; } };
  h.native.SafeAreaView = 'SafeAreaView'; h.native.StatusBar = { currentHeight: 24 };
  return { h, module: h.load('src/components/common/AppErrorBoundary.jsx'), hidden: () => splashHidden };
}

test('render recovery keeps normal children unchanged and only resets the failed view after explicit action', () => {
  const { module } = boundaryFixture();
  const child = { screen: 'existing navigation' };
  const boundary = new module.default({ children: child });
  assert.equal(boundary.render(), child);
  boundary.state = module.default.getDerivedStateFromError(new Error('private token / document content'));
  const fallback = boundary.render();
  assert.equal(fallback.type, module.AppRecoveryScreen);
  assert.equal(boundary.state.failed, true, 'Recovery must wait for an explicit action');
  fallback.props.onRetry();
  assert.equal(boundary.render(), child);
});

test('recovery surface has a bundled illustration, accessible action, scrollable layout and native splash handoff', async () => {
  const { h, module, hidden } = boundaryFixture(); let retries = 0;
  const page = h.instance(module.AppRecoveryScreen, { onRetry: () => retries++ });
  assert.ok(nodes(page.output).some(node => node.type === 'ScrollView'));
  const image = nodes(page.output).find(node => node.type === 'Image');
  assert.match(image.props.source, /state-connection.webp$/);
  assert.ok(!textOf(page.output).includes('private'));
  assert.match(textOf(page.output), /check its latest state/i);
  const action = nodes(page.output).find(node => node.props.accessibilityRole === 'button');
  assert.equal(action.props.accessibilityLabel, 'Reopen VISTA');
  action.props.onPress(); assert.equal(retries, 1);
  await page.output.props.onLayout(); assert.equal(hidden(), 1);
  page.unmount();
});

test('root recovery encloses the app content without modifying the existing provider hierarchy', () => {
  const source = fs.readFileSync('App.jsx', 'utf8');
  assert.match(source, /return <AppErrorBoundary><AppContent\s*\/><\/AppErrorBoundary>/);
  assert.ok(source.indexOf('<QueryClientProvider') < source.indexOf('<AuthProvider>'));
  assert.ok(source.indexOf('<AuthProvider>') < source.indexOf('<NavigationContainer'));
  const boundary = fs.readFileSync('src/components/common/AppErrorBoundary.jsx', 'utf8');
  assert.ok(!/\.clear\(|logout\(|mutate|reloadAsync|setTokens/.test(boundary), 'A view retry must not clear credentials, drafts or replay writes');
});
