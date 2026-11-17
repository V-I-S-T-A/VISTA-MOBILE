const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('summary cards retain all four click actions and semantic VISTA tints', () => {
  const h = createHarness(), Cards = h.load('src/components/submissions/SubmissionDashboardCards.jsx').default;
  const calls = [];
  const tree = h.instance(Cards, { total: 8, pending: 2, approved: 3, rejected: 1, totalOnPress: () => calls.push('all'), pendingOnPress: () => calls.push('pending'), approvedOnPress: () => calls.push('approved'), rejectedOnPress: () => calls.push('rejected') }).output;
  const cards = nodes(tree).filter(n => n.type?.name === 'DashboardCard');
  cards.forEach(card => card.props.onPress());
  assert.deepEqual(calls, ['all', 'pending', 'approved', 'rejected']);
  assert.equal(cards[2].props.style.backgroundColor, h.load('src/theme/tokens.js').dashboardTones.approved.background);
});

test('summary tabs expose selected state and preserve server filter names', () => {
  const h = createHarness(), Tabs = h.load('src/components/submissions/SubmissionSummaryTabs.jsx').default;
  const calls = [];
  const tree = h.instance(Tabs, { value: 'Approved', onChange: value => calls.push(value) }).output;
  const tabs = nodes(tree).filter(n => n.props?.accessibilityRole === 'tab');
  assert.deepEqual(tabs.map(n => n.props.accessibilityState.selected), [false, false, true]);
  tabs.forEach(tab => tab.props.onPress());
  assert.deepEqual(calls, ['All Status', 'Pending', 'Approved']);
});

test('staff tabs offer exactly four filters and highlight Rejected in blue', () => {
  const h = createHarness(), Tabs = h.load('src/components/submissions/SubmissionSummaryTabs.jsx').default;
  const tree = h.instance(Tabs, { staff: true, value: 'Rejected', onChange() {} }).output;
  const tabs = nodes(tree).filter(n => n.props?.accessibilityRole === 'tab');
  assert.deepEqual(tabs.map(n => n.props.accessibilityLabel), ['Total submissions', 'Pending submissions', 'Approved submissions', 'Rejected submissions']);
  assert.equal(tabs[3].props.accessibilityState.selected, true);
  assert.ok(nodes(tabs[3]).some(n => n.props?.style?.backgroundColor === '#1a59a5'));
});

test('a summary-selected filter scrolls fully into view on a narrow phone and Total returns to the start', () => {
  const h = createHarness(), Tabs = h.load('src/components/submissions/SubmissionSummaryTabs.jsx').default;
  const changes = [], scrolls = [];
  const strip = h.instance(Tabs, { staff: true, value: 'Rejected', onChange: value => changes.push(value) });
  strip.output.props.ref.current = { scrollTo: options => scrolls.push(options.x) };
  strip.output.props.onLayout({ nativeEvent: { layout: { width: 288 } } });
  const tabs = nodes(strip.output).filter(n => n.props?.accessibilityRole === 'tab');
  tabs.forEach((tab, i) => tab.props.onLayout({ nativeEvent: { layout: { x: i * 108, width: 100 } } }));
  assert.equal(scrolls.at(-1), 136, 'The right edge of Rejected must be inside the visible strip');
  strip.render({ staff: true, value: 'All Status', onChange: value => changes.push(value) });
  assert.equal(scrolls.at(-1), 0);
  tabs[3].props.onPress(); assert.deepEqual(changes, ['Rejected']);
});

test('staff summary tabs use the four requested status queries', () => {
  let params;
  const overrides = {
    '../../components/staff/StaffBottomNav': { default: 'Nav', __esModule: true },
    '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useSubmissions': { useSubmissions: value => { params = value; return { data: { results: [], total_pages: 3 } }; } },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  };
  for (const name of ['StaffReviewHeader', 'StaffReviewBanner', 'StaffReviewSearch', 'StaffReviewList']) overrides[`./reviewPanel/${name}`] = { default: name, __esModule: true };
  const h = createHarness(overrides), Screen = h.load('src/screens/staff/StaffReviewPanel.jsx').default;
  const screen = h.instance(Screen, { navigation: { setParams() {} }, route: { params: { statusFilter: 'Approved' } } });
  screen.render(); assert.equal(params.status, 'approved');
  nodes(screen.output).find(n => n.type?.name === 'SubmissionSummaryTabs').props.onChange('Rejected'); screen.render();
  assert.equal(params.status, 'rejected');
  nodes(screen.output).find(n => n.type?.name === 'SubmissionSummaryTabs').props.onChange('All Status'); screen.render();
  assert.equal(params.status, undefined); assert.equal(params.page, 1);
});

