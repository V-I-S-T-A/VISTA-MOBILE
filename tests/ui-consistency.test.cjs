const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flatten = value => Object.assign({}, ...[value].flat(Infinity).filter(Boolean));
const byLabel = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label);

test('student navbar keeps Home and Tracker callbacks and opens the existing all-notifications route', () => {
  const calls = [];
  const h = createHarness({ '@react-navigation/native': { useNavigation: () => ({ navigate: route => calls.push(route) }) } });
  const Nav = h.load('src/components/students/StudentBottomNav.jsx').default;
  const bar = h.instance(Nav, { activeTab: 'notifications', onHomePress: () => calls.push('home'), onTrackerPress: () => calls.push('tracker') }).output;
  h.native.Animated.Value.prototype.interpolate = function () { return this.value; };
  const tree = nodes(bar).filter(n => n.type?.name === 'BottomNavItem').map(n => h.instance(n.type, n.props).output);
  byLabel(tree, 'Home').props.onPress(); byLabel(tree, 'Review tracker').props.onPress(); byLabel(tree, 'All notifications').props.onPress();
  assert.deepEqual(calls, ['home', 'tracker', 'StudentNotifications']);
  assert.equal(byLabel(tree, 'All notifications').props.accessibilityState.selected, true);
});

test('comment replies omit repeated identity panels and preserve the exact reply target', () => {
  const h = createHarness({ '@tanstack/react-query': {}, '../../services/reviewLogsService': { reviewLogsService: {} } });
  const { ThreadedReply, relativeTimestamp } = h.load('src/components/submissions/ConversationEntry.jsx');
  const reply = { reply_id: 'child', parent_reply: 'parent', author_name: 'Student Name', author_role: 'student', reply_to_name: 'Reviewer', created_at: new Date().toISOString(), message: 'Message https://example.test' };
  let target;
  const row = h.instance(ThreadedReply, { reply, canReply: true, onReply: value => { target = value; } });
  assert.ok(!textOf(row.output).includes('Replying to'));
  assert.ok(!nodes(row.output).some(n => typeof n.type === 'function' && n.type.name === 'Author'));
  const action = nodes(row.output).find(n => typeof n.type === 'function' && n.type.name === 'ReplyButton');
  action.props.onPress(); assert.equal(target, reply);
  row.render({ reply, canReply: false });
  assert.ok(!nodes(row.output).some(n => typeof n.type === 'function' && n.type.name === 'ReplyButton'));
  assert.equal(relativeTimestamp('2026-11-01T00:00:00Z', Date.parse('2026-11-01T00:02:00Z')), '2m ago');
  assert.equal(relativeTimestamp(null), 'Date unavailable');
});

test('shared popup windows retain edge-to-edge geometry without sliding the Android window', () => {
  const h = createHarness();
  for (const file of ['AppModal', 'AppBottomSheet']) {
    const Component = h.load(`src/components/common/${file}.jsx`).default;
    let closed = 0;
    const modal = h.instance(Component, { visible: true, onClose() { closed++; } }).output;
    assert.equal(modal.props.navigationBarTranslucent, true);
    assert.equal(modal.props.statusBarTranslucent, true);
    assert.equal(modal.props.animationType, 'none', 'Motion stays disabled until the native preference resolves');
    modal.props.onRequestClose(); assert.equal(closed, 1);
  }
});

test('notification sheet uses the app overlay and consumes Android Back without navigating away', () => {
  const h = createHarness(); let back, closed = 0, removed = 0, activeListeners = 0;
  h.native.BackHandler.addEventListener = (event, callback) => { back = callback; activeListeners++; return { remove() { removed++; activeListeners--; } }; };
  const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
  const sheet = h.instance(Sheet, { visible: true, portal: true, onClose() { closed++; } });
  assert.equal(sheet.output.type.name, 'OverlayPortal');
  assert.equal(back(), true); assert.equal(closed, 1);
  sheet.render({ visible: false, portal: true });
  assert.ok(sheet.output, 'Keep the sheet mounted through its exit');
  assert.equal(activeListeners, 1, 'Android Back is consumed until the exit finishes');
  assert.equal(back(), true); assert.equal(closed, 1, 'Repeated Back cannot dismiss the underlying page during exit');
  sheet.output.props.children.props.onHidden(); sheet.render();
  assert.equal(sheet.output, null); assert.equal(activeListeners, 0); assert.ok(removed >= 1);
});

