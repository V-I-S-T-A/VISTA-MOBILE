const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const flat = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

for (const action of [false, true]) test(`${action ? 'scan stays blue with white icon and outline' : 'only tab icons turn yellow'} while preserving press callbacks`, () => {
  const h = createHarness(), { colors } = h.load('src/theme/tokens.js');
  const Item = h.load('src/components/common/BottomNavItem.jsx').default;
  let calls = 0;
  const item = h.instance(Item, { label: 'Navigation fixture', icon: 'home', action, onPress: () => calls++ });
  const surface = () => flat(nodes(item.output).find(n => n.type === 'AnimatedView').props.style);
  const icon = () => nodes(item.output).find(n => n.type?.name === 'VistaIcon').props;
  assert.equal(surface().backgroundColor, action ? colors.blue : undefined); assert.equal(icon().color, colors.onBrand);
  const target = flat(item.output.props.style);
  item.output.props.onPressIn(); item.render();
  assert.equal(surface().backgroundColor, action ? colors.blue : undefined); assert.equal(icon().color, action ? colors.onBrand : colors.yellow);
  if (action) { assert.equal(surface().borderColor, colors.onBrand); assert.equal(item.output.props.activeOpacity, 1); }
  assert.equal(item.output.props.accessibilityState.selected, false, 'Press feedback does not change the active route');
  item.output.props.onPress(); assert.equal(calls, 1);
  item.output.props.onPressOut(); item.render();
  assert.equal(surface().backgroundColor, action ? colors.blue : undefined); assert.equal(icon().color, colors.onBrand);
  assert.deepEqual(flat(item.output.props.style), target, 'Color feedback never moves the touch target');
  item.render({ ...item.props, selected: true });
  item.output.props.onPressIn(); item.output.props.onPressOut(); item.render();
  assert.equal(surface().backgroundColor, action ? colors.blue : undefined); assert.equal(icon().color, action ? colors.onBrand : colors.yellow);
  assert.equal(item.output.props.accessibilityState.selected, true, 'The route selection remains accessible');
});

test('only the raised scan control paints a circle and its larger illustration does not increase bar height', () => {
  const h = createHarness(), { nav, sizes, compact, colors } = h.load('src/theme/tokens.js');
  const { navigationStyles } = h.load('src/theme/layout.js');
  const Item = h.load('src/components/common/BottomNavItem.jsx').default;
  for (const selected of [true, false]) {
    const item = h.instance(Item, { selected }).output;
    const visual = flat(nodes(item).find(n => n.type === 'AnimatedView').props.style);
    assert.equal(visual.backgroundColor, undefined, 'Transparent glyph wrappers cannot produce blue circles while the shell fades');
    assert.equal(visual.borderWidth, undefined);
    assert.equal(visual.boxShadow, undefined);
  }
  const scan = h.instance(Item, { action: true }).output;
  const visual = flat(nodes(scan).find(n => n.type === 'AnimatedView').props.style);
  assert.equal(visual.width, 60); assert.equal(visual.height, 60);
  assert.equal(visual.borderColor, colors.onBrand); assert.equal(visual.borderWidth, 1.5);
  assert.equal(nodes(scan).find(n => n.type?.name === 'VistaIcon').props.size, 30);
  assert.equal(visual.height + visual.marginVertical * 2, sizes.touch);
  assert.equal(sizes.touch + nav.padding * 2, compact.navHeight);
  assert.equal(navigationStyles.shell.minHeight, compact.navHeight);
});

test('staff and student navbar shells are blue and retain selected routes and action order', () => {
  const h = createHarness(), { colors } = h.load('src/theme/tokens.js');
  const { navigationStyles } = h.load('src/theme/layout.js');
  assert.equal(navigationStyles.shell.backgroundColor, colors.blue);
  for (const role of ['staff', 'students']) {
    const file = role === 'staff' ? 'src/components/staff/StaffBottomNav.jsx' : 'src/components/students/StudentBottomNav.jsx';
    const tree = h.instance(h.load(file).default, { activeTab: 'home' }).output;
    const items = nodes(tree).filter(n => n.type?.name === 'BottomNavItem');
    assert.deepEqual(items.map(n => n.props.label), role === 'staff' ? ['Home', 'Document entry', 'Scan document', 'Submissions', 'Google Drive'] : ['Home', 'Review tracker', 'All notifications']);
    assert.deepEqual(items.map(n => !!n.props.selected), items.map((_, i) => i === 0));
  }
});
