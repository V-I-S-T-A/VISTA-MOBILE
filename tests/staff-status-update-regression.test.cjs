const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

const submission = {
  submission_id: 'sub-101',
  submitted_by: 7,
  status: 'under_review',
  priority_escalation: false,
  title: 'Budget Proposal',
  submitted_at: '2026-11-15T01:00:00Z',
  documents: [],
};

function makeScreenHarness({ user, conversation }) {
  let refetchedDetail = 0;
  let refetchedLogs = 0;
  let dismissedKeyboard = 0;
  const query = {
    data: submission,
    isPending: false,
    isError: false,
    isFetchedAfterMount: true,
    async refetch() {
      refetchedDetail++;
      return { isError: false, data: submission };
    },
  };
  const component = name => ({ default: name, __esModule: true });
  const h = createHarness({
    '@tanstack/react-query': { useQuery: () => query, useQueryClient: () => ({}) },
    'react-native-keyboard-controller': { KeyboardAvoidingView: 'KeyboardAvoidingView', useReanimatedKeyboardAnimation: () => ({ progress: { value: 0 } }) },
    '../../context/AuthContext': { useAuth: () => ({ user }) },
    '../../theme/layout': {
      useStaffLayout: () => ({ body: {}, horizontal: {} }),
      panelStyles: { touch: { minHeight: 48 } },
      useBottomNavClearance: () => 68,
    },
    '../common/Skeleton': { DetailsSkeleton: 'DetailsSkeleton' },
    '../common/AccountHeader': component('AccountHeader'),
    '../common/PageHeading': component('PageHeading'),
    '../common/BackButton': component('BackButton'),
    '../staff/StaffBottomNav': component('StaffBottomNav'),
    '../students/StudentBottomNav': component('StudentBottomNav'),
    '../staff/DriveArchiveCard': component('DriveArchiveCard'),
    '../../services/submissionsService': { submissionsService: {} },
    '../../services/usersService': { usersService: {} },
    '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useSubmissionConversation': {
      default: () => ({
        ...conversation,
        logs: {
          async refetch() {
            refetchedLogs++;
            return { isError: false };
          },
        },
      }),
      __esModule: true,
    },
    './ReviewDriveTask': component('ReviewDriveTask'),
    './SubmissionTicket': component('SubmissionTicket'),
    './SubmissionConversation': component('SubmissionConversation'),
    './StaffStatusSheet': component('StaffStatusSheet'),
  });
  h.native.Keyboard.dismiss = () => {
    dismissedKeyboard++;
  };
  const Screen = h.load('src/components/submissions/SubmissionDetailsScreen.jsx').default;
  const outer = h.instance(Screen, { route: { params: { submission } }, navigation: {} });
  const scoped = h.instance(outer.output.type, outer.output.props);
  return {
    h,
    scoped,
    getState: () => ({ refetchedDetail, refetchedLogs, dismissedKeyboard }),
  };
}

test('Staff user can open StaffStatusSheet from ReplyComposer even when no reply target or review logs exist', async () => {
  const staff = { user_id: 9, role: 'staff' };
  const conversation = {
    hasReply: false,
    target: null,
    draft: '',
    sending: false,
    error: '',
    notice: '',
    entries: [],
  };
  const { h, scoped, getState } = makeScreenHarness({ user: staff, conversation });
  let tree = scoped.output;

  const sticky = nodes(tree).find(n => n.type === 'KeyboardAvoidingView');
  assert.ok(sticky, 'Keyboard-aware content must be mounted for staff');
  const composerNode = nodes(sticky).find(n => typeof n.type === 'function' && n.type.name === 'ReplyComposer');
  assert.ok(composerNode, 'ReplyComposer must be mounted for staff even when target is null');
  assert.equal(typeof composerNode.props.onStatus, 'function');

  // Render ReplyComposer itself and press the Status button
  const composer = h.instance(composerNode.type, composerNode.props);
  const statusButton = nodes(composer.output).find(n => n.props?.accessibilityLabel === 'Update submission status');
  assert.equal(statusButton.props.disabled, false);

  let sheet = nodes(tree).find(n => n.type === 'StaffStatusSheet');
  assert.equal(sheet.props.visible, false);

  statusButton.props.onPress();
  tree = scoped.render();
  assert.equal(getState().dismissedKeyboard, 1);

  sheet = nodes(tree).find(n => n.type === 'StaffStatusSheet');
  assert.equal(sheet.props.visible, true);

  // Confirming status refetches detail & logs and closes the sheet
  await sheet.props.onConfirmed();
  tree = scoped.render();
  assert.equal(getState().refetchedDetail, 1);
  assert.equal(getState().refetchedLogs, 1);
  assert.equal(nodes(tree).find(n => n.type === 'StaffStatusSheet').props.visible, false);
});

test('Student owner and peer authorization boundaries hide StaffStatusSheet and onStatus', () => {
  const owner = { user_id: 7, role: 'student', org_id: 1, org_joined_at: '2026-10-01' };

  // Student owner without reply target: composer and StaffStatusSheet are both hidden
  const ownerIdle = makeScreenHarness({
    user: owner,
    conversation: { hasReply: true, target: null, draft: '', sending: false, entries: [] },
  });
  assert.equal(nodes(ownerIdle.scoped.output).some(n => n.type?.name === 'ReplyComposer'), false);
  assert.equal(nodes(ownerIdle.scoped.output).some(n => n.type === 'StaffStatusSheet'), false);

  // Student owner with reply target: composer renders without onStatus, and StaffStatusSheet is not mounted
  const ownerReplying = makeScreenHarness({
    user: owner,
    conversation: { hasReply: true, target: { name: 'OSA Staff', log: { log_id: 'l1' } }, draft: '', sending: false, entries: [] },
  });
  const composerNode = nodes(ownerReplying.scoped.output).find(n => typeof n.type === 'function' && n.type.name === 'ReplyComposer');
  assert.ok(composerNode, 'Student owner sees ReplyComposer when replying to a target');
  assert.equal(composerNode.props.onStatus, undefined);
  assert.equal(nodes(ownerReplying.scoped.output).some(n => n.type === 'StaffStatusSheet'), false);

  // Non-owner student (view only): neither composer nor StaffStatusSheet is mounted
  const peer = makeScreenHarness({
    user: { ...owner, user_id: 8 },
    conversation: { hasReply: true, target: { name: 'OSA Staff', log: { log_id: 'l1' } }, draft: '', sending: false, entries: [] },
  });
  assert.equal(nodes(peer.scoped.output).some(n => n.type?.name === 'ReplyComposer'), false);
  assert.equal(nodes(peer.scoped.output).some(n => n.type === 'StaffStatusSheet'), false);
});
