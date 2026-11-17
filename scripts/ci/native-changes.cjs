const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

// Keep the workflow/check present on every PR. Only expensive native steps skip.
// Match inputs to Android compilation/autolinking rather than ordinary UI files.
function isNativeInput(file) {
  return /^(android|plugins|assets\/native|src\/assets\/branding|scripts|\.github\/actions)\//.test(file) ||
    /^(package\.json|package-lock\.json|app\.json|app\.config\.(js|cjs|ts)|react-native\.config\.(js|cjs)|\.node-version|\.npmrc|gradle\.properties|settings\.gradle(?:\.kts)?|build\.gradle(?:\.kts)?|\.github\/workflows\/android-native\.yml)$/.test(file);
}

function requiresNativeBuild(eventName, event, changedFiles) {
  if (eventName === 'workflow_dispatch') return true;
  if (eventName === 'push' && /^0+$/.test(event.before || '')) return true;
  return changedFiles.some(isNativeInput);
}

function run() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  if (!['pull_request', 'push', 'workflow_dispatch'].includes(eventName)) throw new Error(`Unsupported event: ${eventName}`);
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  let files = [];
  if (eventName !== 'workflow_dispatch' && !(eventName === 'push' && /^0+$/.test(event.before || ''))) {
    const base = eventName === 'pull_request' ? event.pull_request.base.sha : event.before;
    const head = eventName === 'pull_request' ? event.pull_request.head.sha : event.after;
    for (const sha of [base, head]) if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('Invalid or missing event commit SHA');
    // Compare the PR's diff from its merge base, including renames/deletions.
    const range = `${base}${eventName === 'pull_request' ? '...' : '..'}${head}`;
    files = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', range, '--'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).split('\0').filter(Boolean);
  }
  const required = requiresNativeBuild(eventName, event, files);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `required=${required}\n`);
  console.log(required ? 'Android native inputs changed (or manual/initial run); verify debug compilation.' : 'No Android native input changes; native compilation is not required.');
}

module.exports = { isNativeInput, requiresNativeBuild };
if (require.main === module) run();
