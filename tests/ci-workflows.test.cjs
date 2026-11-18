const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const YAML = require('yaml');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const workflow = name => YAML.parse(read(`.github/workflows/${name}.yml`));

test('ordinary pull requests receive independent checks without credentials or deployment privileges', () => {
  const fast = workflow('mobile-ci');
  assert.deepEqual(fast.on.pull_request.branches, ['main']);
  assert.deepEqual(fast.on.push.branches, ['main']);
  assert.ok(Object.hasOwn(fast.on, 'workflow_dispatch'));
  assert.deepEqual(Object.keys(fast.jobs).sort(), ['expo', 'regression', 'security', 'static']);
  assert.equal(fast.on.pull_request.paths, undefined, 'Required fast checks must run even on documentation-only PRs');
  assert.equal(fast.on.push.paths, undefined);
  assert.deepEqual(Object.fromEntries(Object.entries(fast.jobs).map(([id, job]) => [id, job.name])), {
    static: 'Lint and static validation', regression: 'Regression tests',
    expo: 'Expo config and Android JS bundle', security: 'Dependency security audit',
  }, 'Branch-protection check names are deliberate stable identifiers');
  for (const name of ['mobile-ci', 'android-native']) {
    const config = workflow(name);
    assert.deepEqual(config.permissions, { contents: 'read' });
    assert.equal(config.on.pull_request_target, undefined);
    for (const job of Object.values(config.jobs)) {
      assert.equal(job.needs, undefined, 'A lint failure must not prevent tests or the native check from running');
      assert.equal(job['continue-on-error'], undefined);
      assert.ok(job['timeout-minutes'] > 0);
      const node = job.steps.find(step => step.uses?.startsWith('actions/setup-node@'));
      assert.equal(node.with.cache, 'npm');
      for (const step of job.steps) {
        assert.equal(step['continue-on-error'], undefined);
        if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
        if (step.uses?.startsWith('actions/checkout@')) assert.equal(step.with['persist-credentials'], false);
      }
    }
    assert.doesNotMatch(read(`.github/workflows/${name}.yml`), /secrets\.|pull-requests: write|id-token: write|eas (?:build|submit|update)|npm publish|upload-artifact@/);
  }
  assert.ok(fast.jobs.regression.steps.some(step => step.run === 'npm test'));
  assert.ok(fast.jobs.security.steps.some(step => step.run === 'npm run audit:ci'));
  assert.ok(fast.jobs.security.steps.some(step => step.run === 'npm ci --no-audit --no-fund'), 'Security verification must inspect source patched by the real postinstall');
});

test('native verification uses the committed debug variant, independent caches and no release credentials', () => {
  const native = workflow('android-native');
  assert.equal(native.on.pull_request.paths, undefined, 'Never filter out the required native workflow context');
  assert.equal(native.on.push.paths, undefined);
  assert.equal(native.jobs.debug.name, 'Android debug build');
  const steps = native.jobs.debug.steps;
  const build = steps.find(step => step.name === 'Compile debug APK and run Android lint');
  assert.equal(build['working-directory'], 'android');
  assert.match(build.run, /:app:assembleDebug :app:lintDebug/);
  assert.match(build.run, /-PreactNativeArchitectures=arm64-v8a/);
  assert.equal(build.if, "steps.changes.outputs.required == 'true'");
  assert.doesNotMatch(build.run, /assembleRelease|prebuild|signing/);
  const gradle = steps.find(step => step.uses?.startsWith('gradle/actions/setup-gradle@'));
  assert.match(gradle.with['cache-read-only'], /github.ref != 'refs\/heads\/main'/);
  assert.ok(steps.some(step => step.run?.includes('test ! -f android/app/google-services.json')));
  const sdk = steps.find(step => step.name === 'Install Android SDK components');
  assert.match(sdk.run, /ANDROID_SDK_ROOT:-\$\{ANDROID_HOME:-\}/);
  assert.match(sdk.run, /cmdline-tools\/latest\/bin\/sdkmanager/);
  assert.match(sdk.run, /! -x "\$sdk_manager"/);
  assert.match(sdk.run, /"\$sdk_manager" 'platforms;android-36'/, 'SDK installation must not depend on sdkmanager being on PATH');
  assert.equal(steps.find(step => step.id === 'changes').run, 'node scripts/ci/native-changes.cjs');
  assert.equal(steps.find(step => step.uses?.startsWith('actions/checkout@')).with['fetch-depth'], 0);
  assert.ok(steps.some(step => step.if === "steps.changes.outputs.required == 'false'" && step.run.includes('GITHUB_STEP_SUMMARY')));
});

