const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

test('purple priority accents and labels preserve saved statuses and card navigation', () => {
  const h = createHarness(), { colors, cardTones } = h.load('src/theme/tokens.js');
  const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
  let opened = 0;
  const submission = { submission_id: 'fixture', title: 'Priority fixture', status: 'approved', priority_escalation: true };
  const card = h.instance(Card, { submission, onPress: () => opened++ });
  const label = nodes(card.output).find(n => n.type === 'Text' && textOf(n) === 'Priority');
  assert.equal(label.props.style.color, '#6D28D9');
  assert.ok(nodes(card.output).some(n => Array.isArray(n.props?.style) && n.props.style.some(style => style?.backgroundColor === colors.priorityText)));
  assert.equal(cardTones.priority.accent, colors.priorityText);
  assert.equal(nodes(card.output).find(n => n.type?.name === 'SubmissionStatusBadge').props.status, 'approved');
  card.output.props.onPress(); assert.equal(opened, 1);
  card.render({ submission: { ...submission, priority_escalation: false }, onPress: () => opened++ });
  assert.ok(!nodes(card.output).some(n => n.type === 'Text' && textOf(n) === 'Priority'));
  assert.ok(nodes(card.output).some(n => Array.isArray(n.props?.style) && n.props.style.some(style => style?.backgroundColor === cardTones.approved.accent)));
});

test('priority notifications use purple without changing unread state, tap callbacks or rejected status', () => {
  const h = createHarness(), { colors } = h.load('src/theme/tokens.js');
  const { default: Card, getStatus } = h.load('src/components/students/StudentNotificationListItem.jsx');
  const status = getStatus('rejected', 'submission_priority_changed');
  assert.equal(status.label, 'Priority'); assert.equal(status.color, colors.priorityText); assert.equal(status.background, colors.prioritySurface);
  assert.equal(getStatus('rejected').color, colors.danger);
  let tapped = 0;
  const item = h.instance(Card, { notification: { is_priority: true, is_read: false, submission_status: 'rejected' }, onPress: () => tapped++ });
  assert.equal(nodes(item.output).find(n => n.props?.accessibilityLabel === 'Unread').props.style.backgroundColor, colors.priorityText);
  item.output.props.onPress(); assert.equal(tapped, 1);
  item.render({ notification: { is_priority: true, is_read: true } });
  assert.ok(!nodes(item.output).some(n => n.props?.accessibilityLabel === 'Unread'));
});

test('the bottom connection notice uses the approved navy surface and readable text independent of priority colors', () => {
  const h = createHarness({ '../../hooks/useConnectivity': { __esModule: true, default: () => false }, '../../lib/networkRuntime': {} });
  const banner = h.instance(h.load('src/components/common/OfflineBanner.jsx').default).output;
  const { colors } = h.load('src/theme/tokens.js');
  assert.equal(banner.props.style.position, 'absolute');
  assert.ok(banner.props.style.bottom > 0);
  const warning = nodes(banner).find(n => n.props?.accessibilityLiveRegion === 'polite');
  assert.equal(warning.props.style.backgroundColor, colors.navy);
  assert.equal(nodes(warning).find(n => n.type === 'Text').props.style.color, colors.onBrand);
  assert.ok(nodes(warning).some(n => n.props?.accessibilityLabel === 'Dismiss connection notice'));
});
