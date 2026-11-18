const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const rq = require('@tanstack/react-query');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const stateModule = require('../src/lib/connectivityState.cjs');
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const staff = { user_id: 'staff-a', role: 'staff', first_name: 'Staff' };
const student = { user_id: 'student-b', role: 'student', first_name: 'Student' };

function sessionFixture({ user = staff, binding = 'refresh-a', saved = true, me = async () => { throw stateModule.offlineError(); } } = {}) {
  const storage = new Map([
    ['vista.accessToken', 'access-a'], ['vista.refreshToken', 'refresh-a'],
    ...(saved ? [['vista.verifiedProfile.v1', JSON.stringify({ binding, user })]] : []),
  ]);
  const connection = stateModule.createConnectivityState(false);
  const qc = new rq.QueryClient();
  let meCalls = 0;
  const h = createHarness({
    'expo-secure-store': {
      getItemAsync: async key => storage.get(key) || null,
      setItemAsync: async (key, value) => { storage.set(key, value); },
      deleteItemAsync: async key => { storage.delete(key); },
    },
    '../services/authService': { authService: {
      me: () => { meCalls++; return me(); },
      login: async () => ({ user: student, tokens: { access: 'access-b', refresh: 'refresh-b' } }),
      logout: async () => {},
    } },
    '../services/nativeNotifications': { unregisterPush: async () => {}, resumePushSession() {} },
    '../components/common/VistaProcessing': { __esModule: true, default: 'Processing' },
    '../lib/queryClient': { queryClient: qc },
    '../lib/connectivityState.cjs': { ...stateModule, connectivity: connection },
  });
  const store = h.load('src/lib/tokenStore.js').tokenStore;
  h.mocks['../lib/tokenStore'] = { tokenStore: store };
  const view = h.instance(h.load('src/context/AuthContext.jsx').AuthProvider, { children: 'App' });
  const read = () => view.render().props.value;
  return { h, store, storage, connection, qc, view, read, meCalls: () => meCalls };
}

test('offline startup opens the verified role before a hanging server request completes', async () => {
  let finish;
  const f = sessionFixture({ me: () => new Promise(resolve => { finish = resolve; }) });
  await flush();
  assert.equal(f.meCalls(), 1);
  assert.equal(f.read().isRestoring, false);
  assert.equal(f.read().user.user_id, staff.user_id);
  assert.equal(f.read().role, 'staff');
  finish({ ...staff, first_name: 'Fresh server name' }); await flush();
  assert.equal(f.read().user.first_name, 'Fresh server name');
  assert.equal(JSON.parse(f.storage.get('vista.verifiedProfile.v1')).user.first_name, 'Fresh server name');
  f.view.unmount(); f.qc.clear();
});

test('offline startup retains the verified account on transport failure but never trusts a foreign profile', async () => {
  for (const binding of ['refresh-a', 'another-session']) {
    const f = sessionFixture({ binding }); await flush();
    const auth = f.read();
    assert.equal(auth.isRestoring, false);
    assert.equal(auth.user?.user_id ?? null, binding === 'refresh-a' ? staff.user_id : null);
    assert.equal(auth.restoreError?.code ?? null, binding === 'refresh-a' ? null : 'OFFLINE');
    f.view.unmount(); f.qc.clear();
  }
});

test('a first offline start without a verified profile never grants a role', async () => {
  const f = sessionFixture({ saved: false }); await flush();
  assert.equal(f.read().user, null); assert.equal(f.read().role, null);
  assert.equal(f.read().isRestoring, false);
  assert.equal(f.read().restoreError.code, 'OFFLINE');
  f.view.unmount(); f.qc.clear();
});

