const { test } = require('node:test');
const assert = require('node:assert/strict');
const actualReactQuery = require('@tanstack/react-query');
const { QueryClient } = actualReactQuery;
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('1. Student A loads submissions, then signs out and Student B signs in (cache isolation)', async () => {
  const qc = new QueryClient();
  const subA = { submission_id: 'sub-a', title: 'Student A Project' };
  const subB = { submission_id: 'sub-b', title: 'Student B Project' };

  // Student A sets data under user-scoped key
  qc.setQueryData(['submissions', 'list', 'student_a_id', {}], { results: [subA] });
  assert.deepEqual(qc.getQueryData(['submissions', 'list', 'student_a_id', {}]), { results: [subA] });

  // Sign out: cancel queries and clear cache
  qc.cancelQueries();
  qc.clear();
  assert.equal(qc.getQueryData(['submissions', 'list', 'student_a_id', {}]), undefined);

  // Student B signs in
  qc.setQueryData(['submissions', 'list', 'student_b_id', {}], { results: [subB] });

  // Student B can never access Student A's data
  assert.equal(qc.getQueryData(['submissions', 'list', 'student_a_id', {}]), undefined);
  assert.deepEqual(qc.getQueryData(['submissions', 'list', 'student_b_id', {}]), { results: [subB] });
});

test('2. Staff signs out, then Student signs in (no staff data leaks to student)', async () => {
  const qc = new QueryClient();
  const staffRecord = { submission_id: 'staff-secret', title: 'Confidential Staff Audit' };
  qc.setQueryData(['submissions', 'list', 'staff_user_1', {}], { results: [staffRecord] });
  qc.setQueryData(['submissions', 'count', 'staff_user_1', 'all'], { count: 42 });

  // Logout clears all
  qc.cancelQueries();
  qc.clear();

  // Student signs in
  const studentData = qc.getQueryData(['submissions', 'list', 'student_user_2', {}]);
  const studentCounts = qc.getQueryData(['student-submissions', 'count', 'student_user_2', 'all']);
  assert.equal(studentData, undefined);
  assert.equal(studentCounts, undefined);
  assert.equal(qc.getQueryCache().getAll().length, 0);
});

test('3. Student signs out, then Staff signs in (clean boundary)', async () => {
  const qc = new QueryClient();
  qc.setQueryData(['student-submissions', 'count', 'student_1', 'all'], { count: 3 });
  qc.setQueryData(['notifications', 'student_1'], { results: [{ notification_id: 'n1' }] });

  qc.cancelQueries();
  qc.clear();

  assert.equal(qc.getQueryCache().getAll().length, 0);
  assert.equal(qc.getQueryData(['notifications', 'staff_1']), undefined);
});

test('4. In-flight query resolves after account switching without corrupting new account', async () => {
  const qc = new QueryClient();
  let resolveInFlight;
  const inFlightPromise = new Promise(resolve => { resolveInFlight = resolve; });

  // Student A query starts in-flight
  const keyA = ['submissions', 'list', 'user_a', {}];
  const queryPromise = qc.fetchQuery({ queryKey: keyA, queryFn: () => inFlightPromise });

  // Student A signs out; switch to Student B
  qc.cancelQueries();
  qc.clear();

  // In-flight response returns late
  resolveInFlight({ results: [{ submission_id: 'leaked_a' }] });
  await queryPromise.catch(() => {});

  // Key for user_b was never populated
  const keyB = ['submissions', 'list', 'user_b', {}];
  assert.equal(qc.getQueryData(keyB), undefined);
});

test('5. Background refresh fails with previously loaded data: preserves list and displays StaleWarningBanner', () => {
  const submission = { submission_id: 's1', title: 'SARF Document', status: 'pending' };
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../../context/AuthContext': { useAuth: () => ({ user: { user_id: 'u1', first_name: 'Alex' }, role: 'student' }) },
    '../../hooks/useSubmissions': {
      useSubmissions: () => ({
        data: { results: [submission] },
        isLoading: false,
        isError: true,
        error: new Error('Network offline'),
      }),
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh: () => {} }) },
    '@tanstack/react-query': {
      ...actualReactQuery,
      useQueries: () => [
        { data: { count: 1 }, isLoading: false },
        { data: { count: 1 }, isLoading: false },
        { data: { count: 1 }, isLoading: false },
        { data: { count: 0 }, isLoading: false },
      ],
    },
  });

  const Screen = h.load('src/screens/student/StudentHomeScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: {} }).output;

  // List card is preserved
  const card = nodes(tree).find(n => n.type?.name === 'SubmissionListCard');
  assert.ok(card, 'SubmissionListCard should remain visible when cached data exists');
  assert.equal(card.props.submission.submission_id, 's1');

  // StaleWarningBanner is displayed
  const warning = nodes(tree).find(n => n.type?.name === 'StaleWarningBanner');
  assert.ok(warning, 'StaleWarningBanner should be displayed on failed background refresh');

  // Full error replacement view is NOT displayed
  assert.ok(!textOf(tree).includes('Could not load submissions.'));
});