test('short and long submission cards use one title line without reserved space, expose full accessible titles and retain navigation', () => {
  const h = createHarness(); const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
  let opened = 0;
  for (const title of ['Test', 'Local Off-Campus Activities Certificate of Completion with a long document identifier']) {
    const row = h.instance(Card, { submission: { title, status: 'resubmission_required', priority_escalation: true, org_name: 'Organization', submitted_at: '2026-10-31' }, compact: true, onPress: () => opened++ }).output;
    assert.equal(flatten(row.props.style).minHeight, undefined);
    const text = nodes(row).find(node => node.type === 'Text' && textOf(node) === title);
    assert.equal(text.props.numberOfLines, 1); assert.equal(flatten(text.props.style).minHeight, undefined); assert.equal(text.props.ellipsizeMode, 'tail');
    assert.equal(textOf(text), title);
    assert.ok(!textOf(row).includes('View details'));
    assert.ok(textOf(row).includes('Priority'));
    assert.ok(!nodes(row).some(n => n.props?.name === 'chevron-right'));
    assert.ok(!nodes(row).some(n => n.props?.showIcon === true));
    assert.ok(row.props.accessibilityLabel.includes(title));
    assert.ok(nodes(row).some(node => typeof node.type === 'function' && node.type.name === 'UserAvatar'));
    row.props.onPress();
  }
  assert.equal(opened, 2);
  const ordinary = h.instance(Card, { submission: { title: 'Test', status: 'approved' } }).output;
  assert.ok(!textOf(ordinary).includes('Priority'));
  assert.ok(!textOf(ordinary).includes('View details'));
});

test('avatar cannot become a rectangle through caller styles and blank/failed sources use the local asset', () => {
  const h = createHarness(), Avatar = h.load('src/components/common/UserAvatar.jsx').default;
  const avatar = h.instance(Avatar, { uri: ' ', size: 40, style: { borderRadius: 0, width: 90 } });
  assert.match(avatar.output.props.source, /default_user.webp/);
  assert.equal(flatten(avatar.output.props.style).width, 40); assert.equal(flatten(avatar.output.props.style).borderRadius, 20);
  avatar.render({ uri: 'https://example.test/photo', size: 40 }); avatar.output.props.onError(); avatar.render();
  assert.match(avatar.output.props.source, /default_user.webp/);
});

test('composer keeps the student link separate from the draft until send and preserves its reply target', () => {
  const h = createHarness(); const Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  let changed, sent = [];
  const target = { name: 'Reviewer', log: { log_id: 'log-a' }, parentId: 'parent-a' };
  const conversation = { target, draft: '', link: '', sending: false, changeLink: value => { conversation.link = value; }, changeDraft: value => { changed = value; }, send: url => { sent.push(url); }, cancel() {} };
  const composer = h.instance(Composer, { conversation });
  assert.equal(byLabel(composer.output, 'Send reply').props.disabled, true);
  assert.equal(flatten(composer.output.props.style).padding, 8);
  byLabel(composer.output, 'Add web link').props.onPress(); composer.render();
  byLabel(composer.output, 'Web link').props.onChangeText('https://example.test/plan');
  conversation.draft = 'Noted'; composer.render();
  assert.equal(changed, undefined); assert.equal(conversation.draft, 'Noted'); assert.equal(conversation.target, target);
  assert.equal(target.parentId, 'parent-a'); assert.equal(target.log.log_id, 'log-a');
  byLabel(composer.output, 'Send reply').props.onPress(); assert.deepEqual(sent, ['https://example.test/plan']);
  conversation.draft = 'x'.repeat(51); composer.render(); assert.equal(byLabel(composer.output, 'Send reply').props.disabled, true);
});

test('link-only reply can send without editing message text and hiding the field retains the link', () => {
  const h = createHarness(), Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  let changed, sent;
  const conversation = { target: { name: 'Staff' }, draft: '', link: '', sending: false, changeLink: value => { conversation.link = value; }, changeDraft: value => { changed = value; }, send: value => { sent = value; } };
  const composer = h.instance(Composer, { conversation });
  byLabel(composer.output, 'Add web link').props.onPress(); composer.render();
  byLabel(composer.output, 'Web link').props.onChangeText('https://example.test/'); composer.render();
  assert.equal(changed, undefined); assert.equal(conversation.draft, '');
  assert.equal(byLabel(composer.output, 'Send reply').props.disabled, false);
  byLabel(composer.output, 'Hide web link field').props.onPress(); composer.render();
  assert.equal(byLabel(composer.output, 'Web link'), undefined);
  byLabel(composer.output, 'Send reply').props.onPress(); assert.equal(sent, 'https://example.test/');
});

