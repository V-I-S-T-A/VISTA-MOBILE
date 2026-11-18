const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const flat = value => Object.assign({}, ...[].concat(value || []).flat(Infinity));
const placeholders = tree => nodes(tree).filter(node => node.type?.name === 'Skeleton');
const busy = tree => {
  assert.equal(tree.props.accessibilityRole, 'progressbar');
  assert.equal(tree.props.accessibilityState.busy, true);
  assert.equal(nodes(tree).some(node => node.type === 'TouchableOpacity'), false, 'Loading shapes must not act like real controls');
};

for (const fontScale of [1, 1.6, 2]) test(`submission row loading follows the real three-line card at text scale ${fontScale}`, () => {
  const h = createHarness(); h.native.useWindowDimensions = () => ({ width: 390, height: 800, fontScale });
  const { SubmissionListSkeleton } = h.load('src/components/common/Skeleton.jsx');
  const actual = h.instance(h.load('src/components/submissions/SubmissionListCard.jsx').default, { submission: { title: 'Sample', status: 'under_review' } }).output;
  const tree = h.instance(SubmissionListSkeleton, { count: 1 }).output; busy(tree);
  const row = tree.props.children[0];
  for (const key of ['alignItems', 'gap', 'paddingHorizontal', 'paddingVertical', 'marginBottom', 'borderRadius', 'backgroundColor', 'borderWidth']) assert.equal(flat(row.props.style)[key], flat(actual.props.style)[key], key);
  const content = row.props.children[1], actualContent = actual.props.children[2];
  assert.equal(content.props.children[0].props.height, actualContent.props.children[0].props.style.lineHeight * fontScale);
  assert.equal(flat(content.props.children[1].props.style).flexDirection, flat(actualContent.props.children[1].props.style).flexDirection);
  assert.equal(flat(content.props.children[1].props.style).marginTop, flat(actualContent.props.children[1].props.style).marginTop);
  assert.equal(flat(content.props.children[1].props.style).marginBottom, flat(actualContent.props.children[1].props.style).marginBottom);
  assert.equal(content.props.children[2].props.children.props.height, h.load('src/theme/tokens.js').type.listDate.lineHeight * fontScale);
});

for (const fontScale of [1, 2]) test(`notification loading preserves row spacing and all text lines at scale ${fontScale}`, () => {
  const h = createHarness(); h.native.useWindowDimensions = () => ({ width: 390, height: 800, fontScale });
  const actual = h.instance(h.load('src/components/students/StudentNotificationListItem.jsx').default, { notification: { submission_title: 'Sample', is_read: false } }).output;
  const tree = h.instance(h.load('src/components/common/Skeleton.jsx').NotificationsSkeleton, { count: 1 }).output; busy(tree);
  const row = tree.props.children[0];
  for (const key of ['minHeight', 'gap', 'paddingHorizontal', 'paddingVertical', 'marginBottom', 'borderRadius', 'alignItems']) assert.equal(row.props.style[key], actual.props.style[key], key);
  const content = row.props.children[1], actualContent = actual.props.children[1];
  assert.equal(content.props.children[0].props.children[0].props.height, actualContent.props.children[0].props.children[0].props.style.lineHeight * fontScale);
  assert.equal(content.props.children[1].props.height, actualContent.props.children[1].props.style.lineHeight * fontScale);
  assert.equal(content.props.children[2].props.children[1].props.height, actualContent.props.children[2].props.children[2].props.style.lineHeight * fontScale);
});

for (const [width, fontScale] of [[320, 1], [390, 1], [390, 1.3], [390, 2], [900, 1]]) test(`summary artwork and grid loading match content at ${width}px / scale ${fontScale}`, () => {
  const h = createHarness(); h.native.useWindowDimensions = () => ({ width, height: 800, fontScale });
  const actual = h.instance(h.load('src/components/submissions/SubmissionDashboardCards.jsx').default).output;
  const tree = h.instance(h.load('src/components/common/Skeleton.jsx').DashboardCardsSkeleton).output; busy(tree);
  assert.deepEqual(Array.from(tree.props.children, row => row.props.children.length), Array.from(actual.props.children, row => row.props.children.length));
  assert.equal(tree.props.style.marginBottom, actual.props.style.marginBottom);
  const tile = tree.props.children[0].props.children[0], card = actual.props.children[0].props.children[0];
  for (const key of ['aspectRatio', 'padding', 'borderRadius']) assert.equal(tile.props.style[key], card.props.style[key]);
  const art = tile.props.children[1].props.children[1];
  const actualSlot = nodes(card).find(node => node.props?.pointerEvents === 'none');
  assert.equal(art.props.width, actualSlot.props.style.width);
  assert.equal(art.props.height, actualSlot.props.style.height);
});

