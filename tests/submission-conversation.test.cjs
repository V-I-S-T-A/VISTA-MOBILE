const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const { capabilities, canReplyTo, prepareReply, viewerScope, safeWebUrl, nextPage, uniqueRows, STATUS_TRANSITIONS } = require('../src/components/submissions/conversationPolicy.cjs');
const { confirmReply } = require('../src/components/submissions/confirmReply.cjs');

const owner = { user_id: 7, role: 'student', org_id: 1, org_joined_at: '2026-10-01' };
const submission = { submission_id: 'submission-a', submitted_by: 7, status: 'approved', priority_escalation: false, title: 'A long organization submission title', submitted_at: '2026-10-31T01:00:00Z', documents: [{ document_id: 'private', file_name: 'confidential.pdf', file_url: 'https://private.test/final', is_current: true }], drive_archives: [{ archive_id: 'archive', file_name: 'confidential-final.pdf', drive_view_link: 'https://drive.google.com/private' }] };
const log = { log_id: 'log-a', can_reply: true, reply_count: 1, remarks_text: 'Please confirm.', old_status: 'under_review', new_status: 'approved', changed_by_name: 'Reviewer', changed_at: '2026-10-31T01:00:00Z' };

test('authenticated viewer retains owner/staff permissions with one shared cosmic banner', () => {
  for (const role of ['staff', 'admin']) {
    const access = capabilities(submission, { user_id: 9, role });
    assert.equal(access.banner, 'cosmic'); assert.equal(access.staff, true); assert.equal(canReplyTo(log, access), true);
  }
  const own = capabilities(submission, owner), peer = capabilities(submission, { ...owner, user_id: 8 });
  assert.equal(own.banner, 'cosmic'); assert.equal(own.owner, true); assert.equal(canReplyTo(log, own), true);
  assert.equal(peer.banner, 'cosmic'); assert.equal(peer.viewOnly, true); assert.equal(canReplyTo(log, peer), false);
  assert.equal(canReplyTo({ ...log, can_reply: undefined }, own), false);
  assert.equal(capabilities({}, owner).owner, false);
  assert.notEqual(viewerScope(owner), viewerScope({ ...owner, org_joined_at: null }));
  assert.notEqual(viewerScope(owner), viewerScope({ ...owner, user_id: 8 }));
});

test('every viewer uses one bounded cosmic banner with explicit image dimensions', () => {
  const h = createHarness(); const Banner = h.load('src/components/submissions/TicketBanner.jsx').default;
  for (const role of ['student', 'staff', 'admin']) {
    const tree = h.instance(Banner, { viewerRole: role }).output;
    const image = nodes(tree).find(n => n.type === 'Image');
    assert.match(image.props.source, /ticket-staff-cosmic.webp$/);
    assert.equal(image.props.resizeMode, 'cover');
    const imageStyle = Object.assign({}, ...image.props.style);
    assert.equal(imageStyle.width, '100%'); assert.equal(imageStyle.height, 96);
    assert.equal(imageStyle.position, 'absolute');
    assert.equal(Object.assign({}, ...tree.props.style).height, 96);
  }
});

test('measured Android banner heights stay compact at small widths and update after width changes', () => {
  for (const width of [280, 320, 360, 393, 410, 480, 600, 800]) {
    const h = createHarness(); h.native.useWindowDimensions = () => ({ width });
    const layout = h.load('src/theme/layout.js').useStaffLayout();
    const usable = width - layout.body.paddingLeft - layout.body.paddingRight;
    assert.ok(usable > 0 && usable <= 600);
    assert.ok(layout.body.paddingLeft >= (width < 360 ? 16 : 20));
    const Banner = h.load('src/components/submissions/TicketBanner.jsx').default;
    const banner = h.instance(Banner, { viewerRole: 'staff' });
    const bannerWidth = usable - 32; // ticket's two 16px inner gutters
    banner.output.props.onLayout({ nativeEvent: { layout: { width: bannerWidth } } });
    banner.render();
    const frame = Object.assign({}, ...banner.output.props.style);
    assert.equal(frame.width, '100%'); assert.equal(frame.overflow, 'hidden');
    assert.ok(frame.height >= 80 && frame.height <= 160);
    assert.ok(frame.height <= usable / 3 + 5);
    // Match Image.android.js: the static source supplies width/height before
    // user styles. The 941px intrinsic height must never survive that merge.
    const image = nodes(banner.output).find(n => n.type === 'Image');
    const nativeImageStyle = Object.assign({ width: 1672, height: 941 }, ...image.props.style);
    assert.equal(nativeImageStyle.width, '100%');
    assert.ok(nativeImageStyle.height >= frame.height && nativeImageStyle.height < 321);
    assert.ok(nativeImageStyle.top <= 0);
    assert.ok(nativeImageStyle.top + nativeImageStyle.height >= frame.height);
    banner.output.props.onLayout({ nativeEvent: { layout: { width: 568 } } }); banner.render();
    assert.equal(Object.assign({}, ...banner.output.props.style).height, 160);
    banner.output.props.onLayout({ nativeEvent: { layout: { width: 256 } } }); banner.render();
    assert.equal(Object.assign({}, ...banner.output.props.style).height, 80);
  }
});

