const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...[].concat(value || []));

function setup(login = async () => {}, reset = {}) {
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ login }) },
    '../../services/authService': { authService: reset },
  });
  const screen = h.instance(h.load('src/screens/auth/LoginScreen.jsx').default);
  const find = predicate => nodes(screen.output).find(predicate);
  const input = label => find(n => n.props?.accessibilityLabel === label);
  const submit = () => find(n => n.props?.label === 'Sign in');
  return { h, screen, find, input, submit };
}

test('character hero and rounded form keep original content, scroll access and safe-area space at compact and large text sizes', () => {
  for (const dimensions of [{ width: 320, height: 568, fontScale: 1 }, { width: 320, height: 568, fontScale: 2 }, { width: 800, height: 375, fontScale: 1 }]) {
    const s = setup();
    s.h.native.useWindowDimensions = () => dimensions;
    s.screen.render();
    for (const label of ['VISTA', 'Email address', 'Password', 'Forgot password?']) assert.ok(textOf(s.screen.output).includes(label));
    const scroll = s.find(n => n.type === 'ScrollView');
    assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
    assert.ok(scroll.props.contentContainerStyle.paddingTop >= 24);
    assert.ok(s.find(n => /login-students\.webp$/.test(String(n.props?.source))));
    assert.ok(!s.find(n => /login-illustration/.test(String(n.props?.source))));
    const panel = s.find(n => flat(n.props?.style).borderTopLeftRadius);
    assert.equal(flat(panel.props.style).backgroundColor, '#FFFFFF');
    assert.ok(flat(panel.props.style).paddingBottom >= 24);
    assert.equal(flat(panel.props.style).height, undefined, 'Form grows for keyboard and scaled text');
    assert.equal(s.input('Email address').props.autoComplete, 'email');
    assert.equal(s.input('Password').props.autoComplete, 'current-password');
    assert.equal(s.submit().props.variant, 'accent');
  }
});

test('empty sign-in stays local, shows an error, and preserves password visibility controls', async () => {
  let calls = 0;
  const s = setup(async () => { calls++; });
  await s.submit().props.onPress(); s.screen.render();
  assert.equal(calls, 0);
  assert.ok(textOf(s.screen.output).includes('Enter your email and password.'));
  assert.equal(s.input('Password').props.secureTextEntry, true);
  s.input('Show password').props.onPress(); s.screen.render();
  assert.equal(s.input('Password').props.secureTextEntry, false);
  assert.ok(s.input('Hide password'));
});

test('sign-in trims email, keeps password unchanged, exposes busy feedback and retains inputs after failure', async () => {
  let finish, payload;
  const s = setup(values => { payload = values; return new Promise((resolve, reject) => { finish = reject; }); });
  s.input('Email address').props.onChangeText(' student@example.test ');
  s.input('Password').props.onChangeText(' password '); s.screen.render();
  const pending = s.submit().props.onPress(); s.screen.render();
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), { email: 'student@example.test', password: ' password ' });
  assert.equal(s.submit().props.busy, true);
  finish(new Error('Check credentials')); await pending; s.screen.render();
  assert.equal(s.submit().props.busy, false);
  assert.equal(s.input('Email address').props.value, ' student@example.test ');
  assert.equal(s.input('Password').props.value, ' password ');
  assert.ok(textOf(s.screen.output).includes('Check credentials'));
});

test('password reset retains email prefill, code request and matching-password confirmation contract', async () => {
  const calls = [];
  const s = setup(undefined, {
    requestPasswordReset: async email => calls.push(email),
    confirmPasswordReset: async payload => calls.push(JSON.parse(JSON.stringify(payload))),
  });
  s.input('Email address').props.onChangeText(' student@example.test '); s.screen.render();
  s.find(n => n.type === 'TouchableOpacity' && textOf(n).includes('Forgot password?')).props.onPress(); s.screen.render();
  const sheet = () => s.find(n => n.props?.title === 'Reset Password');
  assert.equal(sheet().props.visible, true);
  assert.equal(s.find(n => n.props?.placeholder === 'Email address').props.value, ' student@example.test ');
  await s.find(n => n.type === 'TouchableOpacity' && textOf(n) === 'Send code').props.onPress(); s.screen.render();
  assert.equal(calls[0], 'student@example.test');
  s.find(n => n.props?.placeholder === 'Verification code').props.onChangeText('123456');
  s.find(n => n.props?.placeholder === 'New password (8+ characters)').props.onChangeText('new-password');
  s.find(n => n.props?.placeholder === 'Confirm new password').props.onChangeText('new-password'); s.screen.render();
  await s.find(n => n.type === 'TouchableOpacity' && textOf(n) === 'Reset').props.onPress(); s.screen.render();
  assert.deepEqual(calls[1], { email: 'student@example.test', code: '123456', newPassword: 'new-password' });
  assert.equal(sheet().props.visible, false);
  assert.equal(s.input('Password').props.value, '');
});