for (const staff of [false, true]) test(`${staff ? 'staff' : 'student'} details loading uses the actual ticket/banner and excludes obsolete action cards`, () => {
  const h = createHarness(); const { colors, radii } = h.load('src/theme/tokens.js');
  const actual = h.instance(h.load('src/components/submissions/SubmissionTicket.jsx').default, { submission: { status: 'under_review' }, access: { staff } }).output;
  const tree = h.instance(h.load('src/components/common/Skeleton.jsx').DetailsSkeleton, { staff }).output; busy(tree);
  const ticket = tree.props.children[0];
  assert.equal(ticket.props.style.backgroundColor, actual.props.style.backgroundColor);
  assert.equal(ticket.props.style.borderRadius, radii.card);
  assert.equal(ticket.props.children[0].props.style.padding, actual.props.children[0].props.style.padding);
  assert.equal(ticket.props.children[0].props.children[0].type, actual.props.children[0].props.children[0].type, 'One shared responsive local banner');
  assert.equal(tree.props.children.length, 3, 'Ticket, conversation heading, conversation only');
  assert.equal(tree.props.children[2].type.name, 'ConversationSkeleton');
  assert.equal(nodes(tree).some(node => node.props?.style?.backgroundColor === '#1C1033'), false);
});

test('profile loading shares panel/avatar geometry, responsive gutters and optional organization with the real screen', () => {
  const query = { isPending: true };
  const auth = { useAuth: () => ({ user: { user_id: 'sample', department: 'Example organization' }, updateUser() {} }) };
  const h = createHarness({ '../../context/AuthContext': auth, '@tanstack/react-query': { useQuery: () => query } });
  const { ProfileSkeleton } = h.load('src/components/common/Skeleton.jsx'), { profileLayout, sizes } = h.load('src/theme/tokens.js');
  const screen = h.instance(h.load('src/screens/shared/EditProfileScreen.jsx').default, { navigation: {} });
  const slot = nodes(screen.output).find(node => node.type === ProfileSkeleton);
  assert.equal(slot.props.hasOrganization, true);
  const tree = h.instance(ProfileSkeleton, slot.props).output; busy(tree);
  const panel = tree.props.children[1];
  assert.equal(panel.props.style.marginTop, profileLayout.panelTopGap);
  assert.equal(panel.props.children[0].props.style.top, profileLayout.avatarTop);
  assert.ok(placeholders(tree).some(node => node.props.width === sizes.avatarProfile && node.props.height === sizes.avatarProfile));
  const scroll = nodes(tree).find(node => node.type === 'ScrollView');
  assert.equal(scroll.props.contentContainerStyle.paddingTop, profileLayout.contentTop);
  assert.equal(scroll.props.contentContainerStyle.maxWidth, sizes.contentWidth);
  assert.equal(scroll.props.contentContainerStyle.justifyContent, 'space-between');
  const withoutOrganization = h.instance(ProfileSkeleton, { hasOrganization: false }).output;
  assert.equal(placeholders(tree).length - placeholders(withoutOrganization).length, 3);
  query.isPending = false; screen.render();
  const loadedPanel = nodes(screen.output).find(node => Array.isArray(node.props?.style) && flat(node.props.style).marginTop === profileLayout.panelTopGap);
  assert.ok(loadedPanel, 'Real panel uses exactly the same geometry tokens');
});

