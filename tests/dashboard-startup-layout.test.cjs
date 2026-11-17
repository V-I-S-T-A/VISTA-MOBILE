const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/mobileComponentHarness.cjs');
const rows = tree => Array.from(tree.props.children, row => row.props.children.length);
const measure = (tree, width) => tree.props.onLayout({ nativeEvent: { layout: { width } } });

for (const width of [320, 359, 360, 393, 800]) for (const fontScale of [1, 1.3, 2]) test(`cold dashboard keeps its grid after layout at ${width}dp / text ${fontScale}`, () => {
  const h = createHarness();
  h.native.useWindowDimensions = () => ({ width, height: 800, fontScale });
  const { useStaffLayout } = h.load('src/theme/layout.js');
  const horizontal = h.instance(useStaffLayout).output.horizontal;
  const available = width - horizontal.paddingLeft - horizontal.paddingRight;
  const Cards = h.load('src/components/submissions/SubmissionDashboardCards.jsx').default;
  const screen = h.instance(Cards, { total: 24 });
  const first = rows(screen.output);
  measure(screen.output, available); screen.render();
  assert.deepEqual(rows(screen.output), first, 'Native layout must not change a correct first-frame column count');
  if (width === 320 && fontScale === 1) assert.deepEqual(first, [2, 2], 'Regression: 20dp guessed gutters used to cause four giant squares before the actual 16dp gutters were measured');
});

test('loading measurement survives the first content render, refetch and subsequent content', () => {
  const h = createHarness(); h.native.useWindowDimensions = () => ({ width: 480, height: 800, fontScale: 1 });
  const screen = h.instance(h.load('src/components/submissions/SubmissionDashboardCards.jsx').default, { isLoading: true });
  let loading = h.instance(screen.output.type, screen.output.props).output;
  measure(loading, 240); screen.render();
  loading = h.instance(screen.output.type, screen.output.props).output;
  assert.deepEqual(rows(loading), [1, 1, 1, 1]);
  const callback = loading.props.onLayout;
  screen.render({ isLoading: false, total: 24 });
  assert.deepEqual(rows(screen.output), rows(loading), 'Do not guess a new grid when loading finishes');
  assert.equal(screen.output.props.onLayout, callback);
  screen.render({ isLoading: true }); loading = h.instance(screen.output.type, screen.output.props).output;
  assert.deepEqual(rows(loading), [1, 1, 1, 1]);
  screen.render({ isLoading: false, total: 25 });
  assert.deepEqual(rows(screen.output), [1, 1, 1, 1]);
});

test('safe-area side insets use the same first-frame width as the screen', () => {
  const insets = { top: 24, bottom: 0, left: 65, right: 65 };
  const h = createHarness({ 'react-native-safe-area-context': { useSafeAreaInsets: () => insets } });
  h.native.useWindowDimensions = () => ({ width: 393, height: 800, fontScale: 1 });
  const screen = h.instance(h.load('src/components/submissions/SubmissionDashboardCards.jsx').default);
  assert.deepEqual(rows(screen.output), [1, 1, 1, 1]);
  measure(screen.output, 393 - insets.left - insets.right); screen.render();
  assert.deepEqual(rows(screen.output), [1, 1, 1, 1]);
});

test('standalone summary skeleton also starts with the correct small-screen grid', () => {
  const h = createHarness(); h.native.useWindowDimensions = () => ({ width: 320, height: 800, fontScale: 1 });
  const screen = h.instance(h.load('src/components/common/Skeleton.jsx').DashboardCardsSkeleton);
  assert.deepEqual(rows(screen.output), [2, 2]);
  measure(screen.output, 288); screen.render();
  assert.deepEqual(rows(screen.output), [2, 2]);
});