test('shared ordinary dialogs retain action callbacks, cancellation, queue ordering and duplicate-action protection', () => {
  const h = createHarness(); const { DialogProvider, AppAlert } = h.load('src/components/common/AppDialog.jsx');
  const host = h.instance(DialogProvider, { children: null }); let confirmed = 0, cancelled = 0;
  AppAlert.alert('Delete entry?', 'Existing confirmation text', [{ text: 'Cancel', style: 'cancel', onPress: () => cancelled++ }, { text: 'Delete', style: 'destructive', onPress: () => confirmed++ }]);
  AppAlert.alert('Next', 'Second message'); host.render();
  const button = nodes(host.output).find(node => node.props?.label === 'Delete');
  assert.equal(button.props.variant, 'destructive'); button.props.onPress(); button.props.onPress(); host.render();
  assert.equal(confirmed, 1); assert.equal(cancelled, 0); assert.match(textOf(host.output), /Second message/);
  nodes(host.output).find(node => node.props?.label === 'OK').props.onPress(); host.render();
  AppAlert.alert('Cancel check', '', [{ text: 'Cancel', style: 'cancel', onPress: () => cancelled++ }, { text: 'Continue' }]); host.render();
  nodes(host.output).find(node => typeof node.type === 'function' && node.type.name === 'AppBottomSheet').props.onClose(); host.render();
  assert.equal(cancelled, 1); host.unmount();
});

test('confirmation busy state prevents dismissal and disables both actions', () => {
  const h = createHarness(), Dialog = h.load('src/components/common/ConfirmDialog.jsx').default;
  const tree = h.instance(Dialog, { visible: true, title: 'Log out', busy: true }).output;
  assert.equal(tree.props.dismissible, false);
  for (const button of nodes(tree).filter(node => typeof node.type === 'function' && node.type.name === 'AppButton')) {
    assert.equal(h.instance(button.type, button.props).output.props.disabled, true);
  }
});

test('both profile roles expose only the bottom logout button and retain confirmation/cancel/auth behavior', async () => {
  for (const role of ['staff', 'student']) {
    let loggedOut = 0;
    const user = { user_id: 7, first_name: 'Test', last_name: 'User', role };
    const h = createHarness({
      '../../context/AuthContext': { useAuth: () => ({ user, updateUser() {}, async logout() { loggedOut++; } }) },
      '../../services/authService': { authService: { me() {} } }, 'expo-image-picker': {},
      '@tanstack/react-query': { useQuery: () => ({ data: user, isPending: false }) },
      '../../components/common/VistaProcessing': { default: 'Processing', __esModule: true },
      '../../components/common/Skeleton': { ProfileSkeleton: 'ProfileSkeleton' },
    });
    const profile = h.instance(h.load('src/screens/shared/EditProfileScreen.jsx').default, { navigation: { canGoBack: () => true, goBack() {} } });
    for (const placeholder of ['First Name', 'Last Name']) {
      const field = nodes(profile.output).find(n => n.props?.placeholder === placeholder);
      assert.equal(field.props.style.borderRadius, 16);
      assert.equal(field.props.size, 'compact');
      assert.equal(field.props.style.minHeight, 42);
    }
    const avatar = nodes(profile.output).find(n => n.type?.name === 'UserAvatar' && n.props?.size === 84);
    assert.equal(avatar.props.size, 84);
    assert.equal(avatar.props.style.borderWidth, 3);
    assert.equal(avatar.props.style.borderColor, '#FFFFFF');
    assert.ok(nodes(profile.output).some(n => n.props?.style?.top === -34));
    const cameraBtn = nodes(profile.output).find(n => n.props?.accessibilityLabel === 'Change profile photo');
    assert.equal(cameraBtn.props.style.width, 32);
    assert.equal(cameraBtn.props.style.height, 32);
    assert.equal(cameraBtn.props.hitSlop?.top, 8); assert.equal(cameraBtn.props.hitSlop?.bottom, 8);
    const logoutWrap = nodes(profile.output).find(n => n.props?.style?.marginTop === 'auto');
    assert.ok(logoutWrap);
    assert.ok(nodes(logoutWrap).some(n => n.props?.accessibilityLabel === 'Log out'));
    const buttons = nodes(profile.output).filter(node => node.props?.accessibilityLabel === 'Log out');
    assert.equal(buttons.length, 1); buttons[0].props.onPress(); profile.render();
    let confirmation = nodes(profile.output).find(node => typeof node.type === 'function' && node.type.name === 'ConfirmDialog');
    assert.equal(confirmation.props.visible, true); confirmation.props.onCancel(); profile.render();
    confirmation = nodes(profile.output).find(node => typeof node.type === 'function' && node.type.name === 'ConfirmDialog');
    assert.equal(confirmation.props.visible, false); assert.equal(loggedOut, 0);
    await confirmation.props.onConfirm(); assert.equal(loggedOut, 1);
  }
});

