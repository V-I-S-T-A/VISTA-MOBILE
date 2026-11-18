const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('Row 1 (SubmissionSummaryTabs): distributes 4 status tabs proportionally without Filter button in tab row', () => {
  const h = createHarness();
  const Tabs = h.load('src/components/submissions/SubmissionSummaryTabs.jsx').default;

  const tree = h.instance(Tabs, {
    showRejected: true,
    value: 'Approved',
    onChange() {},
  }).output;

  // Tabs must contain Total, Pending, Approved, Rejected
  const tabElements = nodes(tree).filter(n => n.props?.accessibilityRole === 'tab');
  assert.deepEqual(tabElements.map(n => n.props.accessibilityLabel), [
    'Total submissions',
    'Pending submissions',
    'Approved submissions',
    'Rejected submissions',
  ]);

  // Tab row must NOT contain any Filter button
  const filterBtn = nodes(tree).find(n => n.props?.accessibilityRole === 'button' && textOf(n).includes('Filter'));
  assert.equal(filterBtn, undefined, 'Filter button must NOT be inside SubmissionSummaryTabs');

  // Verify proportional width distribution (flex: 1 / flexGrow: 1)
  assert.ok(tabElements.every(t => t.props?.style?.flex === 1 || t.props?.style?.flexGrow === 1), 'Tabs must distribute proportionally');
  assert.ok(tabElements.every(t => t.props?.style?.minHeight >= 48), 'Every tab must retain at least 48dp touch target');
});

test('Row 2 (StaffReviewSearch): anchors blue Filter button to the right of Search bar with 8dp gap', () => {
  const h = createHarness();
  const SearchWithFilter = h.load('src/screens/staff/reviewPanel/StaffReviewSearch.jsx').default;

  let filterPressed = false;
  let textChanged = '';

  const tree = h.instance(SearchWithFilter, {
    searchQuery: '',
    setSearchQuery: (v) => { textChanged = v; },
    onFilterPress: () => { filterPressed = true; },
    isFilterActive: false,
  }).output;

  // Outer row layout: flexDirection row, gap: 8
  assert.equal(tree.props?.style?.flexDirection, 'row');
  assert.equal(tree.props?.style?.gap, 8);

  // Search input: flex 1, minWidth 0
  const searchInput = nodes(tree).find(n => n.props?.accessibilityLabel === 'Search submissions');
  assert.ok(searchInput, 'Search submissions TextInput must exist');
  const searchWrapper = nodes(tree).find(n => n.props?.style?.flex === 1);
  assert.ok(searchWrapper, 'Search bar wrapper must occupy remaining horizontal space with flex: 1');
  assert.equal(searchWrapper.props?.style?.minWidth, 0);

  // Filter button anchored to the right
  const filterBtn = nodes(tree).find(n => n.props?.accessibilityRole === 'button' && n.props?.accessibilityLabel === 'Filter submissions');
  assert.ok(filterBtn, 'Blue Filter button must exist in Row 2');
  assert.ok(filterBtn.props?.style?.minHeight >= 48, 'Filter touch target must be at least 48dp');
  assert.ok(filterBtn.props?.style?.minWidth >= 48, 'Filter touch target must be at least 48dp wide');
  assert.equal(filterBtn.props?.style?.flexShrink, 0, 'Filter button must have flexShrink: 0 so it never shrinks or clips');

  // Blue filter surface keeps the same compact height and touch target.
  const buttonSurface = nodes(filterBtn).find(n => n.props?.style?.backgroundColor === '#1a59a5');
  assert.ok(buttonSurface, 'Filter button must use VISTA blue');
  assert.equal(buttonSurface.props?.style?.minHeight, 40, 'Filter button height must match search bar (36dp)');

  // Label text and icon
  const labelText = nodes(filterBtn).find(n => n.type === 'Text' && textOf(n) === 'Filter');
  assert.ok(labelText, 'Label must be "Filter"');
  assert.equal(labelText.props?.style?.color, '#FFFFFF', 'Blue filter labels use white text');

  // Test press
  filterBtn.props.onPress();
  assert.equal(filterPressed, true, 'Tapping Filter button triggers onFilterPress');

  // Test active filter state
  const activeTree = h.instance(SearchWithFilter, {
    searchQuery: 'Test',
    setSearchQuery() {},
    onFilterPress() {},
    isFilterActive: true,
    activeFilterLabel: '2025–2026',
  }).output;

  const activeBtn = nodes(activeTree).find(n => n.props?.accessibilityRole === 'button');
  assert.equal(activeBtn.props?.accessibilityState?.selected, true);
  assert.match(activeBtn.props?.accessibilityLabel, /2025–2026/);
});