test('native detection includes dependencies, Expo/autolinking, Gradle, Android source and integration scripts', () => {
  const { isNativeInput, requiresNativeBuild } = require('../scripts/ci/native-changes.cjs');
  for (const file of [
    'package.json', 'package-lock.json', 'app.json', 'app.config.js', 'app.config.ts', 'react-native.config.js',
    'android/build.gradle', 'android/settings.gradle', 'android/gradle.properties', 'android/gradle/wrapper/gradle-wrapper.properties',
    'android/app/src/main/java/com/wayvbb/vistaapp/MainActivity.kt', 'android/app/src/main/AndroidManifest.xml',
    'plugins/android/VistaSplashAnimation.kt', 'scripts/apply-native-patches.js', 'scripts/ci/native-changes.cjs', 'patches/picomatch/4.0.5.json',
    'assets/native/splash.png', 'src/assets/branding/lucide-LICENSE.txt', '.node-version', '.github/workflows/android-native.yml',
  ]) {
    assert.equal(isNativeInput(file), true, file);
    assert.equal(requiresNativeBuild('pull_request', {}, [file]), true, file);
  }
  const uiFiles = ['README.md', 'docs/ci.md', 'src/screens/student/StudentHomeScreen.jsx', 'src/theme/tokens.js'];
  assert.equal(requiresNativeBuild('pull_request', {}, uiFiles), false);
  assert.equal(requiresNativeBuild('push', { before: 'a'.repeat(40) }, uiFiles), false);
  assert.equal(requiresNativeBuild('workflow_dispatch', {}, []), true);
  assert.equal(requiresNativeBuild('push', { before: '0'.repeat(40) }, []), true);
});

test('native detection CLI writes a completed result and fails closed for a bad diff or commit SHA', () => {
  const source = read('scripts/ci/native-changes.cjs');
  const sha = 'a'.repeat(40), head = 'b'.repeat(40);
  const run = ({ eventName = 'pull_request', event = { pull_request: { base: { sha }, head: { sha: head } } }, diff = '', gitError = false } = {}) => {
    const module = { exports: {} }, calls = [], outputs = [];
    const require = name => name === 'node:fs' ? {
      readFileSync: () => JSON.stringify(event), appendFileSync: (file, value) => outputs.push([file, value]),
    } : { execFileSync: (...args) => { calls.push(args); if (gitError) throw new Error('diff unavailable'); return diff; } };
    require.main = module;
    vm.runInNewContext(source, { require, module, console: { log() {} }, process: { env: { GITHUB_EVENT_NAME: eventName, GITHUB_EVENT_PATH: '/event', GITHUB_OUTPUT: '/output' } } });
    return { calls, outputs };
  };
  const ui = run({ diff: 'README.md\0src/screens/student/StudentHomeScreen.jsx\0' });
  assert.equal(ui.outputs[0][1], 'required=false\n');
  assert.equal(ui.calls[0][0], 'git');
  assert.ok(ui.calls[0][1].includes(`${sha}...${head}`));
  const native = run({ diff: 'android/app/build.gradle\0' });
  assert.equal(native.outputs[0][1], 'required=true\n');
  const push = run({ eventName: 'push', event: { before: sha, after: head } });
  assert.ok(push.calls[0][1].includes(`${sha}..${head}`));
  const manual = run({ eventName: 'workflow_dispatch', event: {} });
  assert.equal(manual.calls.length, 0); assert.equal(manual.outputs[0][1], 'required=true\n');
  assert.throws(() => run({ gitError: true }), /diff unavailable/);
  assert.throws(() => run({ event: { pull_request: { base: { sha: 'bad; command' }, head: { sha: head } } } }), /Invalid or missing/);
});

test('the test runner discovers every existing suite and fails if tests are absent', () => {
  let command;
  const source = read('scripts/ci/run-tests.cjs');
  const files = fs.readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.test.cjs')).sort();
  const evaluate = list => {
    const process = { execPath: 'node' };
    vm.runInNewContext(source, {
      __dirname: path.join(root, 'scripts/ci'), process, console,
      require: name => name === 'node:fs' ? { readdirSync: () => list } : name === 'node:path' ? path : {
        spawnSync: (executable, args, options) => { command = { executable, args, options }; return { status: 7 }; },
      },
    });
    return process.exitCode;
  };
  assert.equal(evaluate(files), 7, 'A failed test process must fail CI');
  assert.deepEqual(Array.from(command.args).filter(arg => arg.startsWith('tests/')), files.map(file => `tests/${file}`));
  assert.ok(command.args.includes('./tests/helpers/no-network.cjs'));
  assert.throws(() => evaluate([]), /No regression tests found/);
});
