const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const code = babel.transformFileSync(path.join(__dirname, '../src/services/appUpdateService.js'), {
  configFile: false, babelrc: false,
  plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
}).code;

function service({ development, platform = 'android', installed = '1', release }) {
  const exports = {}; let requests = 0;
  const modules = {
    'expo-application': { nativeBuildVersion: installed },
    'expo-file-system/legacy': { cacheDirectory: 'test-cache/' },
    'expo-intent-launcher': {},
    'react-native': { Platform: { OS: platform } },
    '../lib/apiClient': { apiClient: { get: async () => { requests++; return { data: release }; } }, unwrapApiError: e => e },
    '../config/api': { API_ENDPOINTS: { APP: { LATEST: '/latest' } } },
  };
  vm.runInNewContext(code, { exports, __DEV__: development, require: name => {
    assert.ok(Object.hasOwn(modules, name), `Unexpected dependency ${name}`);
    return modules[name];
  } });
  return { ...exports, requests: () => requests };
}

test('local development clients never offer a published APK that replaces their current JS', async () => {
  const app = service({ development: true, release: { available: true, version_code: 28 } });
  assert.equal(await app.fetchLatestRelease(), null);
  assert.equal(app.requests(), 0);
});

test('Android release clients retain version checks and required-update behavior', async () => {
  const release = { available: true, version_code: 28, min_supported_code: 10, version_name: '1.0.8' };
  const app = service({ development: false, installed: '9', release });
  const result = await app.fetchLatestRelease();
  assert.equal(app.requests(), 1);
  assert.equal(result.version_code, 28);
  assert.equal(result.version_name, '1.0.8');
  assert.equal(result.forced, true);
  assert.equal(await service({ development: false, installed: '28', release }).fetchLatestRelease(), null);
  assert.equal(await service({ development: false, release: { available: false } }).fetchLatestRelease(), null);
  const ios = service({ development: false, platform: 'ios', release });
  assert.equal(await ios.fetchLatestRelease(), null);
  assert.equal(ios.requests(), 0);
});
