const fs = require('node:fs');
const path = require('node:path');

// SDK 54's CLI consumes the legacy queue. Metro 0.83.8 (kept for its
// security fixes) exposes root-relative change collections instead.
function toLegacyWatchEvents(event) {
  if (Array.isArray(event.eventsQueue)) return event.eventsQueue;
  if (!event.changes || typeof event.rootDir !== 'string') {
    throw new TypeError('Unsupported Metro watcher event; review the Expo/Metro compatibility patch.');
  }
  const events = [];
  for (const [collection, type] of [['addedFiles', 'add'], ['modifiedFiles', 'change'], ['removedFiles', 'delete']]) {
    for (const [relativePath, metadata] of event.changes[collection] || []) {
      events.push({
        type, filePath: path.join(event.rootDir, relativePath),
        metadata: { modifiedTime: metadata?.modifiedTime ?? null, type: metadata?.isSymlink ? 'l' : 'f' },
      });
    }
  }
  for (const [collection, type] of [['addedDirectories', 'add'], ['removedDirectories', 'delete']]) {
    for (const relativePath of event.changes[collection] || []) {
      events.push({ type, filePath: path.join(event.rootDir, relativePath), metadata: { type: 'd' } });
    }
  }
  return events;
}

function patchWatcherSource(source, adapterRequest, expectedCount) {
  const marker = '// VISTA: normalize Metro watcher events for Expo SDK 54.';
  const original = 'const listener = ({ eventsQueue })=>{';
  const replacement = `const listener = (metroEvent)=>{\n        ${marker}\n        const eventsQueue = require(${JSON.stringify(adapterRequest)}).toLegacyWatchEvents(metroEvent);`;
  const result = source.replaceAll(original, replacement);
  if (result.split(marker).length - 1 !== expectedCount) {
    throw new Error('The installed Expo watcher changed; review the Expo/Metro compatibility patch before starting Metro.');
  }
  return result;
}

function applyExpoMetroWatcherPatch(root) {
  const expoRoot = path.dirname(require.resolve('expo/package.json', { paths: [root] }));
  const cliRoot = path.dirname(require.resolve('@expo/cli/package.json', { paths: [expoRoot] }));
  for (const [name, count] of [['waitForMetroToObserveTypeScriptFile.js', 3], ['metroWatchTypeScriptFiles.js', 1]]) {
    const file = path.join(cliRoot, 'build/src/start/server/metro', name);
    const request = './' + path.relative(path.dirname(file), __filename).split(path.sep).join('/');
    const source = fs.readFileSync(file, 'utf8');
    const result = patchWatcherSource(source, request, count);
    if (result !== source) fs.writeFileSync(file, result);
  }
}

module.exports = { toLegacyWatchEvents, patchWatcherSource, applyExpoMetroWatcherPatch };
if (require.main === module) applyExpoMetroWatcherPatch(path.resolve(__dirname, '..'));
