const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...[].concat(value || []));
const keys = ['total', 'pending', 'approved', 'rejected'];

test('four summary cards form Total/Pending then Approved/Rejected and retain all accessible actions', () => {
  const h = createHarness(), calls = [];
  const Cards = h.load('src/components/submissions/SubmissionDashboardCards.jsx').default;
  const props = Object.fromEntries(keys.flatMap((key, i) => [[key, [24, 0, 8, 6][i]], [`${key}OnPress`, () => calls.push(key)]]));
  const tree = h.instance(Cards, props).output;
  const rows = tree.props.children;
  assert.equal(rows.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(rows.map(row => row.props.children.map(c => c.props.label)))), [['Total Submissions', 'Pending'], ['Approved', 'Rejected']]);
  const cards = nodes(tree).filter(n => n.type?.name === 'DashboardCard');
  assert.equal(cards.length, 4);
  for (const card of cards) {
    const surface = h.instance(card.type, card.props).output;
    const button = h.instance(surface.type, surface.props).output;
    assert.equal(button.props.accessibilityRole, 'button');
    assert.match(button.props.accessibilityLabel, /submissions/);
    assert.equal(card.props.style.aspectRatio, 1, 'Height follows the actual column width');
    assert.equal(card.props.style.minHeight, undefined, 'No minimum height can stretch the square');
    assert.equal(card.props.style.flex, 1);
    assert.equal(card.props.style.height, undefined, 'Cards grow for scaled/wrapped text');
    assert.ok(!nodes(card).some(n => n.props?.allowFontScaling === false || n.props?.numberOfLines), 'Full labels remain scalable');
    button.props.onPress();
  }
  assert.deepEqual(calls, keys);
  assert.match(textOf(cards[1]), /Pending0/, 'A real zero remains visible');
});

test('four original summary colors use white DM Sans text and clearly visible decorative illustrations', () => {
  const h = createHarness();
  const { dashboardTones, colors } = h.load('src/theme/tokens.js');
  assert.equal(dashboardTones.total.background, colors.blue, 'Keep the original VISTA blue');
  assert.equal(dashboardTones.pending.background, colors.yellow);
  assert.equal(dashboardTones.approved.background, colors.green);
  assert.equal(dashboardTones.rejected.background, colors.danger);
  const tree = h.instance(h.load('src/components/submissions/SubmissionDashboardCards.jsx').default, { total: 24, pending: 1, approved: 8, rejected: 6 }).output;
  const cards = nodes(tree).filter(n => n.type?.name === 'DashboardCard');
  for (const [i, key] of keys.entries()) {
    const tone = dashboardTones[key];
    assert.equal(tone.foreground, colors.onBrand);
    for (const text of nodes(cards[i]).filter(n => n.type === 'Text')) {
      assert.equal(flat(text.props.style).color, '#FFFFFF');
      assert.equal(flat(text.props.style).textShadowColor, undefined);
      assert.match(flat(text.props.style).fontFamily, /^DMSans_/);
    }
    const illustration = nodes(cards[i]).find(n => n.type?.name === 'DashboardCardIllustration');
    assert.equal(illustration.props.kind, key);
    const artwork = h.instance(illustration.type, illustration.props).output;
    assert.equal(artwork.props.pointerEvents, 'none');
    assert.equal(artwork.props.importantForAccessibility, 'no-hide-descendants');
    assert.equal(cards[i].props.style.overflow, 'hidden');
    const anchor = nodes(cards[i]).find(n => n.props?.style?.position === 'absolute');
    assert.equal(anchor.props.style.bottom, 0, 'Original artwork placement is retained');
    const content = nodes(cards[i]).find(n => n.props?.style?.justifyContent === 'space-between');
    assert.equal(content.props.style.flexDirection, 'row', 'Count and artwork have separate side-by-side space');
    assert.equal(content.props.style.overflow, undefined, 'No short footer clips the top of the illustration');
  }
});

test('illustrations have no inner backgrounds and the blue clock stands apart from the yellow card', () => {
  const h = createHarness(), { dashboardArt, dashboardLayout, dashboardTones, colors } = h.load('src/theme/tokens.js');
  const calls = [];
  const props = Object.fromEntries(keys.map(key => [`${key}OnPress`, () => calls.push(key)]));
  const tree = h.instance(h.load('src/components/submissions/SubmissionDashboardCards.jsx').default, props).output;
  const cards = nodes(tree).filter(n => n.type?.name === 'DashboardCard');
  for (const [i, key] of keys.entries()) {
    const slot = nodes(cards[i]).find(n => n.props?.pointerEvents === 'none');
    assert.equal(slot.props.style.backgroundColor, undefined);
    assert.equal(slot.props.style.width, slot.props.style.height);
    assert.equal(slot.props.importantForAccessibility, 'no-hide-descendants');
    const illustration = nodes(cards[i]).find(n => n.type?.name === 'DashboardCardIllustration');
    assert.equal(illustration.props.scale, dashboardLayout.artScale);
    h.instance(cards[i].type, cards[i].props).output.props.onPress();
  }
  const Illustration = h.load('src/components/submissions/DashboardCardIllustration.jsx').default;
  const clock = h.instance(Illustration, { kind: 'pending' }).output;
  const rim = nodes(clock).find(n => flat(n.props?.style).width === 78);
  assert.equal(flat(rim.props.style).backgroundColor, colors.blue);
  assert.notEqual(flat(rim.props.style).backgroundColor, dashboardTones.pending.background);
  assert.ok(nodes(clock).some(n => flat(n.props?.style).backgroundColor === dashboardArt.paper));
  const folder = h.instance(Illustration, { kind: 'total' }).output;
  assert.ok(nodes(folder).some(n => flat(n.props?.style).backgroundColor === dashboardArt.gold), 'Keep the gold folder on blue');
  assert.deepEqual(calls, keys);
});