test('student owner and peer ticket do not contain confidential documents or Drive URLs', () => {
  const h = createHarness(); const Ticket = h.load('src/components/submissions/SubmissionTicket.jsx').default;
  for (const user of [owner, { ...owner, user_id: 8 }]) {
    const tree = h.instance(Ticket, { submission, viewerRole: user.role, user, access: capabilities(submission, user) }).output;
    assert.doesNotMatch(JSON.stringify(tree), /confidential|private\.test|drive.google/);
    assert.match(textOf(tree), /restricted to OSA staff/);
  }
  const staff = { role: 'staff', user_id: 9 };
  const tree = h.instance(Ticket, { submission, viewerRole: staff.role, user: staff, access: capabilities(submission, staff) }).output;
  assert.match(JSON.stringify(tree), /confidential.pdf/); assert.match(JSON.stringify(tree), /drive.google/);
  const rejected = h.instance(Ticket, { submission: { ...submission, status: 'rejected' }, viewerRole: 'staff', access: capabilities(submission, staff), user: staff }).output;
  assert.doesNotMatch(JSON.stringify(rejected), /private\.test|drive.google/);
});

test('staff ticket retains authorized submitter identity with the shared cosmic banner', () => {
  const h = createHarness(); const Ticket = h.load('src/components/submissions/SubmissionTicket.jsx').default;
  const user = { role: 'staff', user_id: 9 };
  const tree = h.instance(Ticket, { submission, viewerRole: user.role, access: capabilities(submission, user), user,
    submitter: { user_id: 7, role: 'student', image_url: 'https://avatar.test/submitter' } }).output;
  assert.match(textOf(tree), /Student · Original submitter/);
  assert.match(JSON.stringify(tree), /avatar.test\/submitter/);
  assert.equal(nodes(tree).some(n => typeof n.type === 'function' && n.type.name === 'TicketBanner'), true);
});

test('submitter lookup matches exact owner ID and is optional when not authorized by the server', async () => {
  let response = { results: [{ user_id: 8, email: 'similar@example.test' }, { user_id: 7, role: 'student', image_url: 'https://avatar.test/owner' }] };
  const calls = [];
  const h = createHarness({ '../lib/apiClient': { apiClient: { async get(url, config) { calls.push({ url, config }); return { data: response }; } }, unwrapApiError: error => error }, '../config/api': { API_ENDPOINTS: { USERS: { LIST: '/users/' } } } });
  const service = h.load('src/services/usersService.js').usersService;
  const record = await service.getSubmissionSubmitter({ ...submission, submitted_by_email: 'owner@example.test' });
  assert.equal(record.user_id, 7); assert.equal(calls[0].config.params.search, 'owner@example.test');
  response = { results: [{ user_id: 8 }] };
  assert.equal(await service.getSubmissionSubmitter({ ...submission, submitted_by_email: 'owner@example.test' }), null);
  assert.equal(await service.getSubmissionSubmitter(submission), null);
});

test('avatar uses the bundled default on missing and failed images and recovers for a new URL', () => {
  const h = createHarness(); const Avatar = h.load('src/components/common/UserAvatar.jsx').default;
  const avatar = h.instance(Avatar, { uri: undefined });
  assert.match(avatar.output.props.source, /default_user.webp$/);
  avatar.render({ uri: 'https://avatar.test/one' }); avatar.output.props.onError(); avatar.render();
  assert.match(avatar.output.props.source, /default_user.webp$/);
  avatar.render({ uri: 'https://avatar.test/two' });
  assert.match(avatar.output.props.source, /default_user.webp$/);
  avatar.output.props.onLoad(); avatar.render();
  assert.equal(avatar.output.props.source.uri, 'https://avatar.test/two');
});

