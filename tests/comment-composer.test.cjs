const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const { capabilities, viewerScope } = require('../src/components/submissions/conversationPolicy.cjs');
const byLabel = (tree, label) => nodes(tree).find(n => n.props?.accessibilityLabel === label);

test('staff defaults to an editable new update, expands on focus, and reviews before posting', () => {
  const h = createHarness(), Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  let reviewed = 0, replied = 0;
  const conversation = { target: null, draft: '', updateDraft: '', sending: false,
    changeUpdateDraft(value) { conversation.updateDraft = value; }, send() { replied++; } };
  const composer = h.instance(Composer, { conversation, onStatus() { reviewed++; } });
  const input = byLabel(composer.output, 'New submission update');
  assert.equal(input.props.editable, true);
  assert.equal(input.props.placeholder, 'Post an update…');
  assert.equal(input.props.maxLength, undefined, 'Do not impose the reply-only limit on existing reviewer remarks');
  assert.equal(byLabel(composer.output, 'Reply message'), undefined);
  assert.equal(byLabel(composer.output, 'Review new update'), undefined, 'Resting bar stays compact');
  input.props.onFocus(); composer.render();
  assert.equal(byLabel(composer.output, 'Review new update').props.disabled, true);
  byLabel(composer.output, 'New submission update').props.onChangeText('New independent update'); composer.render();
  assert.equal(byLabel(composer.output, 'Review new update').props.disabled, false);
  byLabel(composer.output, 'Review new update').props.onPress();
  assert.equal(reviewed, 1); assert.equal(replied, 0); assert.equal(conversation.target, null);
  assert.equal(byLabel(composer.output, 'Add web link'), undefined);
});

test('reply target is explicit and leaving it restores the independent staff draft', () => {
  const h = createHarness(), Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  let sent;
  const conversation = { target: { name: 'Staff', log: { log_id: 'update' } }, draft: 'Thread reply',
    updateDraft: 'Separate announcement', sending: false, send(url) { sent = url; },
    cancel() { conversation.target = null; } };
  const composer = h.instance(Composer, { conversation, onStatus() {} });
  assert.match(textOf(composer.output), /Replying to Staff/);
  assert.equal(byLabel(composer.output, 'Reply message').props.value, 'Thread reply');
  assert.equal(byLabel(composer.output, 'Reply message').props.maxLength, undefined, 'Keep over-limit pasted text editable and explain the limit in a modal');
  assert.equal(byLabel(composer.output, 'Review new update'), undefined);
  byLabel(composer.output, 'Send reply').props.onPress(); assert.equal(sent, '');
  byLabel(composer.output, 'Write a new submission update').props.onPress(); composer.render();
  assert.equal(byLabel(composer.output, 'New submission update').props.value, 'Separate announcement');
  assert.equal(conversation.draft, 'Thread reply');
});

test('student composer cannot render a top-level input or staff actions', () => {
  const h = createHarness(), Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  const conversation = { target: null, draft: '', updateDraft: 'Stale staff text', sending: false };
  const composer = h.instance(Composer, { conversation });
  assert.equal(composer.output, null);
  conversation.target = { name: 'Reviewer' }; composer.render();
  assert.ok(byLabel(composer.output, 'Reply message'));
  for (const label of ['New submission update', 'Write a new submission update', 'Update submission status']) {
    assert.equal(byLabel(composer.output, label), undefined);
  }
  assert.ok(byLabel(composer.output, 'Add web link'));
});

