const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyPatches } = require('../patch-picomatch.cjs');

const REMEDIATED_URL = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const blocking = severity => severity === 'high' || severity === 'critical';

// Keep npm's original report intact. Resolve inherited findings to their actual
// advisories; only this exact advisory can be recognized as source-remediated.
function evaluateAudit(report, proof) {
  assert.ok(report && !report.error && report.auditReportVersion === 2, 'Invalid or failed npm audit report');
  assert.ok(report.vulnerabilities && typeof report.vulnerabilities === 'object', 'Missing vulnerability report');
  assert.ok(Array.isArray(proof) && proof.length > 0, 'Verified source backports are required');
  const counts = report.metadata?.vulnerabilities;
  const entries = Object.values(report.vulnerabilities);
  for (const level of ['high', 'critical']) assert.equal(counts?.[level], entries.filter(entry => entry.severity === level).length, 'Inconsistent npm vulnerability counts');
  const verifiedLocations = new Set(proof.map(item => item.location));
  const remaining = new Map(), remediated = new Set();
  const advisoriesFor = (name, seen = new Set()) => {
    if (seen.has(name)) return [];
    const entry = report.vulnerabilities[name];
    assert.ok(entry && Array.isArray(entry.via) && entry.via.length > 0, `Unresolved npm advisory chain: ${name}`);
    const next = new Set([...seen, name]);
    return entry.via.flatMap(via => {
      if (typeof via === 'string') return advisoriesFor(via, next);
      assert.ok(via && typeof via.url === 'string' && typeof via.severity === 'string', 'Malformed npm advisory');
      return [via];
    });
  };
  for (const [name, entry] of Object.entries(report.vulnerabilities)) {
    const sources = advisoriesFor(name);
    assert.ok(sources.length > 0, `No source advisory for ${name}`);
    assert.ok(['info', 'low', 'moderate', 'high', 'critical'].includes(entry.severity), 'Unknown npm severity');
    if (blocking(entry.severity)) assert.ok(sources.some(source => blocking(source.severity)), 'Inconsistent npm advisory severity');
    for (const advisory of sources.filter(source => blocking(source.severity))) {
      if (advisory.url === REMEDIATED_URL && advisory.name === 'picomatch' && advisory.range === '<=4.0.7') {
        const nodes = report.vulnerabilities.picomatch?.nodes;
        assert.ok(Array.isArray(nodes) && nodes.length > 0 && nodes.every(node => verifiedLocations.has(node)), 'Advisory references an unverified picomatch copy');
        remediated.add(advisory.url);
      } else remaining.set(advisory.url, advisory);
    }
  }
  return { remaining: [...remaining.values()], remediated: [...remediated] };
}

function main() {
  const root = path.resolve(__dirname, '../..');
  // Verify every locked installed copy on each run, not just a postinstall marker.
  const proof = verifyPatches(root);
  assert.ok(process.env.npm_execpath, 'Run this check through npm run audit:ci');
  const result = spawnSync(process.execPath, [process.env.npm_execpath, 'audit', '--package-lock-only', '--omit=dev', '--audit-level=high', '--json'], {
    cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024, windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.stderr) process.stderr.write(result.stderr);
  assert.ok(result.status === 0 || result.status === 1, `npm audit failed with exit ${result.status}`);
  console.log('Original npm version-based audit report (unmodified):');
  console.log(result.stdout);
  const report = JSON.parse(result.stdout);
  const evaluated = evaluateAudit(report, proof);
  console.log(`Verified ${proof.length} installed picomatch source backports for GHSA-fc5q-39xc-vjpf.`);
  for (const item of proof) console.log(`  ${item.location}: ${item.version}, sha256 ${item.sha256}`);
  for (const advisory of evaluated.remediated) console.log(`Source-remediated (still reported by npm version matching): ${advisory}`);
  for (const advisory of evaluated.remaining) console.error(`UNRESOLVED ${advisory.severity}: ${advisory.name}: ${advisory.title} ${advisory.url}`);
  console.log(`Unresolved high/critical source advisories: ${evaluated.remaining.length}. Moderate/low findings remain visible in the report above.`);
  process.exitCode = evaluated.remaining.length ? 1 : 0;
}

module.exports = { evaluateAudit };
if (require.main === module) {
  try { main(); } catch (error) { console.error(`Dependency security verification failed: ${error.message}`); process.exitCode = 1; }
}
