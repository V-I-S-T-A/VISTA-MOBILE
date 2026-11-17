const { test } = require('node:test');
const assert = require('node:assert/strict');
const { STAFF_REVIEW_ACTIONS, validateDecision, validateReviewFile } = require('../src/components/submissions/staffReviewPolicy.cjs');
const { submitStaffReview } = require('../src/components/submissions/submitStaffReview.cjs');
const { buildImagePdf } = require('../src/utils/buildImagePdf.cjs');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const byLabel = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label);
const flatten = style => Object.assign({}, ...[style].flat());
function fixture(overrides = {}) {
  let saved = { submission_id: 'isolated', status: 'under_review', priority_escalation: false, documents: [] };
  let updates = 0, uploads = 0;
  const args = { submission: saved, status: 'under_review', remarks: '', priority: false, journal: {}, services: {
    async update(payload) { updates++; saved = { ...saved, status: payload.status || saved.status, priority_escalation: payload.priorityEscalation, documents: payload.attachment ? [{ file_url: payload.attachment.file_url, is_current: true }] : [] }; },
    async getSubmission() { return saved; },
    async listReviewLogs() { return { results: [{ new_status: saved.status, remarks_text: 'Please revise', attachment_change: { new_files: ['new.pdf'] } }] }; },
    async prepareAttachment() { return { file_url: 'https://res.cloudinary.com/test/new.pdf', file_name: 'new.pdf' }; },
    async uploadDocument() { uploads++; return { task_id: `task-${uploads}` }; },
    ...overrides,
  } };
  return { args, get updates() { return updates; }, get uploads() { return uploads; } };
}
test('staff selector matches all three Web actions for every canonical current state', () => {
  assert.deepEqual(STAFF_REVIEW_ACTIONS, [{ id: 'under_review', label: 'On Process' }, { id: 'approved', label: 'Approved' }, { id: 'rejected', label: 'Returned' }]);
  for (const status of ['pending', 'under_review', 'approved', 'rejected', 'resubmission_required']) {
    for (const action of STAFF_REVIEW_ACTIONS) assert.doesNotThrow(() => validateDecision({ status: action.id, currentStatus: status, returnConfirmation: 'RETURNED', finalFiles: [{ name: 'final.pdf', driveName: 'final.pdf' }] }));
  }
  assert.throws(() => validateDecision({ status: 'resubmission_required' }), /valid action/);
});
test('Returned requires the exact confirmation and rejected approval requires a final PDF', () => {
  for (const text of ['', 'returned', 'RETURN']) assert.throws(() => validateDecision({ status: 'rejected', returnConfirmation: text }), /RETURNED/);
  assert.throws(() => validateDecision({ status: 'approved', currentStatus: 'rejected' }), /approved document/);
  assert.throws(() => validateDecision({ status: 'approved', finalFiles: [{ name: 'photo.jpg', type: 'image/jpeg' }] }), /Convert/);
  assert.throws(() => validateDecision({ status: 'approved', finalFiles: [{ name: 'final.pdf', driveName: ' ' }] }), /filename/);
});
test('On Process accepts Web file types while approval excludes office documents', () => {
  for (const name of ['paper.pdf', 'paper.docx', 'paper.xlsx']) assert.doesNotThrow(() => validateReviewFile({ name }));
  assert.doesNotThrow(() => validateReviewFile({ name: 'photo.heic', type: 'image/heic' }));
  assert.throws(() => validateReviewFile({ name: 'script.exe' }), /PDF/);
  assert.throws(() => validateReviewFile({ name: 'paper.docx' }, true), /PDF or image/);
});
test('decision verifies fresh status, priority and review history; attachment uses the status endpoint', async () => {
  const f = fixture();
  await submitStaffReview({ ...f.args, remarks: 'Please revise', priority: true, file: { uri: 'file://new.pdf' }, attachmentAction: 'replace' });
  assert.equal(f.updates, 1); assert.equal(f.uploads, 0);
});
test('acknowledged save followed by failed fresh read retries confirmation without another PATCH', async () => {
  let fail = true;
  const f = fixture({ async getSubmission() { if (fail) throw new Error('offline'); return { status: 'under_review', priority_escalation: false }; } });
  await assert.rejects(submitStaffReview(f.args), /offline/); fail = false;
  await submitStaffReview(f.args); assert.equal(f.updates, 1);
});
test('lost write response is reconciled through fresh reads before any retry', async () => {
  let posts = 0;
  const f = fixture({ async update() { posts++; throw new Error('response lost'); } });
  await assert.rejects(submitStaffReview(f.args), /response lost/);
  await submitStaffReview(f.args); assert.equal(posts, 1);
});
test('unconfirmed remarks or replacement never report success', async () => {
  const noHistory = fixture({ async listReviewLogs() { return { results: [] }; } });
  await assert.rejects(submitStaffReview({ ...noHistory.args, remarks: 'Please revise' }), /history could not be confirmed/);
  const wrongFiles = fixture({ async getSubmission() { return { status: 'under_review', priority_escalation: false, documents: [] }; } });
  await assert.rejects(submitStaffReview({ ...wrongFiles.args, file: { uri: 'file://new.pdf' }, attachmentAction: 'replace' }), /attachment change/);
});
test('approval saves without synchronous Drive fields and queues separate approved/report jobs once', async () => {
  const events = [], f = fixture();
  const update = f.args.services.update;
  f.args.services.update = async payload => { events.push('save'); assert.equal(payload.files, undefined); assert.equal(payload.drive_folder_id, undefined); await update(payload); };
  f.args.services.uploadDocument = async payload => { events.push(payload.uploadKind); return { task_id: payload.uploadKind }; };
  const args = { ...f.args, status: 'approved', finalFiles: [{ uri: 'file://final', driveName: 'Final.pdf' }], reportFiles: [{ uri: 'file://report', driveName: 'Report.pdf' }] };
  await submitStaffReview(args); await submitStaffReview(args);
  assert.deepEqual(events, ['save', 'approved', 'report']);
});
test('ambiguous Drive queue response cannot trigger duplicate file upload on retry', async () => {
  let uploads = 0;
  const f = fixture({ async uploadDocument() { uploads++; throw new Error('connection lost'); } });
  const args = { ...f.args, status: 'approved', finalFiles: [{ uri: 'file://final', driveName: 'Final.pdf' }] };
  await assert.rejects(submitStaffReview(args), /Status saved/);
  await assert.rejects(submitStaffReview(args), /avoid a duplicate/);
  assert.equal(uploads, 1); assert.equal(f.updates, 1);
});
test('explicit Drive rejection permits retry without repeating previously queued files or status', async () => {
  let calls = 0;
  const f = fixture({ async uploadDocument() { calls++; if (calls === 2) { const e = new Error('queue unavailable'); e.status = 503; throw e; } return { task_id: String(calls) }; } });
  const args = { ...f.args, status: 'approved', finalFiles: [{ uri: 'file://a', driveName: 'A.pdf' }, { uri: 'file://b', driveName: 'B.pdf' }] };
  await assert.rejects(submitStaffReview(args), /Status saved/); await submitStaffReview(args);
  assert.equal(calls, 3); assert.equal(f.updates, 1);
});
test('student composer supports replies and web links without status controls; staff composer supports replies and status updates without web links', () => {
  const h = createHarness(), Composer = h.load('src/components/submissions/ReplyComposer.jsx').default;
  const sentUrls = [];
  let statusOpened = 0;
  const conversation = {
    target: { name: 'Staff' },
    draft: 'Noted',
    sending: false,
    changeDraft() {},
    link: '',
    changeLink(value) { conversation.link = value; },
    send(url) { sentUrls.push(url); },
  };

  // Student view (no onStatus): has Add web link + Send reply, no Staff status control
  const studentInstance = h.instance(Composer, { conversation });
  assert.equal(byLabel(studentInstance.output, 'Update submission status'), undefined);
  const addLink = byLabel(studentInstance.output, 'Add web link');
  assert.ok(addLink);
  assert.equal(byLabel(studentInstance.output, 'Send reply').props.disabled, false);
  addLink.props.onPress();
  let studentTree = studentInstance.render();
  assert.ok(byLabel(studentTree, 'Hide web link field'));
  const webLinkInput = byLabel(studentTree, 'Web link');
  assert.ok(webLinkInput);
  webLinkInput.props.onChangeText('https://example.test/doc');
  studentTree = studentInstance.render();
  byLabel(studentTree, 'Send reply').props.onPress();
  assert.deepEqual(sentUrls, ['https://example.test/doc']);

  // Staff explicitly leaves the thread before composing a top-level update.
  const staffConversation = { ...conversation, cancel() { staffConversation.target = null; } };
  const staffInstance = h.instance(Composer, { conversation: staffConversation, onStatus() { statusOpened++; } });
  const staffTree = staffInstance.output;
  assert.equal(byLabel(staffTree, 'Add web link'), undefined);
  assert.equal(byLabel(staffTree, 'Web link'), undefined);
  assert.equal(byLabel(staffTree, 'Update submission status'), undefined);
  assert.equal(byLabel(staffTree, 'Send reply').props.disabled, false);
  byLabel(staffTree, 'Send reply').props.onPress();
  assert.deepEqual(sentUrls, ['https://example.test/doc', '']);
  byLabel(staffTree, 'Write a new submission update').props.onPress();
  const idle = staffInstance.render();
  assert.equal(byLabel(idle, 'New submission update').props.editable, true);
  byLabel(idle, 'Update submission status').props.onPress();
  assert.equal(statusOpened, 1);
});
test('docked navbar uses safe-area layout flow and clears keyboard-hidden state after dismissal', () => {
  const listeners = {};
  const h = createHarness({ 'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 24, left: 0, right: 0 }) } });
  h.native.Keyboard.addListener = (name, callback) => { listeners[name] = callback; return { remove() {} }; };
  const Frame = h.load('src/components/common/BottomNavFrame.jsx').default;
  const frame = h.instance(Frame, { docked: true, children: 'nav' });
  assert.equal(flatten(frame.output.props.style).position, undefined); assert.equal(flatten(frame.output.props.style).paddingBottom, 24);
  listeners.keyboardDidShow(); frame.render(); assert.equal(frame.output.props.pointerEvents, 'none');
  listeners.keyboardDidHide(); frame.render(); assert.equal(flatten(frame.output.props.style).opacity, 1);
});
test('image PDF preserves page order and byte-accurate cross-reference offsets', () => {
  const pdf = buildImagePdf([{ width: 2, height: 3, bytes: Uint8Array.of(255, 216, 255, 217) }, { width: 3, height: 2, bytes: Uint8Array.of(255, 216, 0, 255, 217) }]);
  const raw = Buffer.from(pdf).toString('latin1');
  assert.match(raw, /^%PDF-1.4/); assert.match(raw, /\/Count 2/);
  const offset = Number(raw.match(/startxref\n(\d+)/)[1]); assert.equal(raw.slice(offset, offset + 4), 'xref');
  const xref = raw.slice(offset).split('\n');
  for (let id = 1; id <= 8; id++) assert.ok(raw.slice(Number(xref[2 + id].slice(0, 10))).startsWith(`${id} 0 obj`));
});

test('staff form mirrors current action, gates file actions and defers approval/return writes until confirmation', async () => {
  let writes = 0;
  const h = createHarness({
    '../../../../components/submissions/StaffReviewFiles': { default: 'StaffReviewFiles', __esModule: true },
    '../../../../components/staff/SelectField': { default: 'SelectField', __esModule: true },
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ isPending: false, async mutateAsync() { writes++; } }) },
    '../../../../services/submissionsService': { submissionsService: {} },
    '../../../../services/reviewLogsService': { reviewLogsService: {} },
    '../../../../services/driveService': { driveService: { async getConnection() { return { connected: true }; } } },
    '../../../../services/prepareAttachment': {},
  });
  const Card = h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default;
  const form = h.instance(Card, { submission: { submission_id: 'a', status: 'under_review', documents: [], is_accomplishment_report: true } });
  const selector = () => nodes(form.output).find(n => n.type === 'SelectField');
  assert.equal(selector().props.value.label, 'On Process');
  assert.deepEqual(Array.from(selector().props.options, o => o.label), ['On Process', 'Approved', 'Returned']);
  assert.ok(nodes(form.output).some(n => n.type === 'StaffReviewFiles' && !n.props.approval));
  selector().props.onChange(STAFF_REVIEW_ACTIONS[1]); form.render();
  assert.equal(nodes(form.output).some(n => n.type === 'StaffReviewFiles' && !n.props.approval), false);
  assert.ok(nodes(form.output).some(n => n.type === 'StaffReviewFiles' && /Accomplishment/.test(n.props.label)));
  byLabel(form.output, 'Update Status').props.onPress(); form.render();
  assert.equal(writes, 0); assert.ok(nodes(form.output).some(n => n.props?.visible && n.props?.title === 'Confirm approval & Drive'));
  selector().props.onChange(STAFF_REVIEW_ACTIONS[2]); form.render(); byLabel(form.output, 'Update Status').props.onPress(); form.render();
  assert.equal(writes, 0);
  const confirm = nodes(form.output).find(n => n.props?.label === 'Return Submission');
  assert.equal(confirm.props.disabled, true);
  byLabel(form.output, 'Type RETURNED to confirm').props.onChangeText('RETURNED'); form.render();
  assert.equal(nodes(form.output).find(n => n.props?.label === 'Return Submission').props.disabled, false);
});