test('staff update cache is account/submission scoped, survives retarget/remount and cannot be changed by students', () => {
  const store = new Map();
  const client = { getQueryData: key => store.get(JSON.stringify(key)), setQueryData: (key, data) => store.set(JSON.stringify(key), data) };
  const log = { log_id: 'own-status', can_reply: true, reply_count: 0, changed_by_name: 'Staff' };
  const h = createHarness({ '@tanstack/react-query': { useQueryClient: () => client, useInfiniteQuery: () => ({ data: { pages: [{ results: [log] }] } }) },
    'expo-modules-core': { uuid: { v4: randomUUID } } });
  const Hook = h.load('src/hooks/useSubmissionConversation.js').default;
  const staff = { user_id: 8, role: 'staff' }, submission = { submitted_by: 7 };
  const args = { submissionId: 'submission', scope: viewerScope(staff), access: capabilities(submission, staff), enabled: true };
  const form = h.instance(Hook, args);
  assert.equal(form.output.target, null);
  form.output.changeUpdateDraft('Independent'); form.render();
  form.output.selectTarget(log); form.render();
  assert.equal(form.output.target.parentId, null, 'Staff starts a reply without requiring an existing student reply');
  form.output.changeDraft('Thread'); form.render();
  form.output.cancel(); form.render();
  assert.equal(form.output.updateDraft, 'Independent'); form.unmount();
  const restored = h.instance(Hook, args);
  assert.equal(restored.output.updateDraft, 'Independent');
  for (const alternate of [{ scope: 'other-account' }, { submissionId: 'other-submission' }]) {
    assert.equal(h.instance(Hook, { ...args, ...alternate }).output.updateDraft, '');
  }
  const student = h.instance(Hook, { ...args, scope: 'student', access: { staff: false, canReply: true } });
  student.output.changeUpdateDraft('Forbidden'); student.render(); assert.equal(student.output.updateDraft, '');
  restored.output.clearUpdateDraft(); restored.render(); assert.equal(restored.output.updateDraft, '');
  restored.output.selectTarget(log); restored.render(); assert.equal(restored.output.draft, 'Thread');
});

test('new update form keeps status unchanged unless chosen and confirms remarks with fresh GETs', async () => {
  let saved = { submission_id: 'isolated', status: 'approved', priority_escalation: false, documents: [] };
  const writes = [], reads = [], drafts = [];
  let confirmed = 0;
  const h = createHarness({
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ isPending: false, async mutateAsync(payload) { writes.push(payload); } }) },
    '../../../../services/submissionsService': { submissionsService: { async getSubmission() { reads.push('submission'); return saved; } } },
    '../../../../services/reviewLogsService': { reviewLogsService: { async listReviewLogs() { reads.push('history'); return { results: [{ new_status: saved.status, remarks_text: writes.at(-1).remarksText }] }; } } },
    '../../../../services/driveService': { driveService: { async getConnection() { throw new Error('Must not check Drive for a remarks-only update'); } } },
    '../../../../components/common/AppDialog': { AppAlert: { alert() {} } },
    '../../../../components/submissions/StaffReviewFiles': { __esModule: true, default: 'StaffReviewFiles' },
    '../../../../services/prepareAttachment': { prepareAttachment() {} },
  });
  const Form = h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default;
  const form = h.instance(Form, { submission: saved, newUpdate: true, initialRemarks: 'Independent update',
    onRemarksChange: value => drafts.push(value), onConfirmed: () => { confirmed++; } });
  const selector = byLabel(form.output, 'Document status');
  assert.equal(selector.props.value.id, null); assert.equal(selector.props.placeholder, 'Keep current status');
  assert.equal(byLabel(form.output, 'Reviewer remarks').props.value, 'Independent update');
  byLabel(form.output, 'Reviewer remarks').props.onChangeText('Edited update'); form.render();
  assert.deepEqual(drafts, ['Edited update']);
  await byLabel(form.output, 'Post submission update').props.onPress(); form.render();
  assert.equal(writes.length, 1); assert.equal(writes[0].status, undefined);
  assert.equal(writes[0].remarksText, 'Edited update'); assert.equal(saved.status, 'approved');
  assert.deepEqual(reads, ['submission', 'history']); assert.equal(confirmed, 1);
});

test('new update sheet keeps cancelled remarks and existing status/file controls rather than posting on open', () => {
  const h = createHarness({ '../../screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard': { __esModule: true, default: 'ActionCard' } });
  const Sheet = h.load('src/components/submissions/StaffStatusSheet.jsx').default;
  let closed = 0;
  const props = { visible: false, submission: { status: 'under_review' }, initialRemarks: 'Kept draft', onClose: () => { closed++; } };
  const sheet = h.instance(Sheet, props);
  assert.equal(nodes(sheet.output).find(n => n.type === 'ActionCard').props.visible, false);
  sheet.render({ ...props, visible: true });
  const form = nodes(sheet.output).find(n => n.type === 'ActionCard');
  assert.equal(form.props.newUpdate, true); assert.equal(form.props.initialRemarks, 'Kept draft');
  sheet.output.props.onClose(); assert.equal(closed, 1);
  form.props.onBusyChange(true); sheet.render(); sheet.output.props.onClose(); assert.equal(closed, 1);
});
