const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const tests = fs.readdirSync(path.join(root, 'tests')).filter(name => name.endsWith('.test.cjs')).sort().map(name => `tests/${name}`);
if (!tests.length) throw new Error('No regression tests found. Include tests/ and its helpers in the checkout.');
const result = spawnSync(process.execPath, [
  '--require', './tests/helpers/no-network.cjs', '--test', '--test-concurrency=2', ...tests,
], { cwd: root, stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
