const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = style => Object.assign({}, ...(Array.isArray(style) ? style : [style]));

test('both Notifications roles retain the dashboard header structure and role-appropriate navbar', () => {
  for (const role of ['staff', 'student']) {
    const h = createHarness({
      '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
      '../../context/AuthContext': { useAuth: () => ({ role }) },
      '../../hooks/useStudentNotifications': { useNotifications: () => ({ data: { results: [], unread_count: 2 } }), useMarkNotificationRead: () => ({}) },
      '../../hooks/useScreenRefresh': { useScreenRefresh: () => ({}) },
    });
    const Screen = h.load('src/screens/student/StudentNotificationsScreen.jsx').default;
    const tree = h.instance(Screen, { navigation: {} }).output;
    const list = nodes(tree).find(n => n.props?.renderItem);
    const header = list.props.ListHeaderComponent;
    assert.ok(!nodes(header).some(n => n.type?.name === 'AccountHeader'));
    assert.equal(nodes(tree).filter(n => n.type?.name === 'AccountHeader').length, 1, 'One fixed account header sits outside the refreshing list');
    assert.equal(list.props.stickyHeaderIndices, undefined, 'Notification headings and filters continue scrolling');
    const heading = nodes(header).find(n => n.props?.accessibilityRole === 'header' && textOf(n) === 'Notifications');
    assert.equal(heading.props.style.fontSize, 20);
    assert.equal(heading.props.style.fontFamily, 'DMSans_600SemiBold');
    if (role === 'student') {
      const nav = nodes(tree).find(n => n.type?.name === 'StudentBottomNav');
      assert.ok(nav);
      assert.equal(nav.props.activeTab, 'notifications');
    } else {
      const nav = nodes(tree).find(n => n.type?.name === 'StaffBottomNav');
      assert.ok(nav);
      assert.notEqual(nav.props.activeTab, 'notifications');
    }
    const empty = list.props.ListEmptyComponent;
    assert.equal(flat(h.instance(empty.type, empty.props).output.props.style).paddingVertical, 24);
    assert.ok(!nodes(empty).some(n => n.props?.className?.includes('w-14')));
    const row = list.props.renderItem({ item: { notification_id: 'fixture', message: 'Unchanged content' } });
    assert.equal(row.type.name, 'StudentNotificationListItem');
  }
});

test('shared navbar shell includes its circle and padding with full targets and matching clearance', () => {
  const h = createHarness(); const { nav, sizes, compact } = h.load('src/theme/tokens.js');
  assert.equal(Math.max(sizes.touch, nav.indicator) + nav.padding * 2, 56);
  assert.equal(compact.navHeight, 56); assert.ok(sizes.touch >= 48);
  assert.equal(h.load('src/theme/layout.js').useBottomNavClearance(), 80);
});

test('compact typography and shared icon Back preserve scaling and navigation targets', () => {
  let back = 0;
  const h = createHarness({ '@react-navigation/native': { useNavigation: () => ({ goBack: () => back++ }) } });
  const { type } = h.load('src/theme/tokens.js');
  assert.equal(type.listTitle.fontSize, 14); assert.equal(type.listTitle.fontFamily, 'DMSans_500Medium');
  assert.equal(type.notificationTitle.fontSize, 14); assert.equal(type.notificationPreview.fontSize, 12);
  assert.equal(type.notificationHeading.fontSize, 20);
  const Back = h.load('src/components/common/BackButton.jsx').default;
  const button = h.instance(Back, { variant: 'icon' }).output;
  assert.equal(button.props.style.minHeight, 48); assert.equal(button.props.style.minWidth, 48);
  button.props.onPress(); assert.equal(back, 1);
  assert.equal(nodes(button).find(n => n.type?.name === 'VistaIcon').props.size, 18);
});

test('dismissal restores only live targets and navigation/removal invalidates restoration', () => {
  for (const action of ['dismiss', 'navigate', 'row-unmount']) {
    const h = createHarness(), focused = [];
    h.native.AccessibilityInfo.setAccessibilityFocus = node => focused.push(node);
    const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
    const row = { current: 17 }, target = { current: row };
    const sheet = h.instance(Sheet, { visible: true, returnFocusRef: target });
    if (action === 'navigate') target.current = null;
    if (action === 'row-unmount') row.current = null;
    sheet.render({ visible: false, returnFocusRef: target });
    assert.deepEqual(focused, [], 'Do not restore focus into the exiting sheet');
    sheet.output.props.children.props.onHidden();
    sheet.render();
    sheet.unmount();
    assert.deepEqual(focused, action === 'dismiss' ? [17] : []);
  }
});

