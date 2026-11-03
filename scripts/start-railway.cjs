// Keep the team's ordinary `npm start` / .env workflow intact. This explicit
// launcher points the development build at the deployed API for device review.
const { spawn } = require('node:child_process');
const path = require('node:path');
const { DEPLOYED_API_URL } = require('../src/config/apiUrl.cjs');

const child = spawn(process.execPath, [path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli'),
  'start', '--dev-client', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_API_URL: DEPLOYED_API_URL },
});
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
