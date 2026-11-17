const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = style => Object.assign({}, ...(Array.isArray(style) ? style : [style]));

test('notifications redesign: header, unread badge, filters, and section title', () => {
  for (const role of ['staff', 'student']) {
    const notifications = [
      { notification_id: 'n1', submission_id: 'sub-1', submission_title: 'SARF Document', message: 'SARF is now approved', is_read: false, is_priority: false, submission_status: 'approved', created_at: new Date().toISOString() },
      { notification_id: 'n2', submission_id: 'sub-2', submission_title: 'Urgent Budget Request', message: 'Budget requires immediate review', is_read: true, is_priority: true, submission_status: 'under_review', created_at: new Date().toISOString() },
    ];
    const h = createHarness({
      '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
      '../../context/AuthContext': { useAuth: () => ({ role }) },
      '../../hooks/useStudentNotifications': {
        useNotifications: () => ({ data: { results: notifications, unread_count: 1 } }),
        useMarkNotificationRead: () => ({ mutateAsync: async () => {} }),
      },
      '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    });
    const Screen = h.load('src/screens/student/StudentNotificationsScreen.jsx').default;
    const tree = h.instance(Screen, { navigation: {} }).output;
    const list = nodes(tree).find(n => n.props?.renderItem);
    const headerNodes = nodes(list.props.ListHeaderComponent);
    assert.equal(list.props.stickyHeaderIndices, undefined, 'Notification headings and filters scroll with notifications');

    // 1. Dashboard Top Header Row
    const accountHeader = nodes(tree).find(n => n.type?.name === 'AccountHeader');
    assert.ok(accountHeader, 'AccountHeader should be fixed above the refreshing list');
    assert.ok(!headerNodes.some(n => n.type?.name === 'AccountHeader'));
    assert.equal(accountHeader.props.profileRoute, role === 'student' ? 'StudentProfile' : 'StaffProfile');

    const heading = headerNodes.find(n => n.props?.accessibilityRole === 'header' && textOf(n) === 'Notifications');
    assert.ok(heading, 'Notifications header should exist');
    assert.equal(heading.props.style.fontSize, 20, 'Header font size should be 20sp');
    assert.equal(heading.props.style.fontFamily, 'DMSans_600SemiBold');
    assert.equal(heading.props.style.color, '#142B52', 'Header color should be dark navy');

    // Unread count badge beside title should be removed
    const headingUnreadBadge = headerNodes.find(n => n.type === 'Text' && textOf(n).includes('unread') && n.props?.accessibilityLabel?.includes('unread notifications'));
    assert.equal(headingUnreadBadge, undefined, 'Redundant unread count pill beside title must be removed');

    // Subtitle
    const subtitle = headerNodes.find(n => n.type === 'Text' && textOf(n).includes('Submission and Drive updates from the past 30 days'));
    assert.ok(subtitle, 'Subtitle should be present');
    assert.equal(subtitle.props.style.fontSize, 14, 'Subtitle uses global body font size 13sp');

    // 2. Filter Tabs
    const tabs = headerNodes.find(n => n.type?.name === 'NotificationTabs');
    assert.ok(tabs, 'NotificationTabs component should be present');

    // 3. Section header and Mark all as read action
    const sectionHeader = headerNodes.find(n => n.props?.accessibilityRole === 'header' && textOf(n) === 'Recent Notifications');
    assert.ok(sectionHeader, 'Recent Notifications section header should exist');
    assert.equal(sectionHeader.props.style.fontSize, 12, 'Section header font size should be 12sp matching Recent Submissions');
    assert.equal(sectionHeader.props.style.fontFamily, 'DMSans_600SemiBold');
    assert.equal(sectionHeader.props.style.color, '#142B52');

    const markAllBtn = headerNodes.find(n => n.props?.accessibilityRole === 'button' && textOf(n) === 'Mark all as read');
    assert.ok(markAllBtn, 'Mark all as read button should be present');
    const markAllText = nodes(markAllBtn).find(n => n.type === 'Text' && textOf(n) === 'Mark all as read');
    assert.equal(markAllText.props.style.fontSize, 12, 'Mark all as read uses readable metadata typography');

    // 4. Role-specific Bottom Navigation
    if (role === 'student') {
      const nav = nodes(tree).find(n => n.type?.name === 'StudentBottomNav');
      assert.ok(nav, 'StudentBottomNav should be present for student role');
      assert.equal(nav.props.activeTab, 'notifications');
    } else {
      const nav = nodes(tree).find(n => n.type?.name === 'StaffBottomNav');
      assert.ok(nav, 'StaffBottomNav should be present for staff role');
      assert.notEqual(nav.props.activeTab, 'notifications');
    }
  }
});

test('notifications filter tabs: compact pill dimensions, selected state, counts', () => {
  const h = createHarness();
  const Tabs = h.load('src/components/students/NotificationTabs.jsx').default;
  const items = [
    { notification_id: '1', is_read: false, is_priority: false, created_at: new Date().toISOString() },
    { notification_id: '2', is_read: true, is_priority: true, created_at: new Date().toISOString() },
    { notification_id: '3', is_read: false, is_priority: true, created_at: new Date().toISOString() },
  ];
  let selectedTab = 'All';
  const tree = h.instance(Tabs, { value: selectedTab, onChange: t => { selectedTab = t; }, showCounts: true, items }).output;

  const tabButtons = nodes(tree).filter(n => n.props?.accessibilityRole === 'tab');
  assert.equal(tabButtons.length, 3, 'All, Unread, Priority tabs should exist');

  // Verify 'All' tab (selected)
  const allTab = tabButtons[0];
  const allSurface = nodes(allTab).find(n => flat(n.props?.style)?.borderRadius === 999);
  assert.ok(allSurface, 'Tab surface should be pill-shaped');
  assert.equal(flat(allSurface.props.style).minHeight, 32, 'Tab has a compact minimum and can grow with text');
  assert.equal(flat(allSurface.props.style).height, undefined, 'Text must not be clipped by a fixed height');
  assert.equal(flat(allSurface.props.style).paddingHorizontal, 16, 'Tab uses shared horizontal spacing');
  assert.equal(flat(allSurface.props.style).backgroundColor, '#1a59a5', 'Selected filter uses VISTA blue');

  // Verify 'Unread' tab (unselected)
  const unreadTab = tabButtons[1];
  const unreadSurface = nodes(unreadTab).find(n => flat(n.props?.style)?.borderRadius === 999);
  assert.equal(flat(unreadSurface.props.style).backgroundColor, '#E8EFF8', 'Unselected tab uses shared selected surface');

  // Verify counts
  assert.ok(textOf(allTab).includes('3'), 'All count should be 3');
  assert.ok(textOf(unreadTab).includes('2'), 'Unread count should be 2');
});

test('notification card: single-line title and message ellipsis, avatar, priority vs regular, unread dot', () => {
  const h = createHarness();
  const Card = h.load('src/components/students/StudentNotificationListItem.jsx').default;

  const longTitle = 'Student Activity Request Form (SARF) for Annual Leadership Summit 2026 with Extremely Detailed Project Scope';
  const longMessage = 'The Student Activity Request Form (SARF) has been updated by the OSA Review Board and is now approved with conditional facility requirements.';

  // Test 1: Priority unread notification with long text
  const priorityItem = {
    notification_id: 'p1',
    submission_id: 'sub-long',
    submission_title: longTitle,
    message: longMessage,
    is_read: false,
    is_priority: true,
    actor_image_url: 'https://example.test/actor.webp',
    submission_status: 'under_review',
    created_at: '2026-11-01T12:00:00Z',
  };

  const card1 = h.instance(Card, { notification: priorityItem }).output;
  const cardStyle1 = flat(card1.props.style);

  // Card dimensions & surface
  assert.equal(cardStyle1.borderRadius, 20, 'Card uses the shared soft-rounded list radius');
  assert.equal(cardStyle1.paddingHorizontal, 12, 'Card horizontal padding approx 10-12dp');
  assert.equal(cardStyle1.paddingVertical, 8, 'Card vertical padding approx 7-8dp');
  assert.equal(cardStyle1.backgroundColor, '#FFFFFF', 'Cards must use clean white surface');
  assert.equal(cardStyle1.borderColor, '#E1E8F0', 'Both regular and priority use subtle neutral 1dp border (no yellow borders)');

  // Avatar
  const avatar = nodes(card1).find(n => n.type?.name === 'UserAvatar');
  assert.ok(avatar, 'Avatar should exist');
  assert.equal(avatar.props.size, 30, 'Avatar diameter should be approx 28-32dp');
  assert.equal(avatar.props.uri, 'https://example.test/actor.webp');

  // Mandatory Single-line Title with Ellipsis
  const titleNode = nodes(card1).find(n => n.type === 'Text' && textOf(n) === longTitle);
  assert.ok(titleNode, 'Title node should exist');
  assert.equal(titleNode.props.numberOfLines, 1, 'Title MUST be exactly ONE line');
  assert.equal(titleNode.props.ellipsizeMode, 'tail', 'Title MUST use tail ellipsis');
  assert.equal(titleNode.props.style.color, '#142B52', 'Title should be dark navy');
  assert.equal(titleNode.props.style.fontFamily, 'DMSans_700Bold', 'Unread title should be bold');

  // Mandatory Single-line Message with Ellipsis
  const messageNode = nodes(card1).find(n => n.type === 'Text' && textOf(n) === longMessage);
  assert.ok(messageNode, 'Message node should exist');
  assert.equal(messageNode.props.numberOfLines, 1, 'Message MUST be exactly ONE line');
  assert.equal(messageNode.props.ellipsizeMode, 'tail', 'Message MUST use tail ellipsis');
  assert.equal(messageNode.props.style.color, '#334155', 'Unread message should be darker slate');
  assert.equal(messageNode.props.style.fontFamily, 'DMSans_500Medium', 'Unread message should be medium weight');

  // Unread Dot
  const unreadDot = nodes(card1).find(n => n.props?.accessibilityLabel === 'Unread');
  assert.ok(unreadDot, 'Unread dot must be visible when notification is unread');
  assert.equal(flat(unreadDot.props.style).width, 6, 'Unread dot should be approx 5-6dp');
  assert.equal(flat(unreadDot.props.style).height, 6);
  assert.equal(flat(unreadDot.props.style).backgroundColor, '#6D28D9', 'Priority unread notification uses purple');

  // Status dot & bold label in Metadata row
  const statusBadge = nodes(card1).find(n => flat(n.props?.style)?.backgroundColor === 'transparent' && textOf(n).includes('Under Review'));
  assert.ok(statusBadge, 'Dot status indicator should display canonical status without pill background');
  assert.equal(flat(statusBadge.props.children[0].props.style).width, 6);
  assert.equal(flat(statusBadge.props.children[1].props.style).fontFamily, 'DMSans_700Bold');

  // Full accessibility label
  assert.ok(card1.props.accessibilityLabel.includes(longTitle), 'Screen reader label retains full title');
  assert.ok(card1.props.accessibilityLabel.includes(longMessage), 'Screen reader label retains full message');

  // Test 2: Regular read notification
  const regularReadItem = {
    notification_id: 'r1',
    submission_title: 'Short Title',
    message: 'Short message.',
    is_read: true,
    is_priority: false,
    submission_status: 'approved',
    created_at: '2026-11-01T12:00:00Z',
  };

  const card2 = h.instance(Card, { notification: regularReadItem }).output;
  const cardStyle2 = flat(card2.props.style);

  assert.equal(cardStyle2.backgroundColor, '#FFFFFF', 'Regular card should have white surface');
  assert.equal(cardStyle2.borderColor, '#E1E8F0', 'Regular card should have neutral border');

  // Read notification styling: calmer typography
  const readTitle = nodes(card2).find(n => n.type === 'Text' && textOf(n) === 'Short Title');
  assert.equal(readTitle.props.style.color, '#475569', 'Read title should be softer dark slate');
  assert.equal(readTitle.props.style.fontFamily, 'DMSans_500Medium', 'Read title should be medium weight');

  const readMessage = nodes(card2).find(n => n.type === 'Text' && textOf(n) === 'Short message.');
  assert.equal(readMessage.props.style.color, '#64748B', 'Read message should be muted blue-gray');
  assert.equal(readMessage.props.style.fontFamily, 'DMSans_400Regular', 'Read message should be regular weight');

  // Read notification must NOT display unread dot
  const readDot = nodes(card2).find(n => n.props?.accessibilityLabel === 'Unread');
  assert.equal(readDot, undefined, 'Read notification must NOT display unread dot');
});

test('notification detail sheet displays full untruncated message and supports submission navigation', () => {
  const h = createHarness();
  const Sheet = h.load('src/components/students/NotificationDetailSheet.jsx').default;
  const message = 'A very long message '.repeat(20);
  const notification = {
    submission_id: 'sub-42',
    submission_title: 'Detailed Title',
    message,
    actor_name: 'OSA Reviewer',
    created_at: new Date().toISOString(),
    submission_status: 'approved',
  };
  let opened = 0;
  const tree = h.instance(Sheet, { notification, onClose() {}, onOpenSubmission: () => opened++ }).output;

  const fullText = nodes(tree).find(n => n.type === 'Text' && textOf(n) === message);
  assert.ok(fullText, 'Full message must exist in detail sheet');
  assert.equal(fullText.props.numberOfLines, undefined, 'Detail message must NOT be truncated');
  assert.equal(fullText.props.selectable, true, 'Detail message must be selectable');

  const viewBtn = nodes(tree).find(n => n.props?.label === 'View submission');
  assert.ok(viewBtn);
  viewBtn.props.onPress();
  assert.equal(opened, 1, 'View submission button should trigger navigation callback');
});

test('compact notification rows: 3-line structure, dimensions, subtle borders, no 4th-line wrapping', () => {
  for (const width of [320, 360]) {
    const h = createHarness();
    h.native.useWindowDimensions = () => ({ width, height: 750, fontScale: 1 });
    const Card = h.load('src/components/students/StudentNotificationListItem.jsx').default;
    const { notificationLayout, type } = h.load('src/theme/tokens.js');

    assert.equal(notificationLayout.avatar, 30, 'Avatar should be 28-32dp');
    assert.equal(notificationLayout.paddingHorizontal, 12, 'Padding horizontal should be 10-12dp');
    assert.equal(notificationLayout.paddingVertical, 8, 'Padding vertical should be 7-8dp');
    assert.equal(notificationLayout.radius, 20, 'Notification radius matches submission rows');
    assert.equal(notificationLayout.gap, 8, 'Gap should be 4-6dp');
    assert.equal(notificationLayout.unread, 6, 'Unread dot should be 5-6dp');

    assert.equal(type.notificationTitle.fontSize, 14, 'Title should be 12-13sp');
    assert.equal(type.notificationTitle.fontFamily, 'DMSans_500Medium');
    assert.equal(type.notificationPreview.fontSize, 12, 'Message should be 11-12sp');
    assert.equal(type.notificationPreview.fontFamily, 'DMSans_400Regular');

    const item = {
      notification_id: 'test-1',
      submission_title: 'Title that fits Line 1',
      message: 'Message that fits Line 2',
      submission_status: 'resubmission_required',
      is_read: false,
      is_priority: true,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    };

    const tree = h.instance(Card, { notification: item }).output;
    const style = flat(tree.props.style);

    // Neutral border on priority
    assert.equal(style.borderColor, '#E1E8F0', 'Borders must be subtle neutral, no bright yellow');
    assert.equal(style.backgroundColor, '#FFFFFF', 'All notification cards use clean white surface');

    // Avatar diameter
    const avatar = nodes(tree).find(n => n.type?.name === 'UserAvatar');
    assert.equal(avatar.props.size, 30);

    // Line 1: Title single line
    const title = nodes(tree).find(n => n.type === 'Text' && textOf(n) === item.submission_title);
    assert.equal(title.props.numberOfLines, 1);
    assert.equal(title.props.ellipsizeMode, 'tail');

    // Line 2: Message single line
    const msg = nodes(tree).find(n => n.type === 'Text' && textOf(n) === item.message);
    assert.equal(msg.props.numberOfLines, 1);
    assert.equal(msg.props.ellipsizeMode, 'tail');

    // Line 3: Metadata row
    const badge = nodes(tree).find(n => flat(n.props?.style)?.backgroundColor === 'transparent' && textOf(n).includes('Resubmission Required'));
    assert.ok(badge, 'Dot status indicator exists on Line 3');
    assert.equal(flat(badge.props.children[1].props.style).fontFamily, 'DMSans_700Bold');

    const timestamp = nodes(tree).find(n => n.type === 'Text' && textOf(n) === '2h ago');
    assert.ok(timestamp, 'Timestamp uses compact relative formatter on Line 3');
    assert.equal(timestamp.props.numberOfLines, 1);
    assert.equal(timestamp.props.ellipsizeMode, 'tail');
  }
});

test('notification card white surface and strong unread vs calm read typography across states', () => {
  const h = createHarness();
  const Card = h.load('src/components/students/StudentNotificationListItem.jsx').default;

  const unreadNotification = {
    notification_id: 'notif-unread',
    submission_id: 'sub-unread',
    submission_title: 'Unread Submission Action Required',
    message: 'Your activity request needs immediate review.',
    is_read: false,
    is_priority: true,
    submission_status: 'resubmission_required',
    created_at: new Date().toISOString(),
  };

  const readNotification = {
    notification_id: 'notif-read',
    submission_id: 'sub-read',
    submission_title: 'Read Submission Notice',
    message: 'Your activity request has been viewed.',
    is_read: true,
    is_priority: false,
    submission_status: 'approved',
    created_at: new Date().toISOString(),
  };

  const unreadTree = h.instance(Card, { notification: unreadNotification }).output;
  const readTree = h.instance(Card, { notification: readNotification }).output;

  const unreadStyle = flat(unreadTree.props.style);
  const readStyle = flat(readTree.props.style);

  // 1. Clean white backgrounds for both (no yellow/tinted surfaces)
  assert.equal(unreadStyle.backgroundColor, '#FFFFFF', 'Unread card must have white background');
  assert.equal(readStyle.backgroundColor, '#FFFFFF', 'Read card must have white background');
  assert.equal(unreadStyle.borderColor, '#E1E8F0', 'Unread card has subtle neutral border');
  assert.equal(readStyle.borderColor, '#E1E8F0', 'Read card has subtle neutral border');

  // 2. Unread typography is strongly emphasized
  const unreadTitle = nodes(unreadTree).find(n => n.type === 'Text' && textOf(n) === unreadNotification.submission_title);
  const unreadPreview = nodes(unreadTree).find(n => n.type === 'Text' && textOf(n) === unreadNotification.message);
  assert.equal(unreadTitle.props.style.fontFamily, 'DMSans_700Bold', 'Unread title must be bold');
  assert.equal(unreadTitle.props.style.color, '#142B52', 'Unread title must be dark navy');
  assert.equal(unreadPreview.props.style.fontFamily, 'DMSans_500Medium', 'Unread preview must be medium weight');
  assert.equal(unreadPreview.props.style.color, '#334155', 'Unread preview must be darker slate');

  // 3. Read typography is calmer and muted
  const readTitle = nodes(readTree).find(n => n.type === 'Text' && textOf(n) === readNotification.submission_title);
  const readPreview = nodes(readTree).find(n => n.type === 'Text' && textOf(n) === readNotification.message);
  assert.equal(readTitle.props.style.fontFamily, 'DMSans_500Medium', 'Read title must be medium weight');
  assert.equal(readTitle.props.style.color, '#475569', 'Read title must be softer slate');
  assert.equal(readPreview.props.style.fontFamily, 'DMSans_400Regular', 'Read preview must be regular weight');
  assert.equal(readPreview.props.style.color, '#64748B', 'Read preview must be muted blue-gray');

  // 4. Stable layout geometry: font sizes and line heights are identical between states (no height jumping)
  assert.equal(unreadTitle.props.style.fontSize, readTitle.props.style.fontSize);
  assert.equal(unreadTitle.props.style.lineHeight, readTitle.props.style.lineHeight);
  assert.equal(unreadPreview.props.style.fontSize, readPreview.props.style.fontSize);
  assert.equal(unreadPreview.props.style.lineHeight, readPreview.props.style.lineHeight);

  // 5. Unread indicator dot presence and color
  const unreadDot = nodes(unreadTree).find(n => n.props?.accessibilityLabel === 'Unread');
  const readDot = nodes(readTree).find(n => n.props?.accessibilityLabel === 'Unread');
  assert.ok(unreadDot, 'Unread card must display unread indicator dot');
  assert.equal(flat(unreadDot.props.style).backgroundColor, '#6D28D9', 'Priority unread card uses purple');
  assert.equal(readDot, undefined, 'Read card must not display unread indicator dot');
});

test('unread indicator color matrix: normal unread is blue, priority unread is purple, read has no dot', () => {
  const h = createHarness();
  const Card = h.load('src/components/students/StudentNotificationListItem.jsx').default;

  const cases = [
    { label: 'Normal + Unread', item: { is_read: false, is_priority: false, submission_title: 'T1' }, expectedDotColor: '#1A59A5' },
    { label: 'Priority flag + Unread', item: { is_read: false, is_priority: true, submission_title: 'T2' }, expectedDotColor: '#6D28D9' },
    { label: 'Priority type + Unread', item: { is_read: false, type: 'submission_priority_changed', submission_title: 'T3' }, expectedDotColor: '#6D28D9' },
    { label: 'Normal + Read', item: { is_read: true, is_priority: false, submission_title: 'T4' }, expectedDotColor: null },
    { label: 'Priority flag + Read', item: { is_read: true, is_priority: true, submission_title: 'T5' }, expectedDotColor: null },
    { label: 'Priority type + Read', item: { is_read: true, type: 'submission_priority_changed', submission_title: 'T6' }, expectedDotColor: null },
  ];

  for (const { label, item, expectedDotColor } of cases) {
    const card = h.instance(Card, { notification: item }).output;
    const dot = nodes(card).find(n => n.props?.accessibilityLabel === 'Unread');
    if (expectedDotColor) {
      assert.ok(dot, `${label} should display unread dot`);
      assert.equal(flat(dot.props.style).backgroundColor, expectedDotColor, `${label} dot color should be ${expectedDotColor}`);
      assert.equal(flat(dot.props.style).width, 6, `${label} dot width should be 6dp`);
      assert.equal(flat(dot.props.style).height, 6, `${label} dot height should be 6dp`);
    } else {
      assert.equal(dot, undefined, `${label} should NOT display unread dot`);
    }
    // Background card must remain clean white (#FFFFFF) in all cases
    assert.equal(flat(card.props.style).backgroundColor, '#FFFFFF', `${label} card background must stay #FFFFFF`);
  }
});