test('student dashboard sends each summary to the matching tracker tab', () => {
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ user: { first_name: 'Isabella' } }) },
    '../../components/students/StudentHeader': { default: 'Header', __esModule: true },
    '../../components/students/StudentBottomNav': { default: 'Nav', __esModule: true },
    '@tanstack/react-query': { useQueries: () => [1, 2, 3, 4].map(count => ({ data: { count } })) },
    '../../services/submissionsService': {},
    '../../hooks/useSubmissions': { useSubmissions: () => ({ data: { results: [] } }) },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  });
  const calls = [], Screen = h.load('src/screens/student/StudentHomeScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: { navigate: (...args) => calls.push(args) } }).output;
  assert.equal(nodes(tree).find(n => n.type?.name === 'PageHeading').props.subtitle, 'Welcome back, Isabella');
  const cards = nodes(tree).find(n => n.type?.name === 'SubmissionDashboardCards');
  cards.props.totalOnPress(); cards.props.pendingOnPress(); cards.props.approvedOnPress(); cards.props.rejectedOnPress();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), ['All Status', 'Pending', 'Approved', 'Rejected'].map(statusFilter => ['StudentTracker', { statusFilter }]));
});

test('student tracker applies dashboard route filters, resets pagination and clears Total status', () => {
  let params;
  const overrides = {
    '../../components/students/StudentHeader': { default: 'Header', __esModule: true },
    '../../components/students/StudentBottomNav': { default: 'Nav', __esModule: true },
    '../../hooks/useSubmissions': { useSubmissions: value => { params = value; return { data: { results: [{ submission_id: 'one', title: 'Test' }], total_pages: 3 } }; } },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh() {} }) },
  };
  const h = createHarness(overrides), Screen = h.load('src/screens/student/StudentTrackerScreen.jsx').default;
  const navigation = { setParams() {}, navigate() {} };
  const screen = h.instance(Screen, { navigation, route: { params: { statusFilter: 'Approved' } } });
  screen.render(); assert.equal(params.status, 'approved');
  const heading = nodes(screen.output).find(n => n.type?.name === 'PageHeading');
  assert.equal(heading.props.compact, true, 'PageHeading should be compact');
  assert.equal(heading.props.style?.marginBottom, 2, 'PageHeading should have reduced marginBottom');
  nodes(screen.output).find(n => n.type?.name === 'SubmissionPagination').props.onPageChange(3); screen.render();
  assert.equal(params.page, 3);
  nodes(screen.output).find(n => n.type?.name === 'SubmissionSummaryTabs').props.onChange('Pending'); screen.render();
  assert.equal(params.page, 1); assert.equal(params.status, 'pending');
  screen.render({ navigation, route: { params: { statusFilter: 'All Status' } } }); screen.render();
  assert.equal(params.page, 1); assert.equal(params.status, undefined);
});