test('safe message links allow HTTP(S), rejecting executable/local/custom schemes', () => {
  for (const value of ['javascript:alert(1)', 'file:///secret', 'intent://private', 'data:text/html,a', 'bad']) assert.equal(safeWebUrl(value), null);
  assert.equal(safeWebUrl('https://example.test/path?q=x'), 'https://example.test/path?q=x');
});

test('reply payload handles text, URL, combined, unicode limit and stable retries per target', () => {
  const requests = {};
  for (const message of ['Hello', 'https://example.test', 'Hello https://example.test']) {
    const first = prepareReply(message, '', 'log-a', null, requests, randomUUID);
    const retry = prepareReply(` ${message} `, '', 'log-a', null, requests, randomUUID);
    assert.deepEqual(first, retry); assert.match(first.client_request_id, /^[0-9a-f-]{36}$/);
  }
  const first = prepareReply('Hello', '', 'log-a', null, requests, randomUUID);
  const parent = prepareReply('Hello', '', 'log-a', 'reply-b', requests, randomUUID);
  assert.notEqual(first.client_request_id, parent.client_request_id);
  prepareReply('Changed', '', 'log-a', null, requests, randomUUID);
  assert.equal(prepareReply('Hello', '', 'log-a', null, requests, randomUUID).client_request_id, first.client_request_id);
  assert.throws(() => prepareReply(' ', '', 'a', null, requests, randomUUID));
  assert.throws(() => prepareReply('x'.repeat(51), '', 'a', null, requests, randomUUID));
  assert.equal([...prepareReply('😀'.repeat(50), '', 'a', null, requests, randomUUID).message].length, 50);
});

test('fresh reply verification traverses pages and rejects absent or mismatched records', async () => {
  const saved = { reply_id: 'saved', message: 'Hello', parent_reply: null }, calls = [];
  const fresh = await confirmReply(saved, async page => { calls.push(page); return { results: page === 2 ? [saved] : [], next: page === 1 ? 'next' : null, current_page: page }; });
  assert.deepEqual(calls, [1, 2]); assert.equal(fresh.pages[1].results[0].message, 'Hello');
  await assert.rejects(confirmReply(saved, async () => ({ results: [], next: null })), /not be confirmed/);
  await assert.rejects(confirmReply(saved, async () => ({ results: [{ ...saved, message: 'different' }], next: null })), /not be confirmed/);
  assert.equal(nextPage({ next: 'x', current_page: 2 }), 3);
  assert.equal(nextPage({ next: null }), undefined);
  assert.deepEqual(uniqueRows([{ results: [{ log_id: 'a' }] }, { results: [{ log_id: 'a' }, { log_id: 'b' }] }], 'log_id').map(row => row.log_id), ['a', 'b']);
});

test('conversation preserves Latest, same-status remarks, read-only replies and pagination errors', () => {
  const query = { data: { pages: [{ results: [], count: 1 }] }, isPending: false, isError: false, hasNextPage: true, fetchNextPage() {}, refetch() {} };
  const h = createHarness({ '@tanstack/react-query': { useInfiniteQuery: () => query }, '../../services/reviewLogsService': { reviewLogsService: {} } });
  const Entry = h.load('src/components/submissions/ConversationEntry.jsx').default;
  const props = { log: { ...log, old_status: 'approved' }, latest: true, access: capabilities(submission, { ...owner, user_id: 8 }), onAccessLost() {} };
  const entry = h.instance(Entry, props);
  assert.match(textOf(entry.output), /Latest/); assert.match(textOf(entry.output), /Review update/);
  assert.equal(nodes(entry.output).some(n => n.props?.accessibilityLabel === 'Reply'), false);
  nodes(entry.output).find(n => n.props?.accessibilityState)?.props.onPress(); entry.render();
  assert.match(textOf(entry.output), /Load more replies/);
  query.isError = true; entry.render(); assert.match(textOf(entry.output), /Tap to retry/);
});

function conversationFixture() {
  const store = new Map();
  const client = { getQueryData: key => store.get(JSON.stringify(key)), setQueryData: (key, value) => store.set(JSON.stringify(key), value), async invalidateQueries() {} };
  const query = { data: { pages: [{ results: [log] }] }, isError: false };
  const service = { async createReply() {}, async getReplies() {} };
  const h = createHarness({ '@tanstack/react-query': { useQueryClient: () => client, useInfiniteQuery: () => query }, 'expo-modules-core': { uuid: { v4: randomUUID } }, '../services/reviewLogsService': { reviewLogsService: service } });
  const hook = h.load('src/hooks/useSubmissionConversation.js').default;
  const args = { submissionId: submission.submission_id, scope: viewerScope(owner), access: capabilities(submission, owner), enabled: true, onAccessLost() {} };
  return { h, hook, args, service, query, client };
}