test('rapid sheet unmount cancels pending accessibility/animation entry', async () => {
  const h = createHarness(); let completeEntry, animations = 0, focuses = 0, stopped = 0;
  h.native.AccessibilityInfo.isReduceMotionEnabled = async () => false;
  h.native.AccessibilityInfo.setAccessibilityFocus = () => focuses++;
  h.native.Animated.timing = () => { animations++; return { start(callback) { completeEntry = callback; } }; };
  h.native.Animated.Value.prototype.stopAnimation = () => stopped++;
  const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
  const host = h.instance(Sheet, { visible: true }).output;
  const surface = h.instance(host.props.children.type, host.props.children.props);
  await Promise.resolve(); surface.render();
  nodes(surface.output).find(n => n.props?.accessibilityRole === 'header').props.ref.current = 'old-heading';
  nodes(surface.output).find(n => n.props?.onLayout).props.onLayout({ nativeEvent: { layout: { height: 200 } } });
  assert.equal(animations, 2); assert.equal(focuses, 0);
  surface.unmount(); completeEntry({ finished: true });
  assert.ok(stopped > 0); assert.equal(focuses, 0, 'A cancelled animation completion cannot focus the removed sheet');
});

test('all status/priority cards keep a neutral surface and full-width one-line accessible titles at small widths and large fonts', () => {
  for (const width of [320, 360]) for (const fontScale of [1, 1.5]) {
    const h = createHarness(); h.native.useWindowDimensions = () => ({ width, height: 700, fontScale });
    const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
    const { colors, cardTones } = h.load('src/theme/tokens.js');
    for (const status of ['pending', 'under_review', 'approved', 'rejected', 'resubmission_required', 'unknown']) for (const priority of [false, true]) {
      const title = 'A complete title that must remain accessible even when its visual line is truncated';
      let opened = 0;
      const card = h.instance(Card, { submission: { title, status, priority_escalation: priority }, onPress: () => opened++ }).output;
      assert.equal(flat(card.props.style).backgroundColor, colors.listSurface);
      assert.equal(flat(card.props.style).height, undefined); assert.equal(flat(card.props.style).minHeight, undefined);
      const titleNode = nodes(card).find(n => n.type === 'Text' && textOf(n) === title);
      assert.equal(titleNode.props.numberOfLines, 1); assert.equal(titleNode.props.ellipsizeMode, 'tail');
      assert.equal(titleNode.props.allowFontScaling, undefined); assert.equal(flat(titleNode.props.style).minHeight, undefined);
      assert.match(card.props.accessibilityLabel, /A complete title/);
      const accent = nodes(card).find(n => flat(n.props?.style).position === 'absolute');
      assert.equal(flat(accent.props.style).width, 3);
      assert.equal(flat(accent.props.style).backgroundColor, (priority ? cardTones.priority : cardTones[status] || cardTones.default).accent);
      card.props.onPress(); assert.equal(opened, 1);
    }
  }
});

test('notification previews use only the actual actor image and retain the full message for accessibility/details', () => {
  const h = createHarness(); const Row = h.load('src/components/students/StudentNotificationListItem.jsx').default;
  const message = 'A long original message. '.repeat(30);
  for (const actor_image_url of [null, '', 'https://example.test/actor.webp']) {
    const row = h.instance(Row, { notification: { actor_image_url, submission_title: 'Existing title', message, submission_status: 'approved' } }).output;
    const image = nodes(row).find(n => n.type?.name === 'UserAvatar');
    assert.equal(image.props.uri, actor_image_url); assert.equal(image.props.size, 30);
    const preview = nodes(row).find(n => n.type === 'Text' && textOf(n) === message);
    assert.equal(preview.props.numberOfLines, 1); assert.ok(row.props.accessibilityLabel.includes(message));
    const avatar = h.instance(image.type, image.props); if (actor_image_url) { avatar.output.props.onError(); avatar.render(); }
    assert.ok(nodes(avatar.output).some(n => /default_user\.webp$/.test(String(n.props?.source))));
  }
  const Detail = h.load('src/components/students/NotificationDetailSheet.jsx').default;
  const detail = h.instance(Detail, { notification: { message, actor_image_url: 'https://example.test/actor.webp' } }).output;
  const full = nodes(detail).find(n => n.type === 'Text' && textOf(n) === message);
  assert.equal(full.props.numberOfLines, undefined); assert.equal(full.props.selectable, true);
  assert.notEqual(flat(full.props.style).textAlign, 'center');
});

