const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...[value].flat(Infinity).filter(Boolean));

test('shared inputs expose focus/error/disabled surfaces and preserve value and native event callbacks', () => {
  const h = createHarness();
  const Input = h.load('src/components/common/AppInput.jsx').default;
  const { colors } = h.load('src/theme/tokens.js');
  let focused = 0, blurred = 0, changed;
  const props = { value: 'Retained draft', onFocus: () => focused++, onBlur: () => blurred++, onChangeText: v => { changed = v; } };
  const input = h.instance(Input, props);
  input.output.props.onFocus({}); input.render();
  assert.equal(flat(input.output.props.style).borderColor, colors.focus);
  assert.equal(input.output.props.value, 'Retained draft');
  input.output.props.onChangeText('Edited'); assert.equal(changed, 'Edited');
  input.output.props.onBlur({}); input.render();
  assert.equal(flat(input.output.props.style).borderColor, colors.border);
  input.render({ ...props, error: true });
  assert.equal(flat(input.output.props.style).borderColor, colors.danger);
  input.render({ ...props, editable: false });
  assert.equal(flat(input.output.props.style).backgroundColor, colors.disabledSurface);
  assert.equal(focused, 1); assert.equal(blurred, 1);
});

test('DM Sans resolves utility weights to loaded faces without mutating styles or disabling scaling', () => {
  const h = createHarness({ nativewind: { cssInterop() {} } });
  h.native.StyleSheet.flatten = flat;
  const { textStyle, Text } = h.load('src/components/common/FontText.jsx');
  const original = { fontWeight: '600', color: '#123456' };
  const resolved = textStyle(original, 'body');
  assert.equal(resolved.fontFamily, 'DMSans_600SemiBold');
  assert.equal(resolved.fontWeight, 'normal');
  assert.equal(original.fontWeight, '600');
  assert.equal(textStyle({ fontFamily: 'DMSans_700Bold' }).fontFamily, 'DMSans_700Bold');
  assert.equal(textStyle({ fontFamily: 'OtherFont', fontWeight: 'bold' }).fontWeight, 'bold');
  assert.equal(h.instance(Text, { children: 'Readable' }).output.props.allowFontScaling, undefined);
});

test('NativeWind consumes the native theme palette, type scale and rounded geometry', () => {
  const { colors, type, radii, compact, notificationLayout } = createHarness().load('src/theme/tokens.js');
  const config = require('../tailwind.config').theme.extend;
  assert.equal(config.colors.vistaNavy, colors.navy);
  assert.equal(config.colors.vistaYellow, colors.yellow);
  assert.equal(config.fontSize.sm[0], `${type.field.fontSize}px`);
  assert.equal(config.borderRadius['2xl'], radii.card);
  for (const value of [compact.paddingHorizontal, compact.paddingVertical, compact.gutter, compact.rowGap, notificationLayout.paddingHorizontal, notificationLayout.paddingVertical, notificationLayout.gap]) assert.equal(value % 4, 0);
});

test('conversation reserves composer space in flow, clears navigation, and shrinks its footer with the real keyboard progress', () => {
  for (const role of ['staff', 'student']) for (const progress of [0, 0.5, 1]) {
    const user = { user_id: 7, role }, log = { log_id: 'log', can_reply: true };
    const data = { submission_id: 's', submitted_by: 7 };
    const component = name => ({ default: name, __esModule: true });
    const h = createHarness({
      'react-native-keyboard-controller': { KeyboardAvoidingView: 'KeyboardAvoidingView', useReanimatedKeyboardAnimation: () => ({ progress: { value: progress } }) },
      '@tanstack/react-query': { useQuery: () => ({ data, isFetchedAfterMount: true }), useQueryClient: () => ({}) },
      '../../context/AuthContext': { useAuth: () => ({ user }) },
      '../../theme/layout': { useStaffLayout: () => ({ body: {}, horizontal: {} }), panelStyles: {}, useBottomNavClearance: () => 68 },
      '../../hooks/useSubmissionConversation': { default: () => ({ target: { log, name: 'Reviewer' }, draft: 'Unsent', hasReply: true, logs: {}, entries: [log] }), __esModule: true },
      '../../services/submissionsService': { submissionsService: {} }, '../../services/usersService': { usersService: {} }, '../../utils/openDocumentEntryWithAttachment': {},
      '../common/AccountHeader': component('Header'), '../common/Skeleton': { DetailsSkeleton: 'Skeleton' }, '../common/BackButton': component('Back'),
      '../staff/StaffBottomNav': component('StaffNav'), '../students/StudentBottomNav': component('StudentNav'), '../staff/DriveArchiveCard': component('Archive'),
      './SubmissionTicket': component('Ticket'), './SubmissionConversation': component('Conversation'), './ReplyComposer': component('Composer'), './StaffStatusSheet': component('StatusSheet'), './ReviewDriveTask': component('Task'),
    });
    const Screen = h.load('src/components/submissions/SubmissionDetailsScreen.jsx').default;
    const outer = h.instance(Screen, { route: { params: { submissionId: 's' } } }).output;
    const tree = h.instance(outer.type, outer.props).output;
    const viewport = nodes(tree).find(n => n.type === 'KeyboardAvoidingView');
    assert.equal(viewport.props.behavior, 'padding');
    assert.ok(nodes(viewport).some(n => n.type === 'Composer'));
    assert.ok(!nodes(viewport).some(n => n.type === 'StaffNav' || n.type === 'StudentNav'));
    const scroll = nodes(viewport).find(n => n.type === 'ScrollView');
    assert.equal(scroll.props.keyboardShouldPersistTaps, 'always');
    assert.equal(scroll.props.keyboardDismissMode, 'on-drag');
    assert.equal(scroll.props.contentContainerStyle.paddingBottom, 8);
    const spacer = nodes(viewport).find(n => n.type === 'AnimatedView');
    assert.equal(flat(spacer.props.style).height, 0, 'No artificial footer on a device with zero bottom inset');
    const composer = nodes(viewport).find(n => n.type === 'Composer');
    assert.equal(composer.props.conversation.draft, 'Unsent');
    assert.equal(typeof composer.props.onStatus, role === 'staff' ? 'function' : 'undefined');
    let scrolled;
    scroll.props.ref.current = { scrollTo: args => { scrolled = args; } };
    const conversation = nodes(viewport).find(n => n.type === 'Conversation');
    const container = nodes(viewport).find(n => n.props?.children === conversation);
    container.props.onLayout({ nativeEvent: { layout: { y: 300 } } });
    conversation.props.onEntryLayout('__heading', 30); conversation.props.onEntryLayout('log', 40);
    scroll.props.onLayout(); assert.equal(scrolled.y, 362);
  }
});

test('informational settings rows avoid inactive button semantics and let descriptions wrap', () => {
  const h = createHarness();
  const Row = h.load('src/components/settings/SettingsRow.jsx').default;
  const tree = h.instance(Row, { label: 'Delivery channels', description: 'A long explanation that must remain readable' }).output;
  assert.ok(!nodes(tree).some(n => n.props?.accessibilityRole === 'button'));
  const text = nodes(tree).find(n => n.props?.children === 'A long explanation that must remain readable');
  assert.equal(text.props.numberOfLines, undefined);
});
