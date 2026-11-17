const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { StackRouter, CommonActions, StackActions } = require('@react-navigation/routers');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

for (const role of ['Staff', 'Student']) test(`${role} tabs reuse real StackRouter keys; detail pushes and attachment params remain independent`, () => {
  const file = `src/navigation/${role}Navigator.jsx`;
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const mocks = {
    './createPushStackNavigator': { createPushStackNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) },
    '../context/AuthContext': { useAuth: () => ({ user: {} }) },
    '../hooks/useReducedMotion': { __esModule: true, default: () => false },
  };
  for (const [, name] of source.matchAll(/from ["'](\.\.\/screens\/[^"']+)["']/g)) mocks[name] = { default: 'Page', __esModule: true };
  const h = createHarness(mocks);
  const tree = h.instance(h.load(file).default).output;
  const routes = nodes(tree).filter(n => n.type === 'Screen');
  const options = {
    routeNames: routes.map(r => r.props.name), routeParamList: {},
    routeGetIdList: Object.fromEntries(routes.map(r => [r.props.name, r.props.getId])),
  };
  const router = StackRouter({ initialRouteName: `${role}Home` });
  let state = router.getInitialState(options);
  const tabs = role === 'Staff' ? ['StaffHome', 'StaffDocumentEntry', 'StaffReviewPanel', 'GDriveSync'] : ['StudentHome', 'StudentTracker', 'StudentNotifications'];
  const keys = new Map([[state.routes[0].name, state.routes[0].key]]);
  for (let cycle = 0; cycle < 8; cycle++) for (const name of tabs) {
    state = router.getStateForAction(state, CommonActions.navigate(name), options);
    const route = state.routes[state.index];
    if (keys.has(name)) assert.equal(route.key, keys.get(name), 'Revisits retain the mounted scene and its local state');
    else keys.set(name, route.key);
    assert.equal(new Set(state.routes.map(r => r.name)).size, state.routes.length);
  }
  assert.equal(state.routes.length, tabs.length, 'Repeated tabs cannot accumulate hidden copies');
  if (role === 'Staff') {
    const attachment = { uri: 'file:///isolated-test/document.pdf', name: 'document.pdf', type: 'application/pdf' };
    state = router.getStateForAction(state, CommonActions.navigate('StaffDocumentEntry', { attachment }), options);
    assert.equal(state.routes[state.index].key, keys.get('StaffDocumentEntry'));
    assert.deepEqual(state.routes[state.index].params.attachment, attachment);
  }
  const detail = role === 'Staff' ? 'ReviewPanelDetails' : 'StudentSubmissionDetails';
  state = router.getStateForAction(state, StackActions.push(detail, { submissionId: 'first' }), options);
  const first = state.routes[state.index].key;
  state = router.getStateForAction(state, StackActions.push(detail, { submissionId: 'second' }), options);
  assert.notEqual(state.routes[state.index].key, first, 'Distinct detail visits do not share a scene');
  state = router.getStateForAction(state, StackActions.pop(), options);
  assert.equal(state.routes[state.index].key, first, 'Back returns to the preceding detail');
});

test('progressive lists pause on the real transition and cancel stale frames without losing items', () => {
  const frames = new Map(); let next = 0, concurrentUpdates = 0;
  const h = createHarness({}, {
    requestAnimationFrame(cb) { frames.set(++next, cb); return next; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  h.mocks.react.startTransition = cb => { concurrentUpdates++; cb(); };
  const { NavigationTransitionContext: context, createNavigationTransition } = h.load('src/navigation/NavigationTransitionContext.js');
  const transition = createNavigationTransition();
  context.value = transition;
  transition.setActive(true);
  const hook = h.load('src/hooks/useProgressiveList.js').default;
  const items = Array.from({ length: 12 }, (_, i) => i);
  const view = h.instance(() => hook(items));
  assert.equal(view.output.length, 3);
  assert.equal(frames.size, 0, 'No offscreen batch work during navigation');
  transition.setActive(false); view.render();
  assert.equal(frames.size, 1);
  let stale = [...frames.values()][0];
  transition.setActive(true); view.render();
  assert.equal(frames.size, 0); stale(); view.render();
  assert.equal(view.output.length, 3, 'A cancelled frame cannot add items');
  transition.setActive(false); view.render();
  while (frames.size) {
    assert.equal(frames.size, 1, 'At most one pending batch');
    const before = view.output.length;
    const cb = [...frames.values()][0]; frames.clear(); cb(); view.render();
    assert.equal(view.output.length, before + 1, 'Only one additional card per committed frame');
  }
  assert.deepEqual(view.output, items);
  assert.equal(concurrentUpdates, items.length - 3);
  view.unmount();
  const more = h.instance(() => hook(Array.from({ length: 20 }, (_, i) => i)));
  stale = [...frames.values()][0]; more.unmount(); stale();
  assert.equal(frames.size, 0);
  assert.equal(more.state[0], 3, 'Unmounted lists never update');
});