test('opening the notification bell only refreshes the list and never reads an unread notification', () => {
  let reads = 0, refreshes = 0, navigations = 0;
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate: () => navigations++ }) },
    '../../context/AuthContext': { useAuth: () => ({ role: 'staff' }) },
    '../../hooks/useStudentNotifications': {
      useNotifications: () => ({ data: { unread_count: 1, results: [{ notification_id: 'fixture-unread', is_read: false, created_at: new Date().toISOString() }] }, refetch: () => refreshes++ }),
      useMarkNotificationRead: () => ({ mutateAsync: () => reads++ }),
    },
  });
  const Bell = h.load('src/components/students/StudentNotificationBell.jsx').default;
  const bell = h.instance(Bell);
  nodes(bell.output).find(n => n.props?.accessibilityLabel === 'Notifications, 1 unread').props.onPress(); bell.render();
  assert.equal(refreshes, 1); assert.equal(reads, 0); assert.equal(navigations, 0);
  const sheet = nodes(bell.output).find(n => n.type?.name === 'AppBottomSheet');
  assert.equal(sheet.props.visible, true); sheet.props.onClose(); bell.render();
  assert.equal(reads, 0); assert.equal(navigations, 0);
});

test('sheet preserves the native Modal child contract, blocks busy/non-dismissible Back, and restores its opening target', () => {
  const h = createHarness(); const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
  let closed = 0; const focused = []; h.native.AccessibilityInfo.setAccessibilityFocus = handle => focused.push(handle);
  const target = { current: 17 };
  const sheet = h.instance(Sheet, { visible: true, title: 'Existing workflow', children: 'Draft remains', returnFocusRef: target, busy: true, onClose: () => closed++ });
  const surfaceType = sheet.output.props.children.type;
  sheet.output.props.onRequestClose(); assert.equal(closed, 0);
  sheet.render({ ...sheet.props, busy: false, dismissible: false }); sheet.output.props.onRequestClose(); assert.equal(closed, 0);
  sheet.render({ ...sheet.props, dismissible: true }); sheet.output.props.onRequestClose(); assert.equal(closed, 1);
  sheet.render({ ...sheet.props, visible: false, returnFocusRef: undefined });
  assert.equal(sheet.output.props.children.type, surfaceType); assert.equal(sheet.output.props.children.props.children, 'Draft remains');
  assert.deepEqual(focused, [], 'Focus waits until the retained surface finishes exiting');
  sheet.output.props.children.props.onHidden(); sheet.render();
  assert.deepEqual(focused, [17]);
});

test('sheet slides its measured content with reduced-motion support, 80% maximum and scrollable body', async () => {
  for (const reduced of [false, true]) {
    const h = createHarness(); const calls = []; h.native.AccessibilityInfo.isReduceMotionEnabled = async () => reduced;
    h.native.Animated.timing = (value, config) => ({ start(cb) { calls.push(config); value.setValue(config.toValue); cb?.({ finished: true }); } });
    const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
    const host = h.instance(Sheet, { visible: true }).output;
    const surface = h.instance(host.props.children.type, host.props.children.props);
    await Promise.resolve(); surface.render();
    const panel = nodes(surface.output).find(n => n.props?.onLayout);
    assert.equal(flat(panel.props.style).maxHeight, '80%'); assert.equal(flat(panel.props.style).minHeight, undefined);
    assert.ok(nodes(panel).some(n => n.type === 'ScrollView'));
    panel.props.onLayout({ nativeEvent: { layout: { height: 230 } } });
    assert.equal(calls.length, reduced ? 0 : 2);
    if (!reduced) {
      assert.equal(calls[0].duration, h.load('src/theme/tokens.js').sheetLayout.duration);
      assert.equal(calls[0].useNativeDriver, true);
    }
    assert.equal(flat(panel.props.style).transform[0].translateY.value, 0, 'The measured panel reaches its visible position');
    surface.render({ ...surface.props, visible: false }); surface.render({ ...surface.props, visible: true });
    assert.equal(calls.length, reduced ? 0 : 4, 'Reopening respects the cached motion preference without a native read delay');
    surface.unmount();
  }
});