test('student tracker supports search bar like staff, passing search query and resetting page', () => {
  let params;
  let mockResults = [{ submission_id: 'sub-1', title: 'Activity Request' }];
  const overrides = {
    '../../components/students/StudentHeader': { default: 'Header', __esModule: true },
    '../../components/students/StudentBottomNav': { default: 'Nav', __esModule: true },
    '../../hooks/useSubmissions': { useSubmissions: value => { params = value; return { data: { results: mockResults, total_pages: 2 } }; } },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh() {} }) },
  };
  const h = createHarness(overrides), Screen = h.load('src/screens/student/StudentTrackerScreen.jsx').default;
  const navigation = { setParams() {}, navigate() {} };
  const screen = h.instance(Screen, { navigation, route: { params: {} } });
  screen.render();

  // Search component is present
  const searchNode = nodes(screen.output).find(n => n.type?.name === 'StaffReviewSearch');
  assert.ok(searchNode, 'Search submissions component should exist on StudentTracker');
  assert.equal(searchNode.props.searchQuery, '');

  // Render the search component itself to verify internal input structure
  const searchInstance = h.instance(searchNode.type, searchNode.props);
  const input = nodes(searchInstance.output).find(n => n.props?.accessibilityLabel === 'Search submissions');
  assert.ok(input, 'TextInput should have Search submissions accessibilityLabel');
  assert.equal(input.props.placeholder, 'Search submissions...');

  // Type search query
  searchNode.props.setSearchQuery('Activity');
  screen.render();
  assert.equal(params.search, 'Activity');
  assert.equal(params.page, 1);

  // Changing status tab resets search query
  nodes(screen.output).find(n => n.type?.name === 'SubmissionSummaryTabs').props.onChange('Pending');
  screen.render();
  assert.equal(params.status, 'pending');
  assert.equal(params.search, undefined);
  assert.equal(params.page, 1);

  // Empty search results state
  mockResults = [];
  const searchNodeAgain = nodes(screen.output).find(n => n.type?.name === 'StaffReviewSearch');
  searchNodeAgain.props.setSearchQuery('Nonexistent');
  screen.render();
  const emptyText = nodes(screen.output).find(n => n.type?.name === 'ContentState' && n.props.message === 'No submissions match your search.');
  assert.ok(emptyText, 'Should show search-specific empty state');
});

test('both staff and student dashboards show up to 5 recent submissions with compact heading gap', () => {
  const h = createHarness();
  const Heading = h.load('src/components/submissions/RecentSubmissionsHeading.jsx').default;
  const headingTree = h.instance(Heading, { onViewAll() {} }).output;
  assert.equal(headingTree.props.style?.marginBottom, 8, 'RecentSubmissionsHeading should have reduced marginBottom');
  const titleNode = nodes(headingTree).find(n => n.type === 'Text' && textOf(n) === 'Recent Submissions');
  assert.equal(titleNode.props.style?.fontSize, 12, 'Recent Submissions heading font size should be 12sp');
  const actionNode = nodes(headingTree).find(n => n.type === 'Text' && textOf(n) === 'View All');
  assert.equal(actionNode.props.style?.fontSize, 12, 'View All font size should be 10sp');

  let studentParams;
  const dummySubmissions = [1, 2, 3, 4, 5, 6].map(i => ({ submission_id: `s-${i}`, title: `Sub ${i}` }));
  const studentHarness = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ user: { first_name: 'Alex' } }) },
    '../../components/students/StudentHeader': { default: 'Header', __esModule: true },
    '../../components/students/StudentBottomNav': { default: 'Nav', __esModule: true },
    '@tanstack/react-query': { useQueries: () => [1, 2, 3, 4].map(count => ({ data: { count } })) },
    '../../services/submissionsService': {},
    '../../hooks/useSubmissions': {
      useSubmissions: params => {
        studentParams = params;
        return { data: { results: dummySubmissions } };
      },
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  });

  const StudentScreen = studentHarness.load('src/screens/student/StudentHomeScreen.jsx').default;
  const studentTree = studentHarness.instance(StudentScreen, { navigation: {} }).output;
  assert.equal(studentParams.page_size, 5, 'Student home should request page_size 5');
  const studentCards = nodes(studentTree).filter(n => n.type?.name === 'SubmissionListCard');
  assert.equal(studentCards.length, 5, 'Student home should display up to 5 recent submission cards');

  let staffParams;
  const staffHarness = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../../../context/AuthContext': { useAuth: () => ({ user: { first_name: 'Officer' } }) },
    '../../../components/common/AccountHeader': { default: 'AccountHeader', __esModule: true },
    '@tanstack/react-query': { useQueries: () => [1, 1, 1, 1].map(count => ({ data: { count } })) },
    '../../../services/submissionsService': {},
    '../../../hooks/useSubmissions': {
      useSubmissions: params => {
        staffParams = params;
        return { data: { results: dummySubmissions } };
      },
    },
    '../../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
  });

  const StaffContent = staffHarness.load('src/screens/staff/home/StaffHomeContent.jsx').default;
  const staffTree = staffHarness.instance(StaffContent, {}).output;
  const recentNode = nodes(staffTree).find(n => n.type?.name === 'RecentSubmissions');
  assert.ok(recentNode, 'RecentSubmissions component should exist in StaffHomeContent');
  const recentTree = staffHarness.instance(recentNode.type, {}).output;
  assert.equal(staffParams.page_size, 5, 'Staff home should request page_size 5');
  const staffCards = nodes(recentTree).filter(n => n.type?.name === 'SubmissionListCard');
  assert.equal(staffCards.length, 5, 'Staff home should display up to 5 recent submission cards');
});

