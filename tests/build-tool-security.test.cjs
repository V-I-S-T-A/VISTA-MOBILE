const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

test('the locked Metro patch family is consistent and the vulnerable image-size parser is absent', () => {
  const pkg = require('../package.json');
  const lock = require('../package-lock.json');
  assert.match(pkg.overrides.metro, /^0\.83\.\d+$/, 'Keep this security remediation within the existing Metro minor');
  for (const [name, version] of Object.entries(pkg.overrides)) if (/^metro(?:-|$)/.test(name)) {
    assert.equal(version, pkg.overrides.metro, 'Upgrade the coordinated Metro family together');
    const installed = Object.entries(lock.packages).filter(([file]) => file.endsWith(`node_modules/${name}`));
    assert.ok(installed.length > 0, name);
    for (const [, entry] of installed) assert.equal(entry.version, version);
  }
  assert.ok(!Object.keys(lock.packages).some(file => file.endsWith('node_modules/image-size')));
});

test('Expo resolves patched PostCSS and processes CSS without changing ordinary declarations', async () => {
  const lock = require('../package-lock.json');
  for (const [file, entry] of Object.entries(lock.packages)) if (file.endsWith('node_modules/postcss')) {
    const [major, minor, patch] = entry.version.split('.').map(Number);
    assert.equal(major, 8, 'Do not force a major PostCSS API upgrade');
    assert.ok(minor > 5 || (minor === 5 && patch >= 23), `${file} must include the source-map security fixes`);
  }
  const expoRequire = createRequire(require.resolve('@expo/metro-config/package.json'));
  const postcss = expoRequire('postcss');
  assert.equal(postcss().version, require('../package.json').overrides.postcss);
  const result = await postcss([]).process('.vista { color: #245EA9; padding: 16px; }', { from: undefined, map: false });
  assert.equal(result.css, '.vista { color: #245EA9; padding: 16px; }');
});

test('Expo Metro still measures the bundled PNG and WebP logo after its parser security update', () => {
  const { getAssetSize } = require('@expo/metro/metro/Assets');
  const png = fs.readFileSync(path.join(__dirname, '../assets/native/splash.png'));
  const expected = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  assert.deepEqual(getAssetSize('png', png, 'splash.png'), expected);
  const webp = fs.readFileSync(path.join(__dirname, '../src/assets/logo.webp'));
  assert.deepEqual(getAssetSize('webp', webp, 'logo.webp'), expected, 'Both logo derivatives retain their dimensions');
  assert.throws(() => getAssetSize('png', Buffer.alloc(0), 'empty.png'), /empty file/);
});