test('status badges retain canonical labels/colors with bounded wrapping instead of clipped text', () => {
  const h = createHarness(); const { default: Badge, SUBMISSION_STATUS } = h.load('src/components/submissions/SubmissionStatusBadge.jsx');
  for (const status of Object.keys(SUBMISSION_STATUS)) {
    const badge = h.instance(Badge, { status, size: 'small' }).output;
    assert.equal(flatten(badge.props.style).maxWidth, '100%'); assert.equal(flatten(badge.props.style).backgroundColor, SUBMISSION_STATUS[status].background);
    assert.match(textOf(badge), new RegExp(SUBMISSION_STATUS[status].label));
  }
});

test('profile UI dimensions, camera button placement, and bottom logout layout match refinement specs for both roles', async () => {
  for (const role of ['staff', 'student']) {
    const user = {
      user_id: 42,
      first_name: 'Alex',
      last_name: 'Reyes',
      email: 'alex@example.com',
      role,
      department: role === 'student' ? 'College of Engineering' : undefined,
      org_image_url: role === 'student' ? 'https://example.com/org.png' : undefined,
    };
    const h = createHarness({
      '../../context/AuthContext': { useAuth: () => ({ user, updateUser() {}, async logout() {} }) },
      '../../services/authService': { authService: { me() {}, updateMe: async () => user } },
      'expo-image-picker': { requestCameraPermissionsAsync: async () => ({ granted: true }) },
      '@tanstack/react-query': { useQuery: () => ({ data: user, isPending: false }) },
      '../../components/common/VistaProcessing': { default: 'Processing', __esModule: true },
      '../../components/common/Skeleton': { ProfileSkeleton: 'ProfileSkeleton' },
    });
    const profile = h.instance(h.load('src/screens/shared/EditProfileScreen.jsx').default, {
      navigation: { canGoBack: () => true, goBack() {} },
    });

    // 1. Profile header and avatar dimensions
    const avatar = nodes(profile.output).find(n => n.type?.name === 'UserAvatar' && n.props?.size === 84);
    assert.ok(avatar, 'Avatar size should be 84dp (approx 80-88dp)');
    assert.equal(avatar.props.size, 84);
    assert.equal(avatar.props.style.borderWidth, 3, 'Border width should be approx 3dp');
    assert.equal(avatar.props.style.borderColor, '#FFFFFF', 'Border should be clean white');

    // Overlap: avatar positioned at top: -34dp
    const avatarContainer = nodes(profile.output).find(n => n.props?.style?.top === -34);
    assert.ok(avatarContainer, 'Avatar should overlap the header edge at top: -34dp');
    assert.equal(avatarContainer.props.style.alignItems, 'center', 'Avatar should be centered horizontally');

    // 2. Camera button placement & touch target
    const cameraButton = nodes(profile.output).find(n => n.props?.accessibilityLabel === 'Change profile photo');
    assert.ok(cameraButton, 'Camera button should exist');
    assert.equal(cameraButton.props.style.width, 32, 'Camera button diameter should be 32dp (approx 30-34dp)');
    assert.equal(cameraButton.props.style.height, 32);
    assert.equal(cameraButton.props.style.bottom, 0, 'Camera button should be at bottom-right edge of avatar');
    assert.equal(cameraButton.props.style.right, 0);
    assert.equal(cameraButton.props.hitSlop?.top, 8, 'HitSlop should provide minimum 48dp effective touch target');
    assert.equal(cameraButton.props.hitSlop?.bottom, 8);
    assert.equal(cameraButton.props.hitSlop?.left, 8);
    assert.equal(cameraButton.props.hitSlop?.right, 8);

    // 3. Container corner radius
    const mainCard = nodes(profile.output).find(n => flatten(n.props?.style)?.borderTopLeftRadius === 20);
    assert.ok(mainCard, 'Container top corners should be approx 18-22dp');
    assert.equal(flatten(mainCard.props.style).borderTopRightRadius, 20);

    // 4. Input fields
    for (const placeholder of ['First Name', 'Last Name', 'Email']) {
      const field = nodes(profile.output).find(n => n.props?.placeholder === placeholder);
      assert.ok(field, `Field ${placeholder} should exist`);
      assert.equal(field.props.style.minHeight, 42, 'Input visible height should be approx 40-44dp');
      assert.equal(field.props.style.borderRadius, 16, 'Inputs use the shared field radius');
      assert.equal(field.props.style.paddingHorizontal, 16, 'Input horizontal padding should be approx 16-18dp');
      assert.equal(field.props.style.fontSize, 14, 'Input value text should be approx 12-13sp');
    }

    // 5. Bottom logout placement
    const bottomSection = nodes(profile.output).find(n => n.props?.style?.marginTop === 'auto');
    assert.ok(bottomSection, `${role} profile should have a bottom section with marginTop auto`);
    const logoutBtn = nodes(bottomSection).find(n => n.props?.accessibilityLabel === 'Log out');
    assert.ok(logoutBtn, `${role} profile should position Logout in the bottom section`);
    assert.equal(logoutBtn.props.style.minHeight, 44);

    // 6. Role-specific department visibility
    if (role === 'student') {
      assert.ok(nodes(profile.output).some(n => textOf(n).includes('College of Engineering')), 'Student should display organization');
    } else {
      assert.ok(!nodes(profile.output).some(n => textOf(n).includes('Organization')), 'Staff should not display organization');
    }
  }
});


