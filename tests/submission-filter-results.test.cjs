const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

test('filter changes show a skeleton immediately and never expose the previous filter while preparing', () => {
  let renderedFilter = null;
  const h = createHarness({ '../../hooks/useNavigationContentReady': {
    __esModule: true, default: key => key === renderedFilter,
  } });
  const Results = h.load('src/components/submissions/SubmissionFilterResults.jsx').default;
  const cached = { type: 'CachedRows', props: { onPress() {} } };
  const view = h.instance(Results, { filterKey: 'All Status', children: cached });
  const skeleton = () => nodes(view.output).find(n => n.type?.name === 'SubmissionListSkeleton');
  assert.equal(skeleton().props.count, 5);
  assert.ok(!nodes(view.output).some(n => n === cached));

  renderedFilter = 'All Status'; view.render();
  assert.equal(view.output.props.children, cached, 'Settled cached results retain their original elements/actions');
  const newest = { type: 'RejectedRows', props: {} };
  for (const filterKey of ['Approved', 'Pending', 'Rejected']) {
    view.render({ filterKey, children: newest });
    assert.ok(skeleton());
    assert.ok(!nodes(view.output).some(n => n === newest || n === cached));
  }
  renderedFilter = 'Pending'; view.render();
  assert.ok(skeleton(), 'An intermediate deferred filter cannot reveal stale results');
  renderedFilter = 'Rejected'; view.render();
  assert.equal(view.output.props.children, newest);
  view.render({ filterKey: 'Rejected', loading: true, children: newest });
  assert.ok(skeleton(), 'A cache miss remains a skeleton until the query finishes');
  view.render({ filterKey: 'Rejected', loading: false, children: newest });
  assert.equal(view.output.props.children, newest);
  view.unmount();
});

test('result fades use the native driver, cancel on a new selection, and respect live reduced motion', () => {
  let reduced = false, stops = 0;
  const animations = [];
  const h = createHarness({ '../../hooks/useReducedMotion': { __esModule: true, default: () => reduced } });
  const BaseValue = h.native.Animated.Value;
  h.native.Animated.Value = class extends BaseValue { stopAnimation() { stops++; } };
  h.native.Animated.timing = (value, config) => ({ start() { animations.push(config); value.setValue(config.toValue); } });
  const Results = h.load('src/components/submissions/SubmissionFilterResults.jsx').default;
  const view = h.instance(Results, { filterKey: 'All Status', loading: true, children: 'rows' });
  const opacity = view.output.props.style.opacity;
  assert.equal(animations.length, 0);
  view.render({ filterKey: 'All Status', children: 'rows' });
  assert.equal(animations.length, 1);
  assert.equal(animations[0].useNativeDriver, true);
  assert.equal(animations[0].duration, h.load('src/theme/tokens.js').motion.fast);
  const before = stops;
  view.render({ filterKey: 'Approved', loading: true, children: 'rows' });
  assert.ok(stops > before); assert.equal(opacity.value, 1);
  assert.equal(view.output.props.style.opacity, opacity, 'A new filter does not replace the animation graph');
  reduced = true;
  view.render({ filterKey: 'Approved', children: 'rows' });
  assert.equal(animations.length, 1); assert.equal(opacity.value, 1);
  const beforeUnmount = stops;
  view.unmount(); assert.ok(stops > beforeUnmount);
});

for (const role of ['staff', 'student']) test(`${role} filter selection starts its own query immediately and defers only result rendering`, () => {
  const requests = [];
  const h = createHarness({
    '../../hooks/useSubmissions': { useSubmissions: params => {
      requests.push({ ...params }); return { data: { results: [], total_pages: 1 } };
    } },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  });
  const Screen = h.load(role === 'staff' ? 'src/screens/staff/StaffReviewPanel.jsx' : 'src/screens/student/StudentTrackerScreen.jsx').default;
  const view = h.instance(Screen, { navigation: { setParams() {} }, route: {} });
  const find = name => nodes(view.output).find(n => n.type?.name === name);
  for (const [filter, status] of [['Approved', 'approved'], ['Rejected', 'rejected'], ['Pending', 'pending'], ['All Status', undefined]]) {
    find('SubmissionSummaryTabs').props.onChange(filter); view.render();
    assert.equal(find('SubmissionSummaryTabs').props.value, filter);
    assert.equal(requests.at(-1).status, status);
    assert.equal(requests.at(-1).page, 1);
    const body = find('SubmissionFilterResults');
    assert.equal(body.props.filterKey, filter);
    assert.ok(!nodes(body).some(n => /BottomNav|Header|SubmissionSummaryTabs/.test(n.type?.name || '')),
      'Loading/fading must never include navigation, headers or filter controls');
  }
  view.unmount();
});

test('Student Tracker renders its full fetched page once instead of adding rows in frame-by-frame updates', () => {
  const frames = [], opened = [];
  const submissions = Array.from({ length: 20 }, (_, i) => ({ submission_id: `isolated-${i}` }));
  const h = createHarness({
    '../../hooks/useSubmissions': { useSubmissions: () => ({ data: { results: submissions, total_pages: 2 } }) },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  }, { requestAnimationFrame: callback => frames.push(callback), cancelAnimationFrame() {} });
  const Screen = h.load('src/screens/student/StudentTrackerScreen.jsx').default;
  const view = h.instance(Screen, { navigation: { navigate: (...args) => opened.push(args), setParams() {} }, route: {} });
  const cards = nodes(view.output).filter(n => n.type?.name === 'SubmissionListCard');
  assert.equal(cards.length, 20);
  assert.equal(frames.length, 0, 'No repeated append commits compete with filter and navigation taps');
  cards.at(-1).props.onPress();
  assert.equal(opened[0][0], 'StudentSubmissionDetails');
  assert.equal(opened[0][1].submission, submissions.at(-1));
  assert.ok(nodes(view.output).some(n => n.type?.name === 'SubmissionPagination'));
  view.unmount();
});
