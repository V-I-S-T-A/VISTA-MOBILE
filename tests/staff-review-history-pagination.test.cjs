const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

function fixture(count = 32) {
  const items = Array.from({ length: count }, (_, index) => ({ submission_id: `submission-${index + 1}` }));
  const requests = [], opened = [], frames = [];
  const h = createHarness({
    '../../components/staff/StaffBottomNav': { __esModule: true, default: 'Nav' },
    '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    './reviewPanel/StaffReviewHeader': { __esModule: true, default: 'Header' },
    './reviewPanel/StaffReviewBanner': { __esModule: true, default: 'Heading' },
    './reviewPanel/StaffReviewSearch': { __esModule: true, default: 'Search' },
    '../../components/submissions/SubmissionSummaryTabs': { __esModule: true, default: 'Tabs' },
    '../../components/submissions/AcademicYearFilterSheet': { __esModule: true, default: 'YearSheet' },
    '../../../components/submissions/SubmissionListCard': { __esModule: true, default: 'SubmissionCard' },
    '../../hooks/useSubmissions': { useSubmissions: params => {
      requests.push(params);
      const size = params.page_size || 20;
      return { data: { results: items.slice((params.page - 1) * size, params.page * size), total_pages: Math.max(1, Math.ceil(count / size)) } };
    } },
  }, { requestAnimationFrame: callback => frames.push(callback), cancelAnimationFrame() {} });
  const screen = h.instance(h.load('src/screens/staff/StaffReviewPanel.jsx').default, {
    navigation: { setParams() {}, navigate: (...args) => opened.push(args) }, route: {},
  });
  const listNode = () => nodes(screen.output).find(node => node.type?.name === 'StaffReviewList');
  const list = h.instance(listNode().type, listNode().props);
  return {
    screen, list, requests, opened, frames,
    update() { screen.render(); list.render(listNode().props); },
    pagination: () => nodes(screen.output).find(node => node.type?.name === 'SubmissionPagination'),
    cards: () => nodes(list.output).filter(node => node.type === 'SubmissionCard'),
    control: type => nodes(screen.output).find(node => node.type === type),
  };
}

test('the staff reports-tab history renders its entire 30-card page with the history footer after the list', () => {
  const f = fixture();
  assert.equal(f.requests.at(-1).page_size, 30);
  assert.equal(f.cards().length, 30);
  assert.equal(f.frames.length, 0, 'No incremental render frames should add cards while scrolling');
  assert.equal(f.pagination().props.variant, 'history');
  const scroll = nodes(f.screen.output).find(node => node.type === 'ScrollView');
  const body = nodes(scroll).find(node => node.type?.name === 'SubmissionFilterResults');
  const children = body.props.children.filter(Boolean);
  assert.equal(children.at(-2).type.name, 'StaffReviewList');
  assert.equal(children.at(-1).type.name, 'SubmissionPagination');
  f.cards()[0].props.onPress();
  assert.equal(f.opened[0][0], 'ReviewPanelDetails');
  assert.equal(f.opened[0][1].submission.submission_id, 'submission-1');
});

test('the reports-tab history paginates remaining submissions and resets to page one for filters', () => {
  const f = fixture();
  f.pagination().props.onPageChange(2); f.update();
  assert.equal(f.requests.at(-1).page, 2);
  assert.deepEqual(f.cards().map(node => node.props.submission.submission_id), ['submission-31', 'submission-32']);
  f.control('Search').props.setSearchQuery('Budget'); f.update();
  assert.equal(f.requests.at(-1).page, 1);
  assert.equal(f.requests.at(-1).search, 'Budget');
  f.pagination().props.onPageChange(2); f.update();
  f.control('Tabs').props.onChange('Approved'); f.update();
  assert.equal(f.requests.at(-1).page, 1);
  assert.equal(f.requests.at(-1).status, 'approved');
  f.pagination().props.onPageChange(2); f.update();
  f.control('YearSheet').props.onApply('year-2026'); f.update();
  assert.equal(f.requests.at(-1).page, 1);
  assert.equal(f.requests.at(-1).academic_year_id, 'year-2026');
  assert.ok(f.requests.every(params => params.page_size === 30));
});

test('the reports-tab history needs no pagination for the account with 24 submissions', () => {
  const f = fixture(24);
  assert.equal(f.cards().length, 24);
  assert.equal(f.pagination(), undefined);
  assert.equal(f.frames.length, 0);
});
