const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { applyPatches, verifyPatches, patchedSource, sha256 } = require('../scripts/patch-picomatch.cjs');
const { evaluateAudit } = require('../scripts/ci/audit-dependencies.cjs');
const root = path.resolve(__dirname, '..');
const advisory = { name: 'picomatch', severity: 'high', range: '<=4.0.7', title: 'Repeated wildcard ReDoS', url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf' };
const reportFor = source => ({ auditReportVersion: 2, metadata: { vulnerabilities: { high: source.severity === 'high' ? 3 : 0, critical: source.severity === 'critical' ? 3 : 0 } }, vulnerabilities: {
  picomatch: { severity: source.severity, via: [source], nodes: verifyPatches(root).map(item => item.location) },
  micromatch: { severity: source.severity, via: ['picomatch'] },
  expo: { severity: source.severity, via: ['micromatch'] },
} });

function fixture(t, version) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vista-picomatch-test-'));
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const patch = require(`../patches/picomatch/${version}.json`);
  const location = version.startsWith('2') ? 'node_modules/micromatch/node_modules/picomatch' : 'node_modules/picomatch';
  const target = path.join(directory, location);
  fs.cpSync(path.join(root, location), target, { recursive: true });
  let original = fs.readFileSync(path.join(target, patch.file), 'utf8');
  for (const { before, after } of [...patch.replacements].reverse()) original = original.replace(after, before);
  assert.equal(sha256(original), patch.beforeSha256, 'Pristine-source negative control must match upstream');
  fs.writeFileSync(path.join(target, patch.file), original);
  fs.mkdirSync(path.join(directory, 'patches/picomatch'), { recursive: true });
  fs.copyFileSync(path.join(root, `patches/picomatch/${version}.json`), path.join(directory, `patches/picomatch/${version}.json`));
  fs.writeFileSync(path.join(directory, 'package-lock.json'), JSON.stringify({ packages: { [location]: { version, integrity: patch.upstreamIntegrity } } }));
  return { directory, target, patch, original };
}

test('every locked installed matcher has the verified source backport, with no package version substitution', () => {
  const proof = verifyPatches(root);
  assert.ok(proof.some(item => item.version === '2.3.2'));
  assert.ok(proof.some(item => item.version === '4.0.5'));
  assert.equal(proof.length, Object.keys(require('../package-lock.json').packages).filter(file => /(?:^|\/)node_modules\/picomatch$/.test(file)).length);
});