test('staff review banner and submission history top have compact heading gap to filter buttons', () => {
  const h = createHarness();
  const Banner = h.load('src/screens/staff/reviewPanel/StaffReviewBanner.jsx').default;
  const bannerTree = h.instance(Banner, {}).output;
  const bannerHeading = nodes(bannerTree).find(n => n.type?.name === 'PageHeading');
  assert.equal(bannerHeading.props.compact, true);
  assert.equal(bannerHeading.props.style?.marginBottom, 2);

  const Top = h.load('src/screens/staff/home/submissionHistory/SubmissionHistoryTop.jsx').default;
  const topTree = h.instance(Top, {}).output;
  const topHeading = nodes(topTree).find(n => n.type?.name === 'PageHeading');
  assert.equal(topHeading.props.compact, true);
  assert.equal(topHeading.props.style?.marginBottom, 2);
});

test('StaffSubmissionHistory uses blue Filter button with white text and icon', () => {
  const h = createHarness({
    '../../../components/staff/StaffBottomNav': { default: 'Nav', __esModule: true },
    '../reviewPanel/StaffReviewHeader': { default: 'Header', __esModule: true },
    '../../../utils/openDocumentEntryWithAttachment': {},
    '../../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ refreshing: false, onRefresh() {} }) },
    '../../../components/submissions/AcademicYearFilterSheet': { default: 'Sheet', __esModule: true },
    './submissionHistory/SubmissionHistoryList': { default: 'List', __esModule: true },
  });
  const Screen = h.load('src/screens/staff/home/StaffSubmissionHistory.jsx').default;
  const tree = h.instance(Screen, { navigation: { setParams() {} }, route: { params: {} } }).output;
  const searchNode = nodes(tree).find(n => n.type?.name === 'StaffReviewSearch');
  assert.ok(searchNode, 'StaffReviewSearch must exist in StaffSubmissionHistory');
  assert.equal(searchNode.props.filterButtonVariant, 'blue', 'StaffSubmissionHistory must pass filterButtonVariant="blue"');

  const SearchComponent = h.load('src/screens/staff/reviewPanel/StaffReviewSearch.jsx').default;
  const searchTree = h.instance(SearchComponent, {
    searchQuery: '',
    setSearchQuery() {},
    onFilterPress() {},
    isFilterActive: false,
    filterButtonVariant: 'blue',
  }).output;

  const filterBtn = nodes(searchTree).find(n => n.props?.accessibilityRole === 'button' && n.props?.accessibilityLabel === 'Filter submissions');
  assert.ok(filterBtn, 'Filter button must exist');
  const buttonSurface = nodes(filterBtn).find(n => n.props?.style?.backgroundColor === '#1a59a5');
  assert.ok(buttonSurface, 'Filter button surface must use blue (#1a59a5)');

  const labelText = nodes(filterBtn).find(n => n.type === 'Text' && textOf(n) === 'Filter');
  assert.equal(labelText.props?.style?.color, '#FFFFFF', 'Filter button text must be white (#FFFFFF)');

  const icon = nodes(filterBtn).find(n => n.props?.name === 'filter');
  assert.equal(icon.props?.color, '#FFFFFF', 'Filter button icon must be white (#FFFFFF)');
});