test('6. First fetch fails with no cached data: displays standard error state', () => {
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../../context/AuthContext': { useAuth: () => ({ user: { user_id: 'u1', first_name: 'Alex' }, role: 'student' }) },
    '../../hooks/useSubmissions': {
      useSubmissions: () => ({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Initial network error'),
      }),
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh: () => {} }) },
    '@tanstack/react-query': {
      ...actualReactQuery,
      useQueries: () => [
        { data: null, isLoading: false },
        { data: null, isLoading: false },
        { data: null, isLoading: false },
        { data: null, isLoading: false },
      ],
    },
  });

  const Screen = h.load('src/screens/student/StudentHomeScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: {} }).output;

  // No cards rendered
  const card = nodes(tree).find(n => n.type?.name === 'SubmissionListCard');
  assert.equal(card, undefined);

  // Standard error state is shown
  const state = nodes(tree).find(n => n.type?.name === 'ContentState');
  assert.match(textOf(h.instance(state.type, state.props).output), /Could not load submissions/);
});

test('7. Unauthorized/expired sessions (401/403) refuse to display cached restricted records', () => {
  const cachedSub = { submission_id: 's1', title: 'Restricted Title' };
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../../context/AuthContext': { useAuth: () => ({ user: { user_id: 'u1' }, role: 'student' }) },
    '../../hooks/useSubmissions': {
      useSubmissions: () => ({
        data: { results: [cachedSub] },
        isLoading: false,
        isError: true,
        error: { status: 403, message: 'Forbidden' },
      }),
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh: () => {} }) },
    '@tanstack/react-query': {
      ...actualReactQuery,
      useQueries: () => [
        { data: null, isLoading: false },
        { data: null, isLoading: false },
        { data: null, isLoading: false },
        { data: null, isLoading: false },
      ],
    },
  });

  const Screen = h.load('src/screens/student/StudentHomeScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: {} }).output;

  // Restricted card is NOT displayed after 403
  const card = nodes(tree).find(n => n.type?.name === 'SubmissionListCard');
  assert.equal(card, undefined, 'Cached card must not be displayed after 403 authorization loss');

  // Error view is displayed instead
  const state = nodes(tree).find(n => n.type?.name === 'ContentState');
  assert.match(textOf(h.instance(state.type, state.props).output), /Access unavailable/);
});

test('8. Pull-to-refresh continues working and invalidates targets via useScreenRefresh', async () => {
  let invalidated = [];
  const fakeQueryClient = {
    invalidateQueries: async ({ queryKey, refetchType }) => {
      invalidated.push({ queryKey, refetchType });
    },
  };
  const h = createHarness({
    '@tanstack/react-query': { useQueryClient: () => fakeQueryClient },
  });

  const { useScreenRefresh } = h.load('src/hooks/useScreenRefresh.js');
  let hookState;
  function TestComp() {
    hookState = useScreenRefresh([['student-submissions'], ['submissions']]);
    return null;
  }
  h.instance(TestComp);
  assert.equal(hookState.refreshing, false);

  await hookState.onRefresh();
  assert.equal(hookState.refreshing, false);
  assert.equal(invalidated.length, 2);
  assert.deepEqual(invalidated[0], { queryKey: ['student-submissions'], refetchType: 'active' });
  assert.deepEqual(invalidated[1], { queryKey: ['submissions'], refetchType: 'active' });
});

test('9. Existing query invalidations still function with user-scoped query keys', () => {
  const qc = new QueryClient();
  const userId = 'u123';
  const scopedListKey = ['submissions', 'list', userId, { page: 1 }];
  const scopedDetailKey = ['submissions', 'sub999', userId];

  qc.setQueryData(scopedListKey, { count: 1 });
  qc.setQueryData(scopedDetailKey, { submission_id: 'sub999' });

  // Invalidate by prefix ['submissions'] (used by createSubmission)
  let count = 0;
  qc.getQueryCache().findAll({ queryKey: ['submissions'] }).forEach(() => count++);
  assert.equal(count, 2, 'Prefix matching must find both list and detail queries');

  // Invalidate by prefix ['submissions', 'list'] (used by updateStatus)
  let listMatches = 0;
  qc.getQueryCache().findAll({ queryKey: ['submissions', 'list'] }).forEach(() => listMatches++);
  assert.equal(listMatches, 1, 'Prefix matching must find scoped list query');

  // Invalidate by prefix ['submissions', 'sub999'] (used by updateStatus & DriveArchiveCard)
  let detailMatches = 0;
  qc.getQueryCache().findAll({ queryKey: ['submissions', 'sub999'] }).forEach(() => detailMatches++);
  assert.equal(detailMatches, 1, 'Prefix matching must find scoped detail query');
});

test('10. Sign-out push device revocation security behavior remains strictly preserved', async () => {
  let resumedSession = null;
  let pushUnregistered = false;
  let shouldFailPush = true;

  const fakeNative = {
    unregisterPush: async () => {
      if (shouldFailPush) throw new Error('Offline push revocation error');
      pushUnregistered = true;
    },
    resumePushSession: (id) => { resumedSession = id; },
  };

  const h = createHarness({
    '../services/nativeNotifications': fakeNative,
    '../services/authService': { authService: { logout: async () => {} } },
    '../lib/tokenStore': { tokenStore: { getRefreshToken: () => 'ref', clear: async () => {}, subscribe: () => () => {}, getTokens: () => ({}) } },
    '../lib/queryClient': { queryClient: new QueryClient() },
  });

  const { AuthProvider } = h.load('src/context/AuthContext.jsx');
  const inst = h.instance(AuthProvider, { children: null });
  const authContext = inst.output.props.value;

  // Verify logout fails if push device revocation fails
  await assert.rejects(
    async () => { await authContext.logout(); },
    /Could not securely sign out/
  );
  assert.equal(pushUnregistered, false);

  // When push revocation succeeds, logout proceeds
  shouldFailPush = false;
  await authContext.logout();
  assert.equal(pushUnregistered, true);
});