test('AcademicYearFilterSheet: lists available years, supports radio selection, Apply, and Reset', () => {
  const h = createHarness();
  const Sheet = h.load('src/components/submissions/AcademicYearFilterSheet.jsx').default;

  const mockYears = [
    { academic_year_id: 'ay-2026', year: '2026–2027' },
    { academic_year_id: 'ay-2025', year: '2025–2026' },
    { academic_year_id: 'ay-2024', year: '2024–2025' },
  ];

  let appliedId = 'uncalled';
  let closed = false;
  let resetCalled = false;

  const sheet = h.instance(Sheet, {
    visible: true,
    selectedId: 'ay-2025',
    years: mockYears,
    onApply: (id) => { appliedId = id; },
    onReset: () => { resetCalled = true; appliedId = null; },
    onClose: () => { closed = true; },
  });

  // Section title
  const title = nodes(sheet.output).find(n => n.props?.accessibilityRole === 'header' && textOf(n) === 'Academic Year');
  assert.ok(title, 'Section title must be "Academic Year"');

  // Radio options
  const radios = nodes(sheet.output).filter(n => n.props?.accessibilityRole === 'radio');
  assert.equal(radios.length, 4, 'Must have 4 radio options (All + 3 years)');
  assert.equal(radios[0].props.accessibilityLabel, 'All academic years');
  assert.equal(radios[1].props.accessibilityLabel, '2026–2027');
  assert.equal(radios[2].props.accessibilityLabel, '2025–2026');
  assert.equal(radios[3].props.accessibilityLabel, '2024–2025');

  // 2025–2026 is currently selected
  assert.equal(radios[0].props.accessibilityState.checked, false);
  assert.equal(radios[2].props.accessibilityState.checked, true);

  // Select 2026–2027
  radios[1].props.onPress();
  sheet.render();

  // Tap Apply Filter
  const applyBtn = nodes(sheet.output).find(n => n.props?.label === 'Apply Filter');
  assert.ok(applyBtn, 'Apply Filter button must exist');
  applyBtn.props.onPress();
  assert.equal(appliedId, 'ay-2026', 'Apply Filter must emit newly selected academic year ID');
  assert.equal(closed, true, 'Apply Filter must close the sheet');

  // Reset Filter
  closed = false;
  appliedId = 'uncalled';
  const resetBtn = nodes(sheet.output).find(n => n.props?.label === 'Reset Filter');
  assert.ok(resetBtn, 'Reset Filter button must exist');
  resetBtn.props.onPress();
  assert.equal(appliedId, null, 'Reset Filter must clear academic year to null');
  assert.equal(resetCalled, true, 'Reset callback must be called');
  assert.equal(closed, true, 'Reset Filter must close the sheet');
});