test('message and link drafts stay scoped to each target across cancel, retarget and remount', () => {
  const f = conversationFixture();
  const form = f.h.instance(f.hook, f.args);
  form.output.selectTarget(log); form.render();
  form.output.changeDraft('Unsent root'); form.render();
  form.output.changeLink('https://example.test/root'); form.render();
  form.output.selectTarget(log, { reply_id: 'child', author_name: 'Student' }); form.render();
  assert.equal(form.output.draft, ''); assert.equal(form.output.link, '');
  form.output.changeLink('https://example.test/child'); form.render();
  form.output.cancel(); form.render(); form.unmount();
  const restored = f.h.instance(f.hook, f.args);
  restored.output.selectTarget(log); restored.render();
  assert.equal(restored.output.draft, 'Unsent root');
  assert.equal(restored.output.link, 'https://example.test/root');
  restored.output.selectTarget(log, { reply_id: 'child' }); restored.render();
  assert.equal(restored.output.link, 'https://example.test/child');
  const otherAccount = f.h.instance(f.hook, { ...f.args, scope: 'different-account' });
  otherAccount.output.selectTarget(log); otherAccount.render();
  assert.equal(otherAccount.output.link, ''); assert.equal(otherAccount.output.draft, '');
});

test('ambiguous link-reply failures retain the payload token and clear only after a fresh GET confirms persistence', async () => {
  const f = conversationFixture(), payloads = [];
  f.service.createReply = async (_id, payload) => { payloads.push(payload); return { reply_id: 'saved', ...payload }; };
  f.service.getReplies = async () => { throw new Error('Read unavailable'); };
  const form = f.h.instance(f.hook, f.args);
  form.output.selectTarget(log); form.render(); form.output.changeLink('https://example.test/notes'); form.render();
  await form.output.send(); form.render();
  assert.equal(form.output.link, 'https://example.test/notes');
  assert.match(form.output.error, /draft is retained/);
  f.service.getReplies = async () => ({ results: [{ reply_id: 'saved', ...payloads[0] }], next: null });
  await form.output.send(); form.render();
  assert.equal(payloads[0].client_request_id, payloads[1].client_request_id);
  assert.equal(payloads[0].message, 'https://example.test/notes');
  assert.equal(form.output.target, null); assert.equal(form.output.link, '');
  assert.match(form.output.notice, /sent and confirmed/);
});

test('reply double tap dispatches once; failed confirmation retains draft/token across remount', async () => {
  const f = conversationFixture(); let release, payloads = [];
  const gate = new Promise(resolve => { release = resolve; });
  f.service.createReply = async (_id, payload) => { payloads.push(payload); await gate; throw new Error('Network failed'); };
  const instance = f.h.instance(f.hook, f.args);
  instance.output.selectTarget(log); instance.render(); instance.output.changeDraft('Please confirm'); instance.render();
  const first = instance.output.send(), second = instance.output.send(); await second;
  assert.equal(payloads.length, 1); release(); await first; instance.render();
  assert.equal(instance.output.draft, 'Please confirm'); assert.match(instance.output.error, /draft is retained/);
  instance.unmount();
  const remounted = f.h.instance(f.hook, f.args);
  remounted.output.selectTarget(log); remounted.render(); assert.equal(remounted.output.draft, 'Please confirm');
  f.service.createReply = async (_id, payload) => { payloads.push(payload); return { reply_id: 'persisted', ...payload }; };
  f.service.getReplies = async () => ({ results: [{ reply_id: 'persisted', ...payloads.at(-1) }], next: null });
  await remounted.output.send(); remounted.render();
  assert.equal(payloads[0].client_request_id, payloads[1].client_request_id);
  assert.equal(remounted.output.draft, ''); assert.match(remounted.output.notice, /sent and confirmed/);
});

test('organization viewer never posts replies even if a stale log advertises can_reply', async () => {
  const f = conversationFixture(); let calls = 0;
  f.service.createReply = async () => { calls++; };
  const peer = { ...owner, user_id: 8 };
  const instance = f.h.instance(f.hook, { ...f.args, access: capabilities(submission, peer) });
  instance.output.selectTarget(log); instance.render(); await instance.output.send();
  assert.equal(instance.output.target, null); assert.equal(calls, 0); assert.equal(instance.output.hasReply, false);
});

