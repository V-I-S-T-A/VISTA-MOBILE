const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

for (const role of ['staff', 'student']) {
  test(`${role} cached summary navigation queries the selected status on its first render`, () => {
    const calls = [], effects = [];
    const h = createHarness({
      '../../hooks/useSubmissions': { useSubmissions: params => {
        calls.push({ ...params });
        return { data: { results: [{ submission_id: 'isolated-test' }], total_pages: 4 } };
      } },
      '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    });
    // Passive effects happen after render in React. Defer them here so this
    // assertion catches the old-filter request, rather than only its correction.
    const registerEffect = h.mocks.react.useEffect;
    h.mocks.react.useEffect = (callback, deps) => registerEffect(() => {
      const entry = { callback, cancelled: false };
      effects.push(entry);
      return () => { entry.cancelled = true; };
    }, deps);
    const flush = () => {
      for (const entry of effects.splice(0)) if (!entry.cancelled) entry.callback();
    };
    const Screen = h.load(role === 'staff'
      ? 'src/screens/staff/StaffReviewPanel.jsx'
      : 'src/screens/student/StudentTrackerScreen.jsx').default;
    let route = { params: { academicYearId: 'year-test' } };
    const navigation = { setParams: params => { route = { params: { ...route.params, ...params } }; } };
    const screen = h.instance(Screen, { navigation, route });
    const node = name => nodes(screen.output).find(n => n.type?.name === name);
    flush();
    for (const [label, status] of [['Approved', 'approved'], ['Rejected', 'rejected'], ['Pending', 'pending'], ['All Status', undefined]]) {
      node('StaffReviewSearch').props.setSearchQuery('previous search');
      screen.render({ navigation, route }); flush();
      node('SubmissionPagination').props.onPageChange(3);
      screen.render({ navigation, route }); flush();
      assert.equal(calls.at(-1).page, 3);
      assert.equal(calls.at(-1).search, 'previous search');

      route = { params: { ...route.params, statusFilter: label } };
      const before = calls.length;
      screen.render({ navigation, route });
      assert.equal(calls.length, before + 1);
      assert.equal(calls.at(-1).status, status);
      assert.equal(calls.at(-1).page, 1);
      assert.equal(calls.at(-1).search, undefined);
      assert.equal(calls.at(-1).academic_year_id, 'year-test');
      assert.equal(node('SubmissionSummaryTabs').props.value, label);
      assert.equal(node('StaffReviewSearch').props.searchQuery, '');
      assert.equal(node('SubmissionPagination').props.currentPage, 1);
      const firstParams = calls.at(-1);
      flush(); screen.render({ navigation, route }); flush();
      assert.deepEqual(calls.at(-1), firstParams, 'Consuming the route must not start another query key');
      assert.equal(route.params.statusFilter, undefined);
    }
    // A normal navbar visit retains the local search and page; invalid route
    // values cannot introduce a new backend status or discard those controls.
    node('StaffReviewSearch').props.setSearchQuery('retained');
    screen.render({ navigation, route }); flush();
    node('SubmissionPagination').props.onPageChange(2);
    screen.render({ navigation, route }); flush();
    route = { params: { ...route.params, statusFilter: 'unsupported' } };
    screen.render({ navigation, route });
    assert.equal(calls.at(-1).status, undefined);
    assert.equal(calls.at(-1).page, 2);
    assert.equal(calls.at(-1).search, 'retained');
    screen.unmount();
  });
}

test('shared submission date formatting preserves dates, fallbacks and card actions on rerender', () => {
  const h = createHarness();
  const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
  const original = { month: 'short', day: 'numeric', year: 'numeric' };
  let opened = 0;
  const card = h.instance(Card, { submission: { submission_id: 'isolated-date' } });
  assert.ok(textOf(card.output).includes('—'));
  for (const submitted_at of ['2026-11-17T12:00:00.000Z', '2025-01-01T00:00:00.000Z', 'invalid-date']) {
    const submission = { submission_id: 'isolated-date', title: 'Test submission', status: 'approved', submitted_at };
    card.render({ submission, onPress: () => { opened++; } });
    const expected = new Date(submitted_at).toLocaleDateString(undefined, original);
    assert.ok(textOf(card.output).includes(expected), `Date display must remain ${expected}`);
    assert.match(card.output.props.accessibilityLabel, /Test submission.*Approved/);
    card.output.props.onPress();
  }
  assert.equal(opened, 3);
});
