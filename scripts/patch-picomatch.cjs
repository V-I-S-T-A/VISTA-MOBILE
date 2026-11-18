const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const sha256 = source => crypto.createHash('sha256').update(source).digest('hex');

function patchedSource(source, patch) {
  if (sha256(source) === patch.afterSha256) return source;
  assert.equal(sha256(source), patch.beforeSha256, `Unrecognized picomatch ${patch.version} source; review the backport`);
  for (const { before, after } of patch.replacements) {
    assert.equal(source.split(before).length, 2, 'Security patch context must match exactly once');
    source = source.replace(before, after);
  }
  assert.equal(sha256(source), patch.afterSha256, 'Security patch output does not match reviewed source');
  return source;
}

function inspectPackages(root, apply = false) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const locations = Object.entries(lock.packages).filter(([name]) => /(?:^|\/)node_modules\/picomatch$/.test(name));
  assert.ok(locations.length, 'No locked picomatch packages found; review and retire the backport');
  return locations.map(([location, entry]) => {
    assert.ok(!path.isAbsolute(location) && !location.split(/[\\/]/).includes('..'), 'Invalid package location');
    assert.ok(['2.3.2', '4.0.5'].includes(entry.version), `Unsupported picomatch ${entry.version}; review or retire the backport`);
    const patch = JSON.parse(fs.readFileSync(path.join(root, 'patches/picomatch', `${entry.version}.json`), 'utf8'));
    assert.equal(patch.package, 'picomatch');
    assert.equal(patch.version, entry.version);
    assert.equal(patch.upstreamIntegrity, entry.integrity, 'Upstream package integrity changed; review the backport');
    assert.equal(patch.advisory, 'GHSA-fc5q-39xc-vjpf');
    assert.equal(patch.file, 'lib/parse.js');
    const directory = path.join(root, location);
    const installed = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    assert.equal(installed.name, 'picomatch');
    assert.equal(installed.version, entry.version, 'Installed package differs from the lockfile');
    const file = path.join(directory, patch.file);
    let source = fs.readFileSync(file, 'utf8');
    if (apply) {
      const next = patchedSource(source, patch);
      if (next !== source) fs.writeFileSync(file, next);
      source = fs.readFileSync(file, 'utf8');
    }
    assert.equal(sha256(source), patch.afterSha256, `Missing or modified security backport: ${location}`);
    return { location, version: entry.version, sha256: patch.afterSha256 };
  });
}

module.exports = { patchedSource, sha256, applyPatches: root => inspectPackages(root, true), verifyPatches: root => inspectPackages(root) };
if (require.main === module) console.log(inspectPackages(path.resolve(__dirname, '..'), !process.argv.includes('--check')));
