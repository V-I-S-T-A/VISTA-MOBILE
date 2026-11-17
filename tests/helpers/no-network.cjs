// Regression tests must use fixtures/mocks, never Railway, real mail or push.
const deny = () => { throw new Error('Network access is forbidden in regression tests; inject a mock transport.'); };
globalThis.fetch = deny;
for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  transport.request = deny;
  transport.get = deny;
}