test('reconnect freshly validates the profile and a server denial removes cached access', async () => {
  for (const status of [401, 403]) {
    let online = false;
    const f = sessionFixture({ me: async () => {
      if (!online) throw stateModule.offlineError();
      throw Object.assign(new Error('Account denied'), { status });
    } });
    await flush(); assert.equal(f.read().role, 'staff');
    f.qc.setQueryData(['submissions', 'staff-a'], { private: 'cached' });
    online = true; f.connection.setOnline(true); await flush();
    assert.equal(f.meCalls(), 2);
    assert.equal(f.read().user, null); assert.equal(f.read().isRestoring, false);
    assert.equal(f.storage.has('vista.verifiedProfile.v1'), false);
    assert.equal(f.qc.getQueryCache().getAll().length, 0);
    f.view.unmount(); f.qc.clear();
  }
});

test('a late restore cannot replace a newly signed-in account or its saved profile', async () => {
  let finish;
  const f = sessionFixture({ me: () => new Promise(resolve => { finish = resolve; }) });
  await flush();
  await f.read().login({ email: 'student@example.test', password: 'isolated-test' });
  finish(staff); await flush();
  assert.equal(f.read().user.user_id, student.user_id);
  assert.equal(f.store.getCachedUser().user_id, student.user_id);
  assert.equal(JSON.parse(f.storage.get('vista.verifiedProfile.v1')).user.user_id, student.user_id);
  f.view.unmount(); f.qc.clear();
});

test('refresh rotation retains the bound profile; logout and another login remove it', async () => {
  const f = sessionFixture(); await flush();
  await f.store.setTokens({ access: 'fresh-a', refresh: 'rotated-a' }, { expectedRefreshToken: 'refresh-a' });
  await f.store.loadTokens();
  assert.equal(f.store.getCachedUser().user_id, staff.user_id);
  await f.read().logout();
  await f.store.loadTokens();
  assert.equal(f.store.getCachedUser(), null);
  assert.equal(f.storage.has('vista.verifiedProfile.v1'), false);
  await f.store.setTokens({ access: 'access-b', refresh: 'refresh-b' });
  await f.store.loadTokens(); assert.equal(f.store.getCachedUser(), null);
  f.view.unmount(); f.qc.clear();
});

test('successive profile updates preserve both fields in memory and fresh secure storage reads', async () => {
  const f = sessionFixture(); await flush();
  const auth = f.read();
  auth.updateUser({ first_name: 'Updated' });
  auth.updateUser({ last_name: 'Together' });
  await flush();
  assert.equal(f.read().user.first_name, 'Updated');
  assert.equal(f.read().user.last_name, 'Together');
  await f.store.loadTokens();
  assert.equal(f.store.getCachedUser().first_name, 'Updated');
  assert.equal(f.store.getCachedUser().last_name, 'Together');
  f.view.unmount(); f.qc.clear();
});

function apiFixture() {
  const connection = stateModule.createConnectivityState();
  const h = createHarness({
    axios,
    '../config/api': { API_CONFIG: { BASE_URL: 'https://offline.example.test/api', DEFAULT_TIMEOUT_MS: 100 }, API_ENDPOINTS: { AUTH: { REFRESH: '/refresh/' } } },
    './tokenStore': { tokenStore: { getAccessToken: () => 'test-access', getRefreshToken: () => null } },
    './connectivityState.cjs': { ...stateModule, connectivity: connection },
  });
  const module = h.load('src/lib/apiClient.js');
  return { connection, ...module, h };
}

test('known-offline reads and writes reject immediately without dispatch or retry on reconnect', async () => {
  const f = apiFixture(); let calls = 0;
  f.apiClient.defaults.adapter = async config => { calls++; return { data: {}, status: 200, headers: {}, config }; };
  f.connection.setOnline(false);
  for (const method of ['get', 'post', 'patch', 'delete']) {
    await assert.rejects(f.apiClient[method]('/submission/'), error => f.unwrapApiError(error).code === 'OFFLINE');
  }
  f.connection.setOnline(true); await flush(); assert.equal(calls, 0, 'No automatic replay of user writes');
  await f.apiClient.get('/submission/'); assert.equal(calls, 1);
});

test('authorization and server errors keep their status and are never mislabeled offline', async () => {
  for (const status of [401, 403, 500]) {
    const f = apiFixture();
    f.apiClient.defaults.adapter = async config => { throw new axios.AxiosError('Denied', 'ERR_BAD_RESPONSE', config, {}, { status, data: { detail: 'Server response' }, config }); };
    await assert.rejects(f.apiClient.get('/submission/'), error => f.unwrapApiError(error).status === status);
    assert.equal(f.connection.isOnline(), true);
  }
});

