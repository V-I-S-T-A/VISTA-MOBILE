const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const byLabel = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label || node.props?.label === label);
const modal = tree => nodes(tree).find(node => node.type?.name === 'AppModal' && node.props.visible);
const flat = style => Object.assign({}, ...[style].flat());
function fixture(staff = false) {
  const h = createHarness();
  let sent = 0;
  const target = { name: 'OSA Staff', log: { log_id: 'review' } };
  const conversation = { target, draft: '', link: '', sending: false,
    changeDraft(value) { conversation.draft = value; },
    changeLink(value) { conversation.link = value; },
    send() { sent++; }, cancel() { conversation.target = null; },
  };
  const Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  const view = h.instance(Composer, { conversation, ...(staff ? { onStatus() {} } : {}) });
  return { h, view, conversation, get sent() { return sent; } };
}

test('student has one compact reply row with Link beside Send, and counter in the target header', () => {
  const { view } = fixture();
  const header = nodes(view.output).find(node => node.type === 'View' && node.props.children?.some?.(child => textOf(child) === 'Replying to OSA Staff'));
  assert.ok(header);
  assert.ok(byLabel(header, 'Reply characters: 0 of 50'));
  const row = nodes(view.output).find(node => node.type === 'View' && node.props.children?.some?.(child => Array.isArray(child?.props?.style)) && nodes(node).some(child => child.props?.accessibilityLabel === 'Reply message'));
  assert.ok(byLabel(row, 'Send reply'));
  assert.ok(byLabel(row, 'Add web link'));
  const actions = nodes(view.output).find(node => node.type === 'View' && node.props.children?.[1]?.props?.accessibilityLabel === 'Send reply');
  assert.equal(actions.props.children[0].props.accessibilityLabel, 'Add web link');
  assert.equal(flat(actions.props.style).flexDirection, 'row');
});

test('over-limit reply paste is retained, announced in a modal, blocked from sending, and recovers after editing', () => {
  const f = fixture();
  const pasted = 'x'.repeat(51);
  byLabel(f.view.output, 'Reply message').props.onChangeText(pasted); f.view.render();
  assert.equal(f.conversation.draft, pasted);
  assert.equal(modal(f.view.output).props.visible, true);
  assert.match(textOf(modal(f.view.output)), /Shorten your reply/);
  assert.match(textOf(modal(f.view.output)), /up to 50 characters/);
  assert.equal(byLabel(f.view.output, 'Send reply').props.disabled, true);
  byLabel(f.view.output, 'Send reply').props.onPress(); assert.equal(f.sent, 0);
  byLabel(f.view.output, 'Edit reply').props.onPress(); f.view.render();
  assert.equal(modal(f.view.output), undefined);
  byLabel(f.view.output, 'Reply message').props.onChangeText('x'.repeat(50)); f.view.render();
  assert.equal(byLabel(f.view.output, 'Send reply').props.disabled, false);
  byLabel(f.view.output, 'Send reply').props.onPress(); assert.equal(f.sent, 1);
});

test('Unicode characters count correctly; continuing to edit an over-limit message does not reopen the modal', () => {
  const f = fixture();
  byLabel(f.view.output, 'Reply message').props.onChangeText('😀'.repeat(50)); f.view.render();
  assert.equal(modal(f.view.output), undefined);
  assert.ok(byLabel(f.view.output, 'Reply characters: 50 of 50'));
  byLabel(f.view.output, 'Reply message').props.onChangeText('😀'.repeat(51)); f.view.render();
  byLabel(f.view.output, 'Edit reply').props.onPress(); f.view.render();
  byLabel(f.view.output, 'Reply message').props.onChangeText('😀'.repeat(52)); f.view.render();
  assert.equal(modal(f.view.output), undefined);
  assert.equal(byLabel(f.view.output, 'Send reply').props.disabled, true);
});

test('long or invalid links explain recovery without truncating the link or posting', () => {
  const f = fixture();
  byLabel(f.view.output, 'Add web link').props.onPress(); f.view.render();
  const link = 'https://example.test/' + 'a'.repeat(151);
  byLabel(f.view.output, 'Web link').props.onChangeText(link); f.view.render();
  assert.equal(f.conversation.link, link);
  assert.match(textOf(modal(f.view.output)), /up to 150 characters/);
  assert.equal(byLabel(f.view.output, 'Send reply').props.disabled, true);
  byLabel(f.view.output, 'Edit link').props.onPress(); f.view.render();
  byLabel(f.view.output, 'Web link').props.onChangeText('www.example.test'); f.view.render();
  byLabel(f.view.output, 'Send reply').props.onPress(); f.view.render();
  assert.match(textOf(modal(f.view.output)), /Check your link/); assert.equal(f.sent, 0);
  byLabel(f.view.output, 'Edit link').props.onPress(); f.view.render();
  byLabel(f.view.output, 'Web link').props.onChangeText('https://example.test'); f.view.render();
  byLabel(f.view.output, 'Send reply').props.onPress(); assert.equal(f.sent, 1);
});

test('staff replies use the same inline send and limit modal, preserving the independent new-update action', () => {
  const f = fixture(true);
  assert.equal(byLabel(f.view.output, 'Add web link'), undefined);
  assert.ok(byLabel(f.view.output, 'Write a new submission update'));
  byLabel(f.view.output, 'Reply message').props.onChangeText('x'.repeat(51)); f.view.render();
  assert.match(textOf(modal(f.view.output)), /Shorten your reply/);
  assert.equal(f.sent, 0);
});

test('reply validation returns input focus after exit and never restores a superseded target', () => {
  const f = fixture(); let focus = 0;
  byLabel(f.view.output, 'Reply message').props.ref.current = { focus() { focus++; }, blur() {} };
  byLabel(f.view.output, 'Reply message').props.onChangeText('x'.repeat(51)); f.view.render();
  byLabel(f.view.output, 'Edit reply').props.onPress(); f.view.render();
  assert.equal(focus, 0);
  const hiddenModal = nodes(f.view.output).find(node => node.type?.name === 'AppModal');
  hiddenModal.props.onDismiss(); assert.equal(focus, 1);
  hiddenModal.props.onDismiss(); assert.equal(focus, 1);
  byLabel(f.view.output, 'Reply message').props.onChangeText('ok'); f.view.render();
  byLabel(f.view.output, 'Reply message').props.onChangeText('x'.repeat(51)); f.view.render();
  byLabel(f.view.output, 'Edit reply').props.onPress(); f.view.render();
  f.conversation.target = null; f.view.render();
  hiddenModal.props.onDismiss(); assert.equal(focus, 1);
});