test('document entry loading reserves all six fields, priority, attachment and submit controls', () => {
  const h = createHarness(), { FormSkeleton } = h.load('src/components/common/Skeleton.jsx');
  const tree = h.instance(FormSkeleton, { compact: true }).output; busy(tree);
  const { space, sizes, reviewControls } = h.load('src/theme/tokens.js');
  assert.equal(tree.props.style.padding, space.lg);
  const fields = tree.props.children[0]; assert.equal(fields.length, 6);
  for (const field of fields) {
    assert.equal(field.props.children[1].props.style.minHeight, sizes.touch);
    assert.equal(field.props.children[1].props.children.props.height, reviewControls.fieldHeight);
  }
  assert.equal(tree.props.children[1].props.style.minHeight, reviewControls.fieldHeight);
  const attached = h.instance(FormSkeleton, { compact: true, hasAttachment: true }).output;
  assert.equal(attached.props.children[2].props.height, reviewControls.attachmentHeight);
  assert.ok(placeholders(tree).length > placeholders(attached).length, 'Empty-document space is absent when a local draft is attached');
});

for (const variant of ['select', 'academicYear', 'drive']) test(`${variant} option loading matches its own row structure`, () => {
  const h = createHarness(), { DropdownSkeleton } = h.load('src/components/common/Skeleton.jsx'), { sizes, space } = h.load('src/theme/tokens.js');
  const tree = h.instance(DropdownSkeleton, { variant, count: 2 }).output; busy(tree);
  assert.equal(tree.props.children.length, 2);
  assert.ok(tree.props.children.every(row => row.props.style.minHeight === sizes.touch));
  const row = tree.props.children[0].props.children;
  assert.equal(row.props.style.borderBottomWidth, variant === 'academicYear' ? 0 : 1);
  assert.equal(tree.props.style.gap, variant === 'academicYear' ? space.xs : 0);
  assert.equal(placeholders(row).length, variant === 'select' ? 1 : 2);
});

test('typing drafts reuses normalized history, while fresh pages and errors recompute it', () => {
  const query = { data: { pages: [{ results: [{ log_id: 'a', new_status: 'under_review' }] }] } };
  const client = { getQueryData() {}, setQueryData() {} };
  const h = createHarness({ '@tanstack/react-query': { useInfiniteQuery: () => query, useQueryClient: () => client } });
  const hook = h.instance(h.load('src/hooks/useSubmissionConversation.js').default, { submissionId: 'sample', scope: 'staff:sample', access: { staff: true }, enabled: true });
  const first = hook.output.entries;
  hook.output.changeUpdateDraft('A local draft'); hook.render();
  assert.equal(hook.output.entries, first);
  query.data = { pages: [{ results: [{ log_id: 'b' }, ...first] }] }; hook.render();
  assert.notEqual(hook.output.entries, first);
  assert.equal(hook.output.entries[0].log_id, 'b');
  query.isError = true; hook.render(); assert.equal(hook.output.entries.length, 0);
});

test('cached attachment mapping survives draft renders but immediately respects changed permissions and files', () => {
  const h = createHarness(), Conversation = h.load('src/components/submissions/SubmissionConversation.jsx').default;
  const log = { log_id: 'a', changed_at: '2026-11-17T08:00:00Z', attachment_change: { action: 'added', new_files: ['sample.pdf'] } };
  const doc = { file_name: 'sample.pdf', file_url: 'https://example.com/sample.pdf', is_current: true };
  const props = { conversation: { logs: {}, entries: [log] }, access: { staff: true }, documents: [doc] };
  const screen = h.instance(Conversation, props);
  const attachments = () => nodes(screen.output).find(node => node.type?.name === 'ConversationEntry').props.attachments;
  const first = attachments(); assert.equal(first[0], doc);
  screen.render({ ...props, conversation: { ...props.conversation, draft: 'Typing' } }); assert.equal(attachments(), first);
  screen.render({ ...props, access: { staff: false } }); assert.equal(attachments().length, 0);
  screen.render({ ...props, documents: [{ ...doc, is_current: false }] }); assert.equal(attachments().length, 0);
  screen.render({ ...props, documents: [{ ...doc, file_url: 'https://example.com/replacement.pdf' }] }); assert.equal(attachments()[0].file_url, 'https://example.com/replacement.pdf');
});