test('StudentTrackerScreen: Row 1 status tabs + Row 2 search & filter work together across all three filters', () => {
  let capturedParams;
  const mockSubmissions = [
    { submission_id: 'sub-1', title: 'Science Club Budget', academic_year_id: 'ay-2025', academic_year: '2025–2026' },
  ];

  const h = createHarness({
    '../../components/students/StudentHeader': { default: 'Header', __esModule: true },
    '../../components/students/StudentBottomNav': { default: 'Nav', __esModule: true },
    '../../hooks/useSubmissions': {
      useSubmissions: (params) => {
        capturedParams = params;
        if (params?.academic_year_id === 'ay-empty') {
          return { data: { count: 0, results: [], total_pages: 1 }, isLoading: false, isError: false };
        }
        return { data: { count: mockSubmissions.length, results: mockSubmissions, total_pages: 1 }, isLoading: false, isError: false };
      },
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    '../../hooks/useAcademicYears': {
      useAcademicYears: () => ({ data: [{ academic_year_id: 'ay-2025', year: '2025–2026' }] }),
    },
  });

  const Screen = h.load('src/screens/student/StudentTrackerScreen.jsx').default;
  const screen = h.instance(Screen, { navigation: { setParams() {}, navigate() {} }, route: {} });

  // 1. Initial state: Total + All academic years
  assert.equal(capturedParams.page, 1);
  assert.equal(capturedParams.status, undefined);
  assert.equal(capturedParams.academic_year_id, undefined);

  // 2. Select Academic Year: 2025–2026 through Filter sheet
  const filterSheet = nodes(screen.output).find(n => n.type?.name === 'AcademicYearFilterSheet');
  filterSheet.props.onApply('ay-2025');
  screen.render();

  assert.equal(capturedParams.status, undefined);
  assert.equal(capturedParams.academic_year_id, 'ay-2025');
  assert.equal(capturedParams.page, 1);

  // 3. Switch to Approved tab while keeping Academic Year
  const tabs = nodes(screen.output).find(n => n.type?.name === 'SubmissionSummaryTabs');
  tabs.props.onChange('Approved');
  screen.render();

  assert.equal(capturedParams.status, 'approved');
  assert.equal(capturedParams.academic_year_id, 'ay-2025');

  // 4. Type search query "SARF" while keeping Approved and Academic Year
  const searchComponent = nodes(screen.output).find(n => n.type?.name === 'StaffReviewSearch');
  assert.ok(searchComponent.props.onFilterPress, 'StaffReviewSearch must receive onFilterPress in Row 2');
  assert.equal(searchComponent.props.isFilterActive, true, 'StaffReviewSearch indicates active filter');
  searchComponent.props.setSearchQuery('SARF');
  screen.render();

  assert.equal(capturedParams.status, 'approved', 'Status is preserved');
  assert.equal(capturedParams.academic_year_id, 'ay-2025', 'Academic Year is preserved');
  assert.equal(capturedParams.search, 'SARF', 'Search query is applied');

  // 5. Switch to Rejected tab on Student Tracker while keeping Academic Year
  tabs.props.onChange('Rejected');
  screen.render();

  assert.equal(capturedParams.status, 'rejected', 'Status changes to rejected');
  assert.equal(capturedParams.academic_year_id, 'ay-2025', 'Academic year is preserved');

  // 6. Clearing Academic Year preserves Status
  filterSheet.props.onReset();
  screen.render();

  assert.equal(capturedParams.status, 'rejected', 'Rejected status preserved after resetting academic year');
  assert.equal(capturedParams.academic_year_id, undefined, 'Academic year is cleared');
});

test('StaffReviewPanel: Row 1 status tabs + Row 2 search & filter work together', () => {
  let capturedParams;
  const mockSubmissions = [
    { submission_id: 'sub-staff-1', title: 'Activity Proposal', academic_year_id: 'ay-2025', academic_year: '2025–2026' },
  ];

  const overrides = {
    '../../components/staff/StaffBottomNav': { default: 'Nav', __esModule: true },
    '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useSubmissions': {
      useSubmissions: (params) => {
        capturedParams = params;
        if (params?.academic_year_id === 'ay-empty') {
          return { data: { count: 0, results: [], total_pages: 1 }, isLoading: false, isError: false };
        }
        return { data: { count: mockSubmissions.length, results: mockSubmissions, total_pages: 1 }, isLoading: false, isError: false };
      },
    },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    '../../hooks/useAcademicYears': {
      useAcademicYears: () => ({ data: [{ academic_year_id: 'ay-2025', year: '2025–2026' }] }),
    },
    './reviewPanel/StaffReviewHeader': { default: 'StaffReviewHeader', __esModule: true },
    './reviewPanel/StaffReviewBanner': { default: 'StaffReviewBanner', __esModule: true },
  };

  const h = createHarness(overrides);
  const Screen = h.load('src/screens/staff/StaffReviewPanel.jsx').default;
  const screen = h.instance(Screen, { navigation: { setParams() {}, navigate() {} }, route: {} });

  // Initial state
  assert.equal(capturedParams.status, undefined);
  assert.equal(capturedParams.academic_year_id, undefined);

  // Apply academic year
  const filterSheet = nodes(screen.output).find(n => n.type?.name === 'AcademicYearFilterSheet');
  filterSheet.props.onApply('ay-2025');
  screen.render();

  assert.equal(capturedParams.academic_year_id, 'ay-2025');

  // Change to Rejected tab
  const tabs = nodes(screen.output).find(n => n.type?.name === 'SubmissionSummaryTabs');
  tabs.props.onChange('Rejected');
  screen.render();

  assert.equal(capturedParams.status, 'rejected');
  assert.equal(capturedParams.academic_year_id, 'ay-2025');

  // Change Search text
  const search = nodes(screen.output).find(n => n.type?.name === 'StaffReviewSearch');
  assert.ok(search.props.onFilterPress, 'StaffReviewSearch must receive onFilterPress in Row 2');
  search.props.setSearchQuery('Proposal');
  screen.render();

  assert.equal(capturedParams.status, 'rejected');
  assert.equal(capturedParams.academic_year_id, 'ay-2025');
  assert.equal(capturedParams.search, 'Proposal');
});