test('loading preserves the two-by-two summary structure and unknown totals do not appear as zero', () => {
  const h = createHarness(), Cards = h.load('src/components/submissions/SubmissionDashboardCards.jsx').default;
  const loading = h.instance(Cards, { isLoading: true }).output;
  const skeleton = h.instance(loading.type, loading.props).output;
  assert.equal(skeleton.props.accessibilityState.busy, true);
  assert.deepEqual(Array.from(skeleton.props.children, row => row.props.children.length), [2, 2]);
  for (const [rowIndex, row] of skeleton.props.children.entries()) for (const [columnIndex, tile] of row.props.children.entries()) {
    assert.equal(tile.props.style.aspectRatio, 1);
    assert.equal(tile.props.style.minHeight, undefined);
    assert.equal(tile.props.style.backgroundColor, h.load('src/theme/tokens.js').dashboardTones[keys[rowIndex * 2 + columnIndex]].background);
  }
  const tree = h.instance(Cards, { total: '—', pending: 0, approved: '—', rejected: '—' }).output;
  assert.match(textOf(tree), /Rejected—/);
});

test('large accessibility text keeps square tiles and complete actions in a single column, including loading', () => {
  const h = createHarness();
  h.native.useWindowDimensions = () => ({ width: 320, fontScale: 2 });
  const Cards = h.load('src/components/submissions/SubmissionDashboardCards.jsx').default;
  const calls = [];
  const props = Object.fromEntries(keys.map(key => [`${key}OnPress`, () => calls.push(key)]));
  const tree = h.instance(Cards, props).output;
  assert.deepEqual(Array.from(tree.props.children, row => row.props.children.length), [1, 1, 1, 1]);
  for (const card of nodes(tree).filter(n => n.type?.name === 'DashboardCard')) {
    assert.equal(card.props.style.aspectRatio, 1);
    assert.ok(!nodes(card).some(n => n.props?.allowFontScaling === false || n.props?.numberOfLines));
    card.props.onPress();
  }
  assert.deepEqual(calls, keys);
  const loading = h.instance(Cards, { isLoading: true }).output;
  const skeleton = h.instance(loading.type, loading.props).output;
  assert.deepEqual(Array.from(skeleton.props.children, row => row.props.children.length), [1, 1, 1, 1]);
});

for (const role of ['staff', 'student']) test(`${role} totals query the existing scoped statuses and every card opens the same filtered history`, async () => {
  const calls = [], requests = []; let queries;
  const auth = { useAuth: () => ({ user: { user_id: 'viewer-a', role, first_name: 'Alex' }, role }) };
  const service = { submissionsService: { listSubmissions: async params => { requests.push(params); return { count: 1 }; } } };
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate: (...args) => calls.push(args) }) },
    '@tanstack/react-query': { useQueries: options => { queries = options.queries; return queries.map((_, i) => ({ data: { count: [24, 1, 8, 6][i] } })); } },
    '../../../context/AuthContext': auth, '../../context/AuthContext': auth,
    '../context/AuthContext': auth,
    '../../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    '../../../services/submissionsService': service, '../../services/submissionsService': service,
    '../../../hooks/useSubmissions': { useSubmissions: () => ({ data: { results: [] } }) },
    '../../hooks/useSubmissions': { useSubmissions: () => ({ data: { results: [] } }) },
  });
  let cards;
  if (role === 'staff') {
    const tree = h.instance(h.load('src/screens/staff/home/StaffHomeContent.jsx').default).output;
    const summary = nodes(tree).find(n => n.type?.name === 'SubmissionSummary');
    cards = h.instance(summary.type, summary.props).output;
  } else {
    const tree = h.instance(h.load('src/screens/student/StudentHomeScreen.jsx').default, { navigation: { navigate: (...args) => calls.push(args) } }).output;
    cards = nodes(tree).find(n => n.type?.name === 'SubmissionDashboardCards');
  }
  assert.equal(queries.length, 4);
  assert.ok(queries.every(q => q.enabled && q.queryKey.includes('viewer-a')));
  assert.deepEqual(keys.map(key => cards.props[key]), [24, 1, 8, 6]);
  await Promise.all(queries.map(q => q.queryFn()));
  assert.deepEqual(JSON.parse(JSON.stringify(requests)), [{ page_size: 1 }, ...['pending', 'approved', 'rejected'].map(status => ({ page_size: 1, status }))]);
  keys.forEach(key => cards.props[`${key}OnPress`]());
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), ['All Status', 'Pending', 'Approved', 'Rejected'].map(statusFilter => [role === 'staff' ? 'StaffReviewPanel' : 'StudentTracker', { statusFilter }]));
});
