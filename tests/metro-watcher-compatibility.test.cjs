const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { EventEmitter } = require('node:events');
const { toLegacyWatchEvents, patchWatcherSource } = require('../scripts/patch-expo-metro.cjs');

const root = path.resolve(__dirname, '..');
const expoRoot = path.dirname(require.resolve('expo/package.json'));
const cliRoot = path.dirname(require.resolve('@expo/cli/package.json', { paths: [expoRoot] }));
const absolute = relative => path.join(root, relative);
function changeEvent({ addedFiles = [], modifiedFiles = [], removedFiles = [], addedDirectories = [], removedDirectories = [] } = {}) {
  return {
    rootDir: root,
    changes: {
      addedFiles: new Map(addedFiles.map(file => [file, { isSymlink: false, modifiedTime: 123 }])),
      modifiedFiles: new Map(modifiedFiles.map(file => [file, { isSymlink: false, modifiedTime: 456 }])),
      removedFiles: new Map(removedFiles.map(file => [file, { isSymlink: false }])),
      addedDirectories: new Set(addedDirectories), removedDirectories: new Set(removedDirectories),
    },
  };
}
function loadWatcher(name) {
  const file = path.join(cliRoot, 'build/src/start/server/metro', name);
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /VISTA: normalize Metro watcher events/);
  const exports = {};
  vm.runInNewContext(source, { exports, require: createRequire(file) }, { filename: file });
  return exports;
}
function runner() {
  const watcher = new EventEmitter(), server = new EventEmitter();
  return { watcher, server, metro: { getBundler: () => ({ getBundler: () => ({ getWatcher: () => watcher }) }) } };
}

test('Metro adapter preserves legacy queues and translates all new file/directory event kinds', () => {
  const eventsQueue = [{ type: 'change', filePath: absolute('App.jsx'), metadata: { type: 'f' } }];
  assert.equal(toLegacyWatchEvents({ eventsQueue }), eventsQueue);
  const events = toLegacyWatchEvents(changeEvent({
    addedFiles: ['new.ts'], modifiedFiles: ['App.jsx'], removedFiles: ['old.js'],
    addedDirectories: ['new-folder'], removedDirectories: ['old-folder'],
  }));
  assert.deepEqual(events.map(event => [event.type, event.filePath, event.metadata.type]), [
    ['add', absolute('new.ts'), 'f'], ['change', absolute('App.jsx'), 'f'], ['delete', absolute('old.js'), 'f'],
    ['add', absolute('new-folder'), 'd'], ['delete', absolute('old-folder'), 'd'],
  ]);
  assert.equal(events[0].metadata.modifiedTime, 123);
  const symlink = changeEvent();
  symlink.changes.addedFiles.set('linked.ts', { isSymlink: true, modifiedTime: 789 });
  assert.equal(toLegacyWatchEvents(symlink)[0].metadata.type, 'l');
  assert.throws(() => toLegacyWatchEvents({}), /Unsupported Metro watcher event/);
});

test('installed Expo startup watcher survives JS edits, detects TypeScript additions and cleans up', () => {
  const { waitForMetroToObserveTypeScriptFile } = loadWatcher('waitForMetroToObserveTypeScriptFile.js');
  const r = runner(); let calls = 0;
  waitForMetroToObserveTypeScriptFile(root, r, () => calls++);
  r.watcher.emit('change', changeEvent({ addedFiles: ['src/new.js', 'node_modules/ignored.ts'], addedDirectories: ['directory.ts'] }));
  assert.equal(calls, 0);
  r.watcher.emit('change', changeEvent({ addedFiles: ['src/new.ts'] }));
  assert.equal(calls, 1);
  assert.equal(r.watcher.listenerCount('change'), 0);
  waitForMetroToObserveTypeScriptFile(root, r, () => calls++);
  r.server.emit('close');
  assert.equal(r.watcher.listenerCount('change'), 0);
});

test('installed Expo specific/any-file observers retain modifications, deletions and close cleanup', () => {
  const { observeFileChanges, observeAnyFileChanges } = loadWatcher('waitForMetroToObserveTypeScriptFile.js');
  const r = runner(); let calls = 0, received;
  observeFileChanges(r, [absolute('babel.config.js')], () => calls++);
  observeAnyFileChanges(r, events => { received = events; });
  r.watcher.emit('change', changeEvent({ modifiedFiles: ['babel.config.js'], removedFiles: ['old.js'] }));
  assert.equal(calls, 1);
  assert.deepEqual(received.map(event => event.type), ['change', 'delete']);
  r.server.emit('close');
  assert.equal(r.watcher.listenerCount('change'), 0);
});

test('installed Expo TypeScript watcher preserves filters, throttling and legacy event support', () => {
  const { metroWatchTypeScriptFiles } = loadWatcher('metroWatchTypeScriptFiles.js');
  const r = runner(), received = [];
  metroWatchTypeScriptFiles({ ...r, projectRoot: root, callback: event => received.push(event), tsconfig: true, throttle: true });
  r.watcher.emit('change', changeEvent({ addedFiles: ['src/types.d.ts', 'node_modules/ignored.ts', 'App.js'], addedDirectories: ['directory.ts'] }));
  assert.equal(received.length, 0);
  r.watcher.emit('change', changeEvent({ modifiedFiles: ['tsconfig.json', 'src/edit.tsx'] }));
  assert.equal(received.length, 1);
  assert.equal(received[0].filePath, absolute('tsconfig.json'));
  r.watcher.emit('change', { eventsQueue: [{ type: 'change', filePath: absolute('src/legacy.ts'), metadata: { type: 'f' } }] });
  assert.equal(received.length, 2);
  r.server.emit('close');
  assert.equal(r.watcher.listenerCount('change'), 0);
  assert.equal(r.watcher.listenerCount('add'), 0);
});

test('Expo patch is idempotent and fails visibly if the upstream watcher contract changes', () => {
  const source = 'const listener = ({ eventsQueue })=>{ callback(eventsQueue); };';
  const patched = patchWatcherSource(source, './adapter.cjs', 1);
  assert.equal(patchWatcherSource(patched, './adapter.cjs', 1), patched);
  assert.throws(() => patchWatcherSource('unexpected upstream source', './adapter.cjs', 1), /installed Expo watcher changed/);
  assert.match(fs.readFileSync('scripts/apply-native-patches.js', 'utf8'), /applyExpoMetroWatcherPatch\(root\)/);
});