test('all existing canonical status transitions are retained, including pending to approved', () => {
  assert.deepEqual(STATUS_TRANSITIONS.pending, ['under_review', 'approved', 'rejected', 'resubmission_required']);
  for (const [current, choices] of Object.entries(STATUS_TRANSITIONS)) {
    assert.equal(choices.includes(current), false);
    for (const target of choices) assert.ok(Object.hasOwn(STATUS_TRANSITIONS, target));
  }
});

test('reply permission loss fails closed; different targets preserve separate drafts', async () => {
  const f = conversationFixture(); let denied = 0;
  const instance = f.h.instance(f.hook, { ...f.args, onAccessLost: () => { denied++; } });
  instance.output.selectTarget(log); instance.render(); instance.output.changeDraft('Root draft'); instance.render();
  instance.output.selectTarget(log, { reply_id: 'child', author_name: 'Student' }); instance.render();
  assert.equal(instance.output.draft, ''); instance.output.changeDraft('Child draft'); instance.render();
  instance.output.cancel(); instance.render(); instance.output.selectTarget(log); instance.render();
  assert.equal(instance.output.draft, 'Root draft');
  f.service.createReply = async () => { const error = new Error('Forbidden'); error.status = 403; throw error; };
  await instance.output.send(); assert.equal(denied, 1);
});

test('staff remarks-only save verifies fresh status and remarks; duplicate tap saves once', async () => {
  let release, posts = 0, reads = 0, confirmed = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const alerts = [];
  const h = createHarness({
    '../../../../components/submissions/StaffReviewFiles': { default: 'StaffReviewFiles', __esModule: true },
    '../../../../services/driveService': { driveService: { async getConnection() { return { connected: false }; } } },
    '../../../../services/prepareAttachment': {},
    '../../../../components/common/VistaProcessing': { default: 'Processing', __esModule: true },
    '../../../../components/staff/SelectField': { default: 'SelectField', __esModule: true },
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ isPending: false, async mutateAsync(payload) { posts++; assert.equal(payload.status, undefined); assert.equal(payload.remarksText, 'Same status note'); await gate; } }) },
    '../../../../services/submissionsService': { submissionsService: { async getSubmission() { reads++; return { ...submission, status: 'pending' }; } } },
    '../../../../services/reviewLogsService': { reviewLogsService: { async listReviewLogs() { reads++; return { results: [{ remarks_text: 'Same status note', new_status: 'pending' }] }; } } },
  });
  h.native.Alert.alert = (...args) => alerts.push(args);
  const Card = h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default;
  const form = h.instance(Card, { submission: { ...submission, status: 'pending' }, onConfirmed: () => { confirmed++; } });
  nodes(form.output).find(n => typeof n.props?.onChangeText === 'function').props.onChangeText('Same status note'); form.render();
  const save = nodes(form.output).find(n => n.props?.accessibilityLabel === 'Update Status' && n.props.onPress);
  const first = save.props.onPress(), second = save.props.onPress();
  await second; assert.equal(posts, 1); release(); await first; form.render();
  assert.equal(reads, 2); assert.equal(confirmed, 1); assert.equal(alerts.at(-1)[0], 'Updated');
  assert.equal(nodes(form.output).find(n => typeof n.props?.onChangeText === 'function').props.value, '');
});

test('unconfirmed staff update retains remarks and never reports success', async () => {
  const alerts = [];
  const h = createHarness({
    '../../../../components/submissions/StaffReviewFiles': { default: 'StaffReviewFiles', __esModule: true },
    '../../../../services/driveService': { driveService: { async getConnection() { return { connected: false }; } } },
    '../../../../services/prepareAttachment': {},
    '../../../../components/common/VistaProcessing': { default: 'Processing', __esModule: true },
    '../../../../components/staff/SelectField': { default: 'SelectField', __esModule: true },
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ isPending: false, async mutateAsync() {} }) },
    '../../../../services/submissionsService': { submissionsService: { async getSubmission() { return submission; } } },
    '../../../../services/reviewLogsService': { reviewLogsService: { async listReviewLogs() { return { results: [] }; } } },
  });
  h.native.Alert.alert = (...args) => alerts.push(args);
  const form = h.instance(h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default, { submission: { ...submission, status: 'pending' } });
  nodes(form.output).find(n => typeof n.props?.onChangeText === 'function').props.onChangeText('Retain my note'); form.render();
  await nodes(form.output).find(n => n.props?.accessibilityLabel === 'Update Status').props.onPress(); form.render();
  assert.equal(alerts.at(-1)[0], 'Update not confirmed');
  assert.equal(nodes(form.output).find(n => typeof n.props?.onChangeText === 'function').props.value, 'Retain my note');
});

