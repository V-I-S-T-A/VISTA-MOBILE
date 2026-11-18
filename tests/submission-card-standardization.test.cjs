const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = style => Object.assign({}, ...(Array.isArray(style) ? style : [style]));

test('submission mini-card standardization: compact dimensions, typography, subtle priority, and status badge', () => {
  for (const width of [320, 360]) {
    for (const fontScale of [1, 1.5]) {
      const h = createHarness();
      h.native.useWindowDimensions = () => ({ width, height: 750, fontScale });
      const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
      const { radii, type, colors, notificationLayout } = h.load('src/theme/tokens.js');

      assert.equal(radii.listCard, 20, 'List cards use the shared soft-rounded radius');
      assert.equal(type.notificationTitle.fontSize, 14, 'Title matches notification card font size');
      assert.equal(type.notificationTitle.lineHeight, 19, 'Title matches notification card line height');
      assert.equal(type.listOrg.fontSize, 12, 'Org font size approx 10.5-11sp');
      assert.equal(type.listOrg.fontFamily, 'DMSans_400Regular');
      assert.equal(type.listDate.fontSize, 11, 'Date font size approx 10sp');
      assert.equal(type.listDate.fontFamily, 'DMSans_400Regular');

      const longTitle = 'Extremely Long Annual Student Activity Request and Grant Clearance Form for 2026';
      const longOrg = 'Supreme Student Council Executive Committee and Central Directorate';
      const submission = {
        submission_id: 'sub-std-1',
        title: longTitle,
        org_name: longOrg,
        org_image_url: 'https://example.test/org.webp',
        status: 'under_review',
        priority_escalation: true,
        submitted_at: '2026-10-31T08:30:00Z',
      };

      let clicked = 0;
      const tree = h.instance(Card, { submission, onPress: () => clicked++ }).output;
      const style = flat(tree.props.style);

      // Card geometry & borders (aligned with StudentNotificationListItem)
      assert.equal(style.backgroundColor, colors.listSurface, 'Neutral surface matching submission list cards');
      assert.equal(style.borderColor, colors.border, 'Shared neutral border for priority and ordinary cards');
      assert.equal(style.borderWidth, 1);
      assert.equal(style.paddingHorizontal, notificationLayout.paddingHorizontal, 'Horizontal padding matches notification card');
      assert.equal(style.paddingVertical, notificationLayout.paddingVertical, 'Vertical padding matches notification card');
      assert.equal(style.borderRadius, notificationLayout.radius, 'Radius matches notification card');
      assert.equal(style.marginBottom, notificationLayout.gap, 'Card gap matches notification card');
      assert.equal(style.gap, 10, 'Gap matches notification card');

      // Avatar
      const avatar = nodes(tree).find(n => n.type?.name === 'UserAvatar');
      assert.ok(avatar, 'Avatar should exist');
      assert.equal(avatar.props.size, 30, 'Avatar diameter approx 30dp');

      // Row 1: Document title (single line, bold, navy — matching notification card)
      const titleNode = nodes(tree).find(n => n.type === 'Text' && textOf(n) === longTitle);
      assert.ok(titleNode, 'Title must exist');
      assert.equal(titleNode.props.numberOfLines, 1, 'Title MUST be exactly ONE line');
      assert.equal(titleNode.props.ellipsizeMode, 'tail');
      assert.equal(titleNode.props.style.fontFamily, type.bold, 'Bold title matching notification card');
      assert.equal(titleNode.props.style.color, '#142B52', 'Dark navy color token');
      assert.equal(titleNode.props.style.includeFontPadding, false);

      // Row 2: Organization name (single line, regular, muted) & Dot Status Badge
      const orgNode = nodes(tree).find(n => n.type === 'Text' && textOf(n) === longOrg);
      assert.ok(orgNode, 'Org name must exist');
      assert.equal(orgNode.props.numberOfLines, 1, 'Org name MUST be exactly ONE line');
      assert.equal(orgNode.props.ellipsizeMode, 'tail');
      assert.equal(orgNode.props.style.color, colors.muted);
      assert.equal(orgNode.props.style.includeFontPadding, false);

      const statusBadge = nodes(tree).find(n => n.type?.name === 'SubmissionStatusBadge');
      assert.ok(statusBadge, 'Status badge must exist on Row 2');
      assert.equal(statusBadge.props.size, 'mini');
      assert.equal(statusBadge.props.variant, 'dot');
      const badgeTree = h.instance(statusBadge.type, statusBadge.props).output;
      const badgeStyle = flat(badgeTree.props.style);
      assert.equal(badgeStyle.backgroundColor, 'transparent', 'Dot status badge has no pill background');
      const dot = badgeTree.props.children[0];
      assert.equal(flat(dot.props.style).width, 6);
      assert.equal(flat(dot.props.style).height, 6);
      const labelNode = badgeTree.props.children[1];
      assert.equal(flat(labelNode.props.style).fontFamily, type.bold);
      assert.equal(flat(labelNode.props.style).color, '#1D4ED8');

      // Row 3: Submission date & Priority pill & Chevron
      const dateNode = nodes(tree).find(n => n.type === 'Text' && textOf(n).includes('2026'));
      assert.ok(dateNode, 'Date text must exist');
      assert.equal(dateNode.props.numberOfLines, 1);
      assert.equal(dateNode.props.ellipsizeMode, 'tail');
      assert.equal(dateNode.props.style.includeFontPadding, false);

      const priorityNode = nodes(tree).find(n => n.type === 'Text' && textOf(n) === 'Priority');
      assert.ok(priorityNode, 'Subtle priority label must exist');
      assert.equal(priorityNode.props.style.fontFamily, type.bold, 'Bold priority label');
      assert.equal(priorityNode.props.style.color, colors.priorityText, 'Priority uses purple');
      assert.equal(priorityNode.props.style.fontSize, type.meta.fontSize, 'Readable priority metadata');
      assert.equal(priorityNode.props.style.includeFontPadding, false);

      assert.ok(!nodes(tree).some(n => n.props?.name === 'chevron-right'), 'Chevron navigation icon must be removed');
      assert.ok(!nodes(tree).some(n => n.props?.name === 'home'), 'Home/org icon must be removed');
      assert.ok(!nodes(tree).some(n => n.props?.name === 'calendar'), 'Calendar icon must be removed');

      // Accessibility & click
      assert.ok(tree.props.accessibilityLabel.includes(longTitle));
      assert.ok(tree.props.accessibilityLabel.includes(longOrg));
      tree.props.onPress();
      assert.equal(clicked, 1);
    }
  }
});

test('submission mini-card renders across all canonical statuses without layout distortion', () => {
  const h = createHarness();
  const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
  const statuses = ['pending', 'under_review', 'approved', 'rejected', 'resubmission_required'];

  for (const status of statuses) {
    const item = {
      submission_id: `sub-${status}`,
      title: `Document in ${status}`,
      org_name: 'Test Org',
      status,
      submitted_at: '2026-10-31T08:30:00Z',
    };
    const tree = h.instance(Card, { submission: item }).output;
    const badge = nodes(tree).find(n => n.type?.name === 'SubmissionStatusBadge');
    assert.ok(badge, `Status badge for ${status} must render`);
    assert.equal(badge.props.status, status);
  }
});
