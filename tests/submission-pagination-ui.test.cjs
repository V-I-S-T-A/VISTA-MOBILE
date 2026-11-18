const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

function fixture(props = {}) {
  const calls = [], h = createHarness();
  const view = h.instance(h.load('src/components/submissions/SubmissionPagination.jsx').default, {
    variant: 'history', totalPages: 4, onPageChange: page => calls.push(page), ...props,
  });
  return { view, calls, button: label => nodes(view.output).find(node => node.props?.accessibilityLabel === label) };
}

test('history pagination has a readable page count, selected state and at least 48dp touch targets', () => {
  const f = fixture({ currentPage: 2 });
  assert.match(textOf(f.view.output), /Page 2 of 4/);
  assert.equal(f.button('Page 2').props.accessibilityState.selected, true);
  assert.equal(f.button('Page 2').props.disabled, true);
  assert.equal(f.button('Page 1').props.accessibilityState.selected, false);
  const buttons = nodes(f.view.output).filter(node => node.props?.accessibilityRole === 'button');
  assert.equal(buttons.length, 6);
  for (const button of buttons) {
    assert.ok(button.props.style.minWidth >= 48);
    assert.ok(button.props.style.minHeight >= 48);
    assert.equal(button.props.style.height, undefined, 'Large system text must be able to grow');
  }
  assert.ok(nodes(f.view.output).some(node => node.props?.style?.flexWrap === 'wrap'));
  assert.ok(nodes(f.button('Page 2')).some(node => node.props?.style?.backgroundColor === '#1a59a5'));
  assert.equal(nodes(f.view.output).some(node => node.type === 'ScrollView'), false, 'Page choices should wrap instead of hiding in a horizontal scroll');
});

test('history arrows and numbered choices dispatch the selected page and respect boundaries', () => {
  const f = fixture({ currentPage: 2 });
  f.button('Previous page').props.onPress();
  f.button('Next page').props.onPress();
  f.button('Page 4').props.onPress();
  f.button('Page 2').props.onPress();
  assert.deepEqual(f.calls, [1, 3, 4]);
  const first = fixture();
  assert.equal(first.button('Previous page').props.disabled, true);
  first.button('Previous page').props.onPress();
  assert.equal(first.calls.length, 0);
  const last = fixture({ currentPage: 4 });
  assert.equal(last.button('Next page').props.disabled, true);
  last.button('Next page').props.onPress();
  assert.equal(last.calls.length, 0);
});

test('history pagination exposes busy states and cannot dispatch while busy', () => {
  const f = fixture({ currentPage: 2, busy: true });
  for (const button of nodes(f.view.output).filter(node => node.props?.accessibilityRole === 'button')) {
    assert.equal(button.props.disabled, true);
    assert.equal(button.props.accessibilityState.busy, true);
    button.props.onPress();
  }
  assert.equal(f.calls.length, 0);
});

test('long histories retain first, last and nearby page jumps with noninteractive gaps', () => {
  const f = fixture({ currentPage: 50, totalPages: 100 });
  assert.match(textOf(f.view.output), /Page 50 of 100/);
  for (const page of [1, 49, 50, 51, 100]) assert.ok(f.button(`Page ${page}`));
  f.button('Page 100').props.onPress();
  assert.deepEqual(f.calls, [100]);
  const gaps = nodes(f.view.output).filter(node => node.type === 'Text' && textOf(node) === '…');
  assert.equal(gaps.length, 2);
  assert.ok(gaps.every(node => !node.props.onPress && node.props.accessible === false));
});

test('the default pagination presentation and callbacks remain available for other screens', () => {
  const f = fixture({ variant: undefined, currentPage: 2 });
  assert.match(textOf(f.view.output), /Previous/);
  assert.match(textOf(f.view.output), /Next/);
  assert.equal(f.view.output.props.style.backgroundColor, '#FFC342');
  f.button('Next page').props.onPress();
  f.button('Page 4').props.onPress();
  assert.deepEqual(f.calls, [3, 4]);
});