test('SubmissionDetailsScreen omits navigation while preserving keyboard-aware reply composition and bottom safe area', () => {
  const owner = { user_id: 7, role: 'student', org_id: 1, org_joined_at: '2026-10-01' };
  const submission = { submission_id: 'submission-a', submitted_by: 7, status: 'approved', priority_escalation: false, title: 'Title', submitted_at: '2026-10-31T01:00:00Z', documents: [] };
  const log = { log_id: 'log-a', can_reply: true, reply_count: 1, remarks_text: 'Please confirm.' };
  const query = { data: submission, isPending: false, isError: false, isFetchedAfterMount: true };
  const component = name => ({ default: name, __esModule: true });
  const h = createHarness({
    '@tanstack/react-query': { useQuery: () => query, useQueryClient: () => ({}) },
    '../../context/AuthContext': { useAuth: () => ({ user: owner }) },
    '../../theme/layout': { useStaffLayout: () => ({ body: {}, horizontal: {} }), panelStyles: { touch: { minHeight: 48 } }, useBottomNavClearance: () => 68 },
    '../common/Skeleton': { DetailsSkeleton: 'DetailsSkeleton' },
    '../common/AccountHeader': component('AccountHeader'), '../common/PageHeading': component('PageHeading'), '../common/BackButton': component('BackButton'),
    '../staff/StaffBottomNav': component('StaffBottomNav'), '../students/StudentBottomNav': component('StudentBottomNav'), '../staff/DriveArchiveCard': component('DriveArchiveCard'),
    '../../services/submissionsService': { submissionsService: {} }, '../../services/usersService': { usersService: {} }, '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useSubmissionConversation': { default: () => ({ hasReply: true, target: { log, name: 'Staff' }, entries: [log], logs: {} }), __esModule: true },
    './ReviewDriveTask': component('ReviewDriveTask'), './SubmissionTicket': component('SubmissionTicket'), './SubmissionConversation': component('SubmissionConversation'), './ReplyComposer': component('ReplyComposer'), './StaffStatusSheet': component('StaffStatusSheet'),
  });
  const Screen = h.load('src/components/submissions/SubmissionDetailsScreen.jsx').default;
  const outer = h.instance(Screen, { route: { params: { submission } }, navigation: {} });
  const tree = h.instance(outer.output.type, outer.output.props).output;

  // Removing navigation must not remove keyboard avoidance or reply composition.
  const kav = nodes(tree).find(n => n.type === 'KeyboardAvoidingView');
  assert.ok(kav, 'KeyboardAvoidingView must wrap content');
  assert.equal(nodes(kav).some(n => n.type === 'ReplyComposer'), true, 'ReplyComposer sits inside KeyboardAvoidingView');
  assert.equal(nodes(kav).some(n => n.type === 'StudentBottomNav'), false, 'Navbar is NOT inside KeyboardAvoidingView');

  assert.equal(nodes(tree).some(n => n.type === 'StudentBottomNav' || n.type === 'StaffBottomNav'), false);
  const footer = nodes(tree).find(n => n.type === 'AnimatedView');
  assert.equal(footer.props.style.height, 0, 'Android composer reaches the bottom without an artificial gap');
  assert.equal(footer.props.style.backgroundColor, '#FFFFFF', 'Any real safe-area clearance continues the composer surface');
});
