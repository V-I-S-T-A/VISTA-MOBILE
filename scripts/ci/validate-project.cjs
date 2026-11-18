const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const YAML = require('yaml');
const { isBuiltin } = require('node:module');
const { getConfig } = require('expo/config');

const root = path.resolve(__dirname, '../..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const errors = [];
const check = (label, action) => { try { action(); } catch (error) { errors.push(`${label}: ${error.message}`); } };

// Check path case even on Windows, so Linux does not discover missing assets later.
function exactFile(file) {
  const relative = path.relative(root, file);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `Reference escapes project: ${file}`);
  let parent = root;
  for (const segment of relative.split(path.sep)) {
    assert.ok(fs.readdirSync(parent).includes(segment), `Missing or incorrectly cased path: ${relative}`);
    parent = path.join(parent, segment);
  }
  assert.ok(fs.statSync(parent).isFile(), `Expected file: ${relative}`);
}

function reference(specifier, from) {
  if (!specifier.startsWith('.')) {
    if (isBuiltin(specifier)) return;
    const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
    assert.ok(lock.packages[`node_modules/${name}`], `Package not locked: ${specifier} (${from})`);
    return;
  }
  const base = path.resolve(path.dirname(from), specifier);
  const suffixes = ['', '.android.js', '.native.js', '.js', '.jsx', '.cjs', '.json', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.cjs', '/index.ts', '/index.tsx'];
  const resolved = suffixes.map(suffix => base + suffix).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
  assert.ok(resolved, `Missing reference ${specifier} in ${path.relative(root, from)}`);
  exactFile(resolved);
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(js|jsx|cjs|ts|tsx)$/.test(file) ? [file] : [];
  });
}

const sources = [
  ...['src', 'plugins', 'scripts/ci'].flatMap(name => sourceFiles(path.join(root, name))),
  ...['App.js', 'App.jsx', 'app.config.js', 'babel.config.js', 'metro.config.js', 'tailwind.config.js', 'scripts/apply-native-patches.js'].filter(file => fs.existsSync(path.join(root, file))).map(file => path.join(root, file)),
];
for (const file of sources) check(path.relative(root, file), () => {
  const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'unambiguous', plugins: /\.tsx?$/.test(file) ? ['typescript', 'jsx'] : ['jsx'] });
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) reference(node.source.value, file);
    if (node.type === 'CallExpression' && (node.callee?.name === 'require' || node.callee?.type === 'Import') && node.arguments[0]?.type === 'StringLiteral') reference(node.arguments[0].value, file);
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'start', 'end', 'extra', 'comments'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast);
});

check('lockfile', () => {
  for (const field of ['dependencies', 'devDependencies']) assert.deepEqual(lock.packages[''][field], pkg[field], `${field} differ; update package-lock.json`);
});

check('Expo config and assets', () => {
  const { exp } = getConfig(root, { skipSDKVersionRequirement: false });
  assert.equal(exp.android.package, 'com.wayvbb.vistaapp');
  assert.ok(exp.version && exp.extra?.eas?.projectId, 'Version and EAS project identity are required');
  const assets = [exp.icon, exp.splash?.image, exp.android.adaptiveIcon?.foregroundImage, exp.web?.favicon];
  for (const plugin of exp.plugins || []) {
    const [name, options] = Array.isArray(plugin) ? plugin : [plugin];
    if (name.startsWith('.')) reference(name, path.join(root, 'app.json'));
    if (name === 'expo-splash-screen') assets.push(options?.image);
  }
  for (const file of assets.filter(Boolean)) exactFile(path.resolve(root, file));
});

for (const name of ['mobile-ci.yml', 'android-native.yml']) check(name, () => {
  const document = YAML.parseDocument(fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8'), { uniqueKeys: true });
  assert.equal(document.errors.length, 0, document.errors.map(error => error.message).join('\n'));
  const workflow = document.toJS();
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(workflow.on.pull_request.branches, ['main']);
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'));
  for (const job of Object.values(workflow.jobs)) {
    assert.ok(job['timeout-minutes'] > 0);
    for (const step of job.steps) if (step.uses) assert.match(step.uses, /^[\w-]+\/[\w/-]+@[a-f0-9]{40}$/, 'Pin actions to full commit hashes');
  }
});
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Validated ${sources.length} source/config files, references, Expo assets, lockfile and workflow structure.`);