test('real React Query preserves cached reads, shows uncached offline errors, refetches on reconnect and never queues mutations', async () => {
  const f = apiFixture();
  f.h.mocks['@tanstack/react-query'] = rq;
  const qc = f.h.load('src/lib/queryClient.js').queryClient;
  f.connection.setOnline(false); rq.onlineManager.setOnline(false);
  const unsubscribeConnection = f.connection.subscribe(value => rq.onlineManager.setOnline(value));
  let reads = 0, writes = 0;
  f.apiClient.defaults.adapter = async config => {
    if (config.method === 'get') reads++; else writes++;
    return { data: { title: 'Fresh server data' }, status: 200, headers: {}, config };
  };
  const key = ['submissions', 'list', 'staff-a'];
  qc.setQueryData(key, { title: 'Cached data' });
  qc.mount();
  const observer = new rq.QueryObserver(qc, { queryKey: key, staleTime: 0, queryFn: async () => (await f.apiClient.get('/submissions/')).data });
  const stop = observer.subscribe(() => {}); await flush();
  assert.equal(observer.getCurrentResult().data.title, 'Cached data');
  assert.equal(observer.getCurrentResult().isError, true);
  await assert.rejects(qc.fetchQuery({ queryKey: ['uncached'], queryFn: () => f.apiClient.get('/uncached/') }), /offline/);
  assert.equal(qc.getQueryState(['uncached']).fetchStatus, 'idle');
  const mutation = qc.getMutationCache().build(qc, { mutationFn: () => f.apiClient.post('/submissions/', {}) });
  await assert.rejects(mutation.execute(), /offline/);
  assert.equal(mutation.state.isPaused, false);
  f.connection.setOnline(true);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(observer.getCurrentResult().data.title, 'Fresh server data');
  assert.equal(reads, 1); assert.equal(writes, 0);
  stop(); unsubscribeConnection(); qc.unmount(); qc.clear(); rq.onlineManager.setOnline(true);
});

test('native events override a late initial network read and runtime subscriptions clean up', async () => {
  let emit, resolveInitial, removed = 0;
  const connection = stateModule.createConnectivityState();
  const h = createHarness({
    axios: { get: async () => ({ status: 200 }) },
    'expo-modules-core': { requireOptionalNativeModule: () => ({}) },
    'expo-network': {
      addNetworkStateListener: cb => { emit = cb; return { remove() { removed++; } }; },
      getNetworkStateAsync: () => new Promise(resolve => { resolveInitial = resolve; }),
    },
    '@tanstack/react-query': { onlineManager: { setOnline() {} } },
    './connectivityState.cjs': { connectivity: connection },
  });
  h.native.AppState = { currentState: 'active', addEventListener: () => ({ remove() { removed++; } }) };
  const runtime = h.load('src/lib/networkRuntime.js');
  const stop = runtime.startNetworkRuntime();
  emit({ isConnected: false });
  resolveInitial({ isConnected: true, isInternetReachable: true }); await flush();
  assert.equal(connection.isOnline(), false);
  stop(); assert.equal(removed, 2);
  emit({ isConnected: true }); assert.equal(connection.isOnline(), false);
});