test('both role bars retain 48dp targets, larger scan glyphs and selected color without changing action order', () => {
  const h = createHarness({ '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) } });
  h.native.Animated.Value.prototype.interpolate = function () { return this.value; };
  for (const [file, expected] of [['staff/StaffBottomNav', ['Home', 'Document entry', 'Scan document', 'Submissions', 'Google Drive']], ['students/StudentBottomNav', ['Home', 'Review tracker', 'All notifications']]]) {
    const Nav = h.load('src/components/' + file + '.jsx').default;
    const bar = h.instance(Nav, { activeTab: 'home' }).output;
    const items = nodes(bar).filter(n => n.type?.name === 'BottomNavItem');
    const targets = items.map(n => h.instance(n.type, n.props).output);
    assert.deepEqual(targets.map(n => n.props.accessibilityLabel), expected);
    assert.ok(targets.every(n => flat(n.props.style).minHeight >= 48 && flat(n.props.style).minWidth >= 48));
    const icons = targets.flatMap(nodes).filter(n => n.type?.name === 'VistaIcon'); assert.ok(icons.every((n, i) => n.props.size === (items[i].props.action ? 30 : 22)));
    assert.equal(icons[0].props.color, h.load('src/theme/tokens.js').nav.selected);
  }
});

test('Drive account-present and missing states share a truthful identity display in both connection branches', () => {
  const h = createHarness({ '../../../hooks/useDrive': {}, '../../../utils/driveAuth': {}, '../../../components/common/Toast': {}, '../../../components/common/VistaProcessing': { default: 'Processing', __esModule: true } });
  const { DriveAccountIdentity } = h.load('src/screens/staff/gdriveSync/GDriveSyncLoginCard.jsx');
  for (const email of [undefined, null, '', '  ']) {
    const row = h.instance(DriveAccountIdentity, { email }).output;
    assert.match(textOf(row), /Google Drive connected/); assert.match(textOf(row), /Account email unavailable/);
    assert.ok(!textOf(row).includes('Connected as'));
  }
  const row = h.instance(DriveAccountIdentity, { email: ' account@example.test ' }).output;
  assert.match(textOf(row), /Connected as/); assert.match(textOf(row), /account@example.test/);
});

test('entry controls retain required selection, title-edit and confirmation payload behavior with the horizontal optional attachment action', () => {
  const destinations = [], alerts = [];
  const h = createHarness({
    '../../../components/common/AppDialog': { AppAlert: { alert: (...args) => alerts.push(args) } },
    '../../../components/common/VistaProcessing': { default: 'Processing', __esModule: true },
    '../../../components/submissions/DraftAttachmentPreview': { default: 'Preview', __esModule: true },
    '../../../services/prepareAttachment': {}, '../../../utils/documentScan': {},
    '../../../hooks/useSubmissions': { useAutofillDocument: () => ({ isPending: false }) },
    '../../../hooks/useAcademicYears': { useActiveAcademicYear: () => ({ data: { academic_year_id: 9, year: '2026–2027' } }) },
    '../../../hooks/useOrganizations': { useOrganizations: () => ({ data: [{ org_id: 3, name: 'Fixture organization' }] }), useOrganizationUsers: () => ({ data: [] }) },
    '../../../hooks/useCategories': { useCategories: () => ({ data: [{ category_id: 4, name: 'Fixture category' }] }) },
    '../../../hooks/useDocumentTypes': { useDocumentTypes: () => ({ data: [{ doc_type_id: 5, name: 'Fixture type' }] }) },
    '../../../components/common/AccountHeader': { default: 'Header', __esModule: true },
  });
  const Entry = h.load('src/screens/staff/docEntry/StaffDocumentEntryContent.jsx').default;
  const entry = h.instance(Entry, { navigation: { navigate: (...args) => destinations.push(args) } });
  assert.equal(nodes(entry.output).filter(n => n.type?.name === 'SelectField' && n.props.size === 'compact').length, 5);
  assert.equal(nodes(entry.output).find(n => n.props?.accessibilityLabel === 'Document title').props.size, 'compact');
  const submit = () => nodes(entry.output).find(n => n.props?.label === 'Submit').props.onPress();
  submit(); assert.equal(destinations.length, 0); assert.equal(alerts.at(-1)[0], 'Missing title');
  nodes(entry.output).find(n => n.props?.accessibilityLabel === 'Document title').props.onChangeText('Original typed title'); entry.render();
  submit(); assert.equal(destinations.length, 0); assert.equal(alerts.at(-1)[0], 'Missing fields');
  for (const label of ['Organization', 'Document type', 'Category']) {
    const field = nodes(entry.output).find(n => n.props?.label === label); field.props.onChange(field.props.options[0]); entry.render();
  }
  const year = nodes(entry.output).find(n => n.props?.label === 'Academic year'); assert.equal(year.props.disabled, true); assert.equal(year.props.value.id, 9);
  const attach = nodes(entry.output).find(n => n.props?.accessibilityLabel === 'Attach document (optional)');
  assert.equal(flat(attach.props.style).flexDirection, 'row'); assert.ok(flat(attach.props.style).minHeight >= 48);
  assert.match(textOf(attach), /Attach Document \(Optional\)/);
  attach.props.onPress(); assert.equal(alerts.at(-1)[0], 'Attach Document'); assert.equal(destinations.length, 0);
  submit(); assert.equal(destinations[0][0], 'StaffSubmissionConfirmation');
  assert.equal(destinations[0][1].draft.title, 'Original typed title'); assert.equal(destinations[0][1].draft.org_id, 3);
  assert.equal(destinations[0][1].draft.doc_type_id, 5); assert.equal(destinations[0][1].draft.category_id, 4); assert.equal(destinations[0][1].draft.academic_year_id, 9);
});