for (const version of ['2.3.2', '4.0.5']) {
  test(`picomatch ${version}: source verification rejects missing, tampered or mismatched patches and applies idempotently`, t => {
    const { directory, target, patch, original } = fixture(t, version);
    assert.throws(() => verifyPatches(directory), /Missing or modified/);
    const expected = patchedSource(original, patch);
    assert.equal(patchedSource(expected, patch), expected);
    assert.throws(() => patchedSource(original + '\n', patch), /Unrecognized/);
    applyPatches(directory); applyPatches(directory);
    assert.equal(verifyPatches(directory)[0].sha256, patch.afterSha256);
    fs.appendFileSync(path.join(target, patch.file), '\n');
    assert.throws(() => verifyPatches(directory), /Missing or modified/);
    fs.writeFileSync(path.join(target, patch.file), expected);
    const lock = JSON.parse(fs.readFileSync(path.join(directory, 'package-lock.json'), 'utf8'));
    Object.values(lock.packages)[0].integrity = 'changed-upstream';
    fs.writeFileSync(path.join(directory, 'package-lock.json'), JSON.stringify(lock));
    assert.throws(() => verifyPatches(directory), /integrity changed/);
  });

  test(`picomatch ${version}: vulnerable original stalls, while the backport handles adversarial wildcard branches within a deadline`, t => {
    const { directory, target } = fixture(t, version);
    const baseline = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(target)}).isMatch('a'.repeat(80)+'!', '+(*a)')`], { timeout: 1500, encoding: 'utf8', windowsHide: true });
    assert.equal(baseline.error?.code, 'ETIMEDOUT', baseline.stderr || 'Negative control must reproduce the original stall');
    applyPatches(directory);
    const run = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const p = require(${JSON.stringify(target)});
      for (const options of [{}, {dot:true}, {windows:true}, {bash:true}, {capture:true}]) {
        for (const pattern of ['+(*a)', '*(*a)', '+(*)c', '+(*a)c', 'x+(*a)', '+(*[ab])', '+(*?a)', '+(a*[ab])', '+(**a)']) {
          assert.equal(p.isMatch('a'.repeat(1000)+'!', pattern, options), false, pattern);
        }
        assert.equal(p.isMatch('a.js'.repeat(1000)+'!', '+(*.js)', options), false);
        assert.equal(p.isMatch('a'.repeat(1000)+'!', '!+(*a)', options), true);
      }
    `], { timeout: 8000, encoding: 'utf8', windowsHide: true });
    assert.equal(run.error, undefined, String(run.error));
    assert.equal(run.status, 0, run.stderr);
  });

  test(`picomatch ${version}: normal glob results, hooks and capture APIs remain compatible`, t => {
    const { directory, target } = fixture(t, version);
    const baseline = require(target);
    const patterns = ['**/*.js', '**/*.{js,jsx,ts,tsx}', '*', '.*', '**/node_modules/**', '!**/*.test.cjs', '+(*)', '+(*a)', '*(*a)', '+(a*)', '+(a*b)', '*(*.js)', '*(f*(o))', 'foo/+(a|aa)/bar', '+("*a")', '+(\\*a)'];
    const inputs = ['', 'a', 'aaa', 'ab', 'foo.js', '.env', 'src/App.jsx', 'src/index.js', 'node_modules/a/index.js', 'foo/foo.test.cjs', 'ffo', '*a*a'];
    const expected = [];
    for (const options of [{}, {dot:true}, {windows:true}, {bash:true}]) for (const pattern of patterns) for (const input of inputs) expected.push(baseline.isMatch(input,pattern,options));
    applyPatches(directory);
    for (const file of Object.keys(require.cache)) if (file.startsWith(target + path.sep)) delete require.cache[file];
    const patched = require(target), actual=[];
    for (const options of [{}, {dot:true}, {windows:true}, {bash:true}]) for (const pattern of patterns) for (const input of inputs) actual.push(patched.isMatch(input,pattern,options));
    assert.deepEqual(actual,expected,'Preserve existing ordinary matching semantics');
    assert.deepEqual(patched.makeRe('src/(*)/*.js', {capture:true}).exec('src/app/index.js'), baseline.makeRe('src/(*)/*.js', {capture:true}).exec('src/app/index.js'));
    let matched=0;assert.equal(patched('**/*.js',{onMatch(){matched++;}})('src/index.js'),true);assert.equal(matched,1);
    assert.equal(patched.isMatch('+(*[ab])','+(*[ab])'),true,'Unsupported risky wildcard branch has the existing literal fallback');
    assert.equal(patched.isMatch('aaa','+(*[ab])'),false);
    assert.equal(patched.isMatch('aaa','+(*a)',{capture:true}),false,'Unsafe repeated capture uses the existing literal safeguard');
  });
}

test('audit recognizes only the exact source-remediated advisory and its inherited findings', () => {
  const result=evaluateAudit(reportFor(advisory),verifyPatches(root));
  assert.equal(result.remaining.length,0);assert.deepEqual(result.remediated,[advisory.url]);
  assert.throws(()=>evaluateAudit(reportFor(advisory),[]),/Verified source backports/);
});

test('audit still blocks new, changed-range and unrelated high or critical advisories', () => {
  for(const change of [{url:'https://github.com/advisories/GHSA-new-issue'},{name:'different-package'},{range:'*'},{url:'https://example.test/critical',severity:'critical'}]){
    const result=evaluateAudit(reportFor({...advisory,...change}),verifyPatches(root));
    assert.equal(result.remaining.length,1);
  }
  const report=reportFor(advisory);
  report.vulnerabilities.other={severity:'high',via:[{...advisory,name:'other',url:'https://example.test/other'}]};
  report.metadata.vulnerabilities.high++;
  assert.equal(evaluateAudit(report,verifyPatches(root)).remaining.length,1);
});

test('audit rejects unverified package locations and a report that drops blocking findings', () => {
  const report=reportFor(advisory);
  report.vulnerabilities.picomatch.nodes.push('node_modules/unverified/node_modules/picomatch');
  assert.throws(()=>evaluateAudit(report,verifyPatches(root)),/unverified picomatch/);
  assert.throws(()=>evaluateAudit({auditReportVersion:2,metadata:{vulnerabilities:{high:1,critical:0}},vulnerabilities:{}},verifyPatches(root)),/counts/);
});

test('audit fails closed on service errors, malformed reports, missing advisory chains and unknown severities', () => {
  for(const report of [{error:{message:'network'}},{auditReportVersion:1},{auditReportVersion:2,vulnerabilities:{x:{severity:'high',via:['missing']}}},{auditReportVersion:2,vulnerabilities:{x:{severity:'high',via:['x']}}},{auditReportVersion:2,vulnerabilities:{x:{severity:'unknown',via:[advisory]}}}]){
    assert.throws(()=>evaluateAudit(report,verifyPatches(root)));
  }
});