test('offline banner offers recovery and the staff Submission History header keeps profile/bell without Settings', async () => {
  let online = false, checks = 0;
  const h = createHarness({
    '../../hooks/useConnectivity': { __esModule: true, default: () => online },
    '../../lib/networkRuntime': { checkConnection: async () => { checks++; } },
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../../context/AuthContext': { useAuth: () => ({ user: staff }) },
  });
  const banner = h.instance(h.load('src/components/common/OfflineBanner.jsx').default);
  assert.match(textOf(banner.output), /Connection unavailable/);
  const button = nodes(banner.output).find(n => n.props?.label === 'Retry');
  await button.props.onPress(); assert.equal(checks, 1);
  online = true; assert.equal(banner.render(), null);
  const page = h.instance(h.load('src/screens/staff/StaffReviewPanel.jsx').default, { navigation: {}, route: {} });
  const headerNode = nodes(page.output).find(n => n.type?.name === 'StaffReviewHeader');
  const sharedHeader = h.instance(headerNode.type, headerNode.props).output;
  const header = h.instance(sharedHeader.type, sharedHeader.props);
  assert.ok(nodes(header.output).some(n => n.props?.accessibilityLabel === 'Open profile'));
  assert.ok(nodes(header.output).some(n => n.type?.name === 'StudentNotificationBell'));
  assert.ok(!nodes(header.output).some(n => n.props?.accessibilityLabel === 'Open settings'));
});

test('offline dashboards retain cached counts and show unavailable instead of inventing zero', () => {
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../context/AuthContext': { useAuth: () => ({ user: student }) },
    '@tanstack/react-query': {
      QueryClient: rq.QueryClient,
      useQueries: () => [{ data: { count: 24 } }, { data: { count: 0 } }, { isError: true, error: stateModule.offlineError() }, { isError: true, error: stateModule.offlineError() }],
      useQuery: () => ({ isError: true, error: stateModule.offlineError() }),
      useQueryClient: () => ({ invalidateQueries() {} }),
    },
    '../../../context/AuthContext': { useAuth: () => ({ user: staff }) },
    '../../context/AuthContext': { useAuth: () => ({ user: student }) },
  });
  const staffPage = h.instance(h.load('src/screens/staff/home/StaffHomeContent.jsx').default);
  const summary = nodes(staffPage.output).find(n => n.type?.name === 'SubmissionSummary');
  const staffCards = h.instance(summary.type, summary.props).output;
  const studentPage = h.instance(h.load('src/screens/student/StudentHomeScreen.jsx').default, { navigation: {} });
  const studentCards = nodes(studentPage.output).find(n => n.type?.name === 'SubmissionDashboardCards');
  for (const cards of [staffCards, studentCards]) {
    assert.equal(cards.props.total, 24);
    assert.equal(cards.props.pending, 0, 'A real cached zero is preserved');
    assert.equal(cards.props.approved, '—', 'Missing data is not a saved zero');
    assert.equal(cards.props.rejected, '—', 'Missing rejected data is not a saved zero');
  }
});

test('the older-client fallback recovers without native module or auth and deduplicates connectivity checks', async t => {
  const connection = stateModule.createConnectivityState();
  let reachable = false, calls = 0;
  const h = createHarness({
    axios: { get: async (_url, options) => {
      calls++; assert.equal(options.timeout, 5000);
      assert.equal(options.headers['Cache-Control'], 'no-cache');
      assert.equal(options.headers.Authorization, undefined);
      if (!reachable) throw new Error('Transport unavailable');
      return { status: 503 };
    } },
    '@tanstack/react-query': { onlineManager: { setOnline() {} } },
    './connectivityState.cjs': { connectivity: connection },
  });
  h.native.AppState = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
  const runtime = h.load('src/lib/networkRuntime.js');
  const stop = runtime.startNetworkRuntime(); t.after(stop);
  await flush(); assert.equal(connection.isOnline(), false); assert.equal(calls, 1);
  reachable = true;
  await Promise.all([runtime.checkConnection(), runtime.checkConnection()]);
  assert.equal(calls, 2);
  assert.equal(connection.isOnline(), true, 'An HTTP server error is distinct from no connection');
});

test('offline attachment staging never starts an upload and preserves an already-created submission message', async () => {
  const connection = stateModule.createConnectivityState(false);
  const h = createHarness({ '../lib/connectivityState.cjs': { ...stateModule, connectivity: connection } });
  const service = h.load('src/services/submissionsService.js').submissionsService;
  await assert.rejects(service.prepareStatusAttachment({}), error => error.code === 'OFFLINE');
  await assert.rejects(service.uploadSubmissionDocument('already-created', {}), error => error.code === 'OFFLINE' && error.message.startsWith('Submission created, but'));
});
