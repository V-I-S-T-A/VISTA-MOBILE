const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

function fixture(count = 32) {
  const items = Array.from({ length: count }, (_, index) => ({ submission_id: `submission-${index + 1}` }));
  const frames = new Map(), requests = [], navigations = [];
  let frameId = 0, responseOverride;
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate: (...args) => navigations.push(args) }) },
    '../../../../theme/layout': { panelStyles: {} },
    '../../../../components/submissions/SubmissionListCard': { __esModule: true, default: 'SubmissionCard' },
    '../../../../components/submissions/SubmissionPagination': { __esModule: true, default: 'Pagination' },
    '../../../../components/common/Skeleton': { SubmissionListSkeleton: 'Skeleton' },
    '../../../../components/common/StaleWarningBanner': { __esModule: true, default: 'StaleWarning' },
    '../../../../hooks/useSubmissions': { useSubmissions: params => {
      requests.push(params);
      if (responseOverride) return responseOverride;
      const size = params.page_size || 20;
      return { data: { results: items.slice((params.page - 1) * size, params.page * size), total_pages: Math.max(1, Math.ceil(count / size)) } };
    } },
  }, {
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const view = h.instance(h.load('src/screens/staff/home/submissionHistory/SubmissionHistoryList.jsx').default);
  return {
    view, requests, navigations,
    get pendingFrames() { return frames.size; },
    cards: () => nodes(view.output).filter(node => node.type === 'SubmissionCard'),
    pagination: () => nodes(view.output).find(node => node.type === 'Pagination'),
    frame() {
      const callback = frames.values().next().value;
      assert.ok(callback, 'Expected a pending card-render frame');
      frames.clear(); callback(); view.render();
    },
    finish() { while (frames.size) this.frame(); },
    respond(value) { responseOverride = value; view.render(); },
  };
}

test('history lays out all 30 cards before pagination without waiting for scroll or animation frames', () => {
  const f = fixture();
  assert.equal(f.requests.at(-1).page_size, 30);
  assert.equal(f.cards().length, 30);
  assert.equal(f.pendingFrames, 0, 'History must not append cards in scheduled slices');
  assert.equal(f.pagination().props.currentPage, 1);
  assert.equal(f.pagination().props.variant, 'history');
  assert.equal(f.view.output.props.children.filter(Boolean).at(-1).type, 'Pagination');
  f.view.render();
  assert.equal(f.cards().length, 30);
  assert.equal(f.pendingFrames, 0);
  f.cards()[0].props.onPress();
  assert.equal(f.navigations[0][0], 'ReviewPanelDetails');
  assert.equal(f.navigations[0][1].submission, f.cards()[0].props.submission);
  f.view.unmount();
});

test('next page contains the remaining records once and retains a way back from a short last page', () => {
  const f = fixture(); f.finish();
  const firstPageIds = f.cards().map(card => card.props.submission.submission_id);
  f.pagination().props.onPageChange(2); f.view.render(); f.finish();
  assert.equal(f.requests.at(-1).page, 2);
  assert.equal(f.requests.at(-1).page_size, 30);
  assert.deepEqual(f.cards().map(card => card.props.submission.submission_id), ['submission-31', 'submission-32']);
  assert.equal(new Set([...firstPageIds, ...f.cards().map(card => card.props.submission.submission_id)]).size, 32);
  assert.equal(f.pagination().props.currentPage, 2);
  f.pagination().props.onPageChange(1); f.view.render(); f.finish();
  assert.deepEqual(f.cards().map(card => card.props.submission.submission_id), firstPageIds);
  f.view.unmount();
});

for (const count of [0, 1, 29, 30]) test(`history with ${count} results does not show unnecessary pagination`, () => {
  const f = fixture(count); f.finish();
  assert.equal(f.cards().length, count);
  assert.equal(f.pagination(), undefined);
  if (count === 0) assert.equal(f.view.output.props.title, 'No submissions yet');
  f.view.unmount();
});

test('search, status and academic year preserve the 30-item request and reset the current page', () => {
  const f = fixture(); f.finish();
  for (const props of [{ searchQuery: '  Budget  ' }, { statusFilter: 'Approved' }, { academicYearId: 'year-2026' }]) {
    f.pagination().props.onPageChange(2); f.view.render(); f.finish();
    f.view.render(props); f.view.render(); f.finish();
    assert.equal(f.requests.at(-1).page, 1);
    assert.equal(f.requests.at(-1).page_size, 30);
    if (props.searchQuery) assert.equal(f.requests.at(-1).search, 'Budget');
    if (props.statusFilter) assert.equal(f.requests.at(-1).status, 'approved');
    if (props.academicYearId) assert.equal(f.requests.at(-1).academic_year_id, 'year-2026');
  }
  f.view.unmount();
});

test('loading, failed requests and authorization failures do not expose pagination', () => {
  const f = fixture();
  f.respond({ isLoading: true });
  assert.ok(nodes(f.view.output).some(node => node.type === 'Skeleton'));
  assert.equal(f.pagination(), undefined);
  f.respond({ isError: true, error: { status: 500 }, refetch() {} });
  assert.equal(f.view.output.props.title, 'Could not load submission history');
  assert.equal(f.pagination(), undefined);
  f.respond({ isError: true, error: { status: 403 }, data: { results: [{ submission_id: 'cached' }], total_pages: 2 }, refetch() {} });
  assert.equal(f.cards().length, 0);
  assert.equal(f.pagination(), undefined);
  f.view.unmount();
});