test('On Process picker retains filename, only permits Web types and supports add/replace with cancellation', async () => {
  let changed, args, canceled = false;
  const h = createHarness({
    'expo-document-picker': { async getDocumentAsync(options) { args = options; return canceled ? { canceled: true } : { assets: [{ uri: 'file://paper', name: 'Paper.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1234 }] }; } },
    '../../utils/imagesToPdf': { imagesToPdf() {} }, '../../utils/documentScan': {},
    './DraftAttachmentPreview': { default: 'Preview', __esModule: true },
  });
  const Files = h.load('src/components/submissions/StaffReviewFiles.jsx').default;
  const props = { files: [], onChange: files => { changed = files; }, action: 'add', onActionChange() {}, documents: [] };
  const picker = h.instance(Files, props);
  byLabel(picker.output, 'Manage On Process attachments').props.onPress(); picker.render();
  await nodes(picker.output).find(n => n.props?.label === 'Choose file').props.onPress();
  assert.equal(changed[0].name, 'Paper.docx'); assert.equal(changed[0].uri, 'file://paper');
  assert.equal(args.multiple, false); assert.ok(args.type.includes('image/*')); assert.equal(args.type.length, 4);
  picker.render({ ...props, files: changed }); assert.match(textOf(picker.output), /Paper.docx/);
  canceled = true; changed = undefined;
  await nodes(picker.output).find(n => n.props?.label === 'Choose replacement file').props.onPress();
  assert.equal(changed, undefined);
});

test('failed final-file queue does not prevent the report queue and acknowledged jobs are not repeated', async () => {
  const queued = [];
  const f = fixture({ async uploadDocument(payload) { queued.push(payload.uploadKind); if (payload.uploadKind === 'approved') { const e = new Error('Unavailable'); e.status = 503; throw e; } return { task_id: 'report-task' }; } });
  const args = { ...f.args, status: 'approved', finalFiles: [{ uri: 'file://final', driveName: 'Final.pdf' }], reportFiles: [{ uri: 'file://report', driveName: 'Report.pdf' }] };
  await assert.rejects(submitStaffReview(args), /Status saved/);
  assert.deepEqual(queued, ['approved', 'report']);
  await assert.rejects(submitStaffReview(args), /Status saved/);
  assert.deepEqual(queued, ['approved', 'report', 'approved']); assert.equal(f.updates, 1);
});

test('live submission refresh updates untouched actions while retaining edited priority and action', () => {
  const h = createHarness({
    '../../../../components/submissions/StaffReviewFiles': { default: 'StaffReviewFiles', __esModule: true },
    '../../../../components/staff/SelectField': { default: 'SelectField', __esModule: true },
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ isPending: false }) },
    '../../../../services/submissionsService': {}, '../../../../services/reviewLogsService': {},
    '../../../../services/driveService': { driveService: { async getConnection() { return { connected: false }; } } },
    '../../../../services/prepareAttachment': {},
  });
  const Card = h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default;
  const submission = { submission_id: 'live', status: 'under_review', priority_escalation: false };
  const card = h.instance(Card, { submission });
  card.render({ submission: { ...submission, status: 'approved', priority_escalation: true } }); card.render();
  const selector = () => nodes(card.output).find(n => n.type === 'SelectField');
  assert.equal(selector().props.value.label, 'Approved'); assert.equal(byLabel(card.output, 'Priority escalation').props.value, true);
  selector().props.onChange(STAFF_REVIEW_ACTIONS[0]); byLabel(card.output, 'Priority escalation').props.onValueChange(false); card.render();
  card.render({ submission: { ...submission, status: 'rejected', priority_escalation: false } }); card.render();
  assert.equal(selector().props.value.label, 'On Process'); assert.equal(byLabel(card.output, 'Priority escalation').props.value, false);
});