test('shared detail renderer gates composer/status/files and refuses stale details after errors', () => {
  const query = { data: submission, isPending: false, isError: false, isFetchedAfterMount: true };
  const approvedLog = { ...log, new_status: 'approved', changed_by_name: 'Approver' };
  let user = owner;
  const component = name => ({ default: name, __esModule: true });
  const h = createHarness({
    '@tanstack/react-query': { useQuery: () => query, useQueryClient: () => ({}) },
    '../../context/AuthContext': { useAuth: () => ({ user }) },
    '../../theme/layout': { useStaffLayout: () => ({ body: {} }), panelStyles: { touch: { minHeight: 48 } } },
    '../common/Skeleton': { DetailsSkeleton: 'DetailsSkeleton' },
    '../common/AccountHeader': component('AccountHeader'), '../common/PageHeading': component('PageHeading'), '../common/BackButton': component('BackButton'),
    '../staff/StaffBottomNav': component('StaffBottomNav'), '../students/StudentBottomNav': component('StudentBottomNav'), '../staff/DriveArchiveCard': component('DriveArchiveCard'),
    '../../services/submissionsService': { submissionsService: {} }, '../../services/usersService': { usersService: {} }, '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useSubmissionConversation': { default: () => ({ hasReply: true, target: { log, name: 'Staff' }, entries: [{ ...log, new_status: 'under_review' }, approvedLog], logs: {} }), __esModule: true },
    './ReviewDriveTask': component('ReviewDriveTask'), './SubmissionTicket': component('SubmissionTicket'), './SubmissionConversation': component('SubmissionConversation'), './ReplyComposer': component('ReplyComposer'), './StaffStatusSheet': component('StaffStatusSheet'),
  });
  const Screen = h.load('src/components/submissions/SubmissionDetailsScreen.jsx').default;
  function render() {
    const outer = h.instance(Screen, { route: { params: { submission } }, navigation: {} });
    return h.instance(outer.output.type, outer.output.props).output;
  }
  let tree = render();
  const kavNode = nodes(tree).find(n => n.type === 'KeyboardAvoidingView');
  assert.equal(kavNode.props.behavior, 'padding');
  assert.equal(kavNode.key, undefined);
  assert.equal(nodes(tree).some(n => n.type === 'ReplyComposer'), true);
  const composerContainer = nodes(tree).find(n => (n.props?.children?.type === 'ReplyComposer' || (Array.isArray(n.props?.children) && n.props.children.some(c => c?.type === 'ReplyComposer'))));
  assert.ok(composerContainer, 'ReplyComposer container wrapper must exist');
  const compStyle = Object.assign({}, ...[].concat(composerContainer.props?.style || {}));
  assert.equal(compStyle.width, '100%', 'Comment bar spans the viewport while a separate footer clears navigation');
  assert.equal(compStyle.alignSelf, 'center');
  assert.equal(nodes(tree).some(n => n.type === 'StaffStatusSheet'), false);
  assert.equal(nodes(tree).some(n => n.type === 'DriveArchiveCard'), false);
  user = { ...owner, user_id: 8 }; tree = render();
  assert.match(textOf(tree), /Organization Submission — View Only/);
  assert.equal(nodes(tree).some(n => n.type === 'ReplyComposer'), false);
  user = { role: 'staff', user_id: 9 }; tree = render();
  assert.equal(nodes(tree).some(n => n.type === 'StaffStatusSheet'), true);
  assert.equal(nodes(tree).some(n => n.type === 'DriveArchiveCard'), true);
  assert.equal(nodes(tree).find(n => n.type === 'DriveArchiveCard').props.handledBy, approvedLog);
  assert.equal(nodes(tree).find(n => n.type === 'SubmissionTicket').props.viewerRole, 'staff');
  query.isError = true; tree = render();
  assert.equal(nodes(tree).some(n => n.type === 'SubmissionTicket'), false);
  assert.equal(nodes(tree).some(n => n.type === 'StaffStatusSheet'), false);
  assert.match(textOf(tree), /Could not load submission details/);
  query.isError = false; query.isFetchedAfterMount = false; tree = render();
  assert.equal(nodes(tree).some(n => n.type === 'SubmissionTicket'), false);
  assert.equal(nodes(tree).some(n => n.type === 'DetailsSkeleton'), true);
});
