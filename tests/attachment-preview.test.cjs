const { test } = require('node:test');
const assert = require('node:assert/strict');
const { attachmentPreview, currentHistoryAttachments } = require('../src/components/submissions/attachmentPreviewPolicy.cjs');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const byLabel = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label || node.props?.label === label);
const pdf = { document_id: 'new', file_name: 'paper.pdf', mime_type: 'application/pdf', file_url: 'https://res.cloudinary.com/test/image/upload/v123/folder/paper.pdf' };
function contentElement(h, output) {
  const surface = nodes(output).find(node => node.type?.name === 'PreviewSurface');
  return nodes(h.instance(surface.type, surface.props).output).find(node => node.type?.name === 'PreviewContent');
}

test('Cloudinary PDF previews select WebP pages without changing the original download', () => {
  const preview = attachmentPreview(pdf, 2);
  assert.equal(preview.originalUrl, pdf.file_url);
  assert.equal(preview.previewUrl, 'https://res.cloudinary.com/test/image/upload/f_webp,q_auto,pg_2/v123/folder/paper.webp');
  assert.equal(preview.paged, true);
  assert.match(attachmentPreview(pdf, -4).previewUrl, /pg_1/);
  const forced = { ...pdf, file_url: pdf.file_url.replace('/v123/', '/fl_attachment/v123/') };
  assert.equal(attachmentPreview(forced).previewUrl.includes('fl_attachment'), false);
});

test('packaged multi-page WebP files stay intact, and private/raw/other-host PDFs are not rewritten', () => {
  const webp = { ...pdf, file_url: pdf.file_url.replace('.pdf', '.webp') };
  assert.equal(attachmentPreview(webp).previewUrl, webp.file_url);
  assert.equal(attachmentPreview(webp).paged, false);
  for (const url of [
    'https://res.cloudinary.com/test/raw/upload/v123/paper.pdf',
    'https://res.cloudinary.com/test/image/authenticated/v123/paper.pdf',
    'https://res.cloudinary.com/test/image/upload/s--signed--/v123/paper.pdf',
    pdf.file_url + '?token=private',
    'https://res.cloudinary.com.evil.test/test/image/upload/v123/paper.pdf',
  ]) {
    assert.equal(attachmentPreview({ ...pdf, file_url: url }).previewUrl, null);
    assert.equal(attachmentPreview({ ...pdf, file_url: url }).originalUrl, url);
  }
  for (const url of ['javascript:alert(1)', 'file:///private/file.pdf', 'https://user:secret@example.test/file.pdf', '']) {
    assert.equal(attachmentPreview({ ...pdf, file_url: url }).originalUrl, null);
  }
});

test('new same-status replacement is clickable only for staff and never aliases an older same-name file', () => {
  const old = { log_id: 'old', changed_at: '2026-11-17T10:00:00Z', attachment_change: { action: 'replaced', new_files: ['paper.pdf'] } };
  const latest = { ...old, log_id: 'latest', changed_at: '2026-11-17T11:00:01Z', old_status: 'under_review', new_status: 'under_review' };
  const file = { ...pdf, is_current: true, uploaded_at: '2026-11-17T11:00:00Z' };
  const entries = [latest, old];
  assert.deepEqual(currentHistoryAttachments(latest, entries, [file], true), [file]);
  assert.deepEqual(currentHistoryAttachments(old, entries, [file], true), []);
  assert.deepEqual(currentHistoryAttachments(old, [old], [file], true), []);
  assert.deepEqual(currentHistoryAttachments(latest, entries, [file], false), []);
  assert.deepEqual(currentHistoryAttachments(latest, entries, [{ ...file, is_current: false }], true), []);
  assert.deepEqual(currentHistoryAttachments(latest, entries, [file, { ...file, document_id: 'ambiguous' }], true), []);
});

test('ticket attachment tap opens in-app preview; external handoff is explicit and cancelling keeps preview mounted', async () => {
  const calls = [];
  const h = createHarness();
  h.native.Linking.openURL = async url => { calls.push(url); };
  const Row = h.load('src/components/submissions/SubmissionTicket.jsx').SubmissionAttachmentRow;
  const row = h.instance(Row, { name: pdf.file_name, document: pdf });
  byLabel(row.output, 'Preview paper.pdf').props.onPress(); row.render();
  assert.deepEqual(calls, []);
  const previewNode = nodes(row.output).find(node => node.type?.name === 'AttachmentPreview');
  assert.ok(previewNode);
  const preview = h.instance(previewNode.type, previewNode.props);
  const contentNode = contentElement(h, preview.output);
  const content = h.instance(contentNode.type, contentNode.props);
  const image = nodes(content.output).find(node => node.type === 'Image');
  image.props.onLoad({ nativeEvent: { source: { width: 1200, height: 1800 } } }); content.render();
  await byLabel(content.output, 'Open or download').props.onPress(); content.render();
  assert.deepEqual(calls, [pdf.file_url]);
  assert.ok(nodes(row.render()).some(node => node.type?.name === 'AttachmentPreview'));
  byLabel(content.output, 'Close preview').props.onPress();
  assert.equal(nodes(row.render()).find(node => node.type?.name === 'AttachmentPreview').props.document, null);
});

test('preview supports zoom, PDF page navigation, failed-page recovery and failed external open', async () => {
  const h = createHarness();
  const Preview = h.load('src/components/submissions/AttachmentPreview.jsx').default;
  const wrapper = h.instance(Preview, { document: pdf, onClose() {} });
  const contentNode = contentElement(h, wrapper.output);
  const view = h.instance(contentNode.type, contentNode.props);
  const image = () => nodes(view.output).find(node => node.type === 'Image');
  assert.equal(byLabel(view.output, 'Next page').props.disabled, true);
  image().props.onLoad({ nativeEvent: { source: { width: 1000, height: 2000 } } }); view.render();
  byLabel(view.output, 'Zoom in').props.onPress(); view.render();
  assert.match(textOf(view.output), /150%/);
  assert.equal(image().props.style.height, image().props.style.width * 2);
  byLabel(view.output, 'Next page').props.onPress(); view.render();
  assert.match(image().props.source.uri, /pg_2/);
  image().props.onError(); view.render();
  assert.match(textOf(view.output), /Page 2 could not be loaded/);
  assert.equal(byLabel(view.output, 'Previous page').props.disabled, false);
  byLabel(view.output, 'Retry preview').props.onPress(); view.render();
  assert.ok(image());
  byLabel(view.output, 'Previous page').props.onPress(); view.render();
  assert.match(image().props.source.uri, /pg_1/);
  h.native.Linking.openURL = async () => { throw new Error('no browser'); };
  await byLabel(view.output, 'Open or download').props.onPress(); view.render();
  assert.match(textOf(view.output), /Could not open the original/);
  assert.ok(image());
});

test('conversation renders replacement links for staff and keeps student filenames non-interactive', () => {
  const h = createHarness();
  const Conversation = h.load('src/components/submissions/SubmissionConversation.jsx').default;
  const log = { log_id: 'latest', old_status: 'under_review', new_status: 'under_review', changed_at: '2026-11-17T11:00:01Z', attachment_change: { action: 'replaced', new_files: ['paper.pdf'] } };
  const props = { access: { staff: true }, documents: [pdf], conversation: { entries: [log], logs: {} } };
  const conversation = h.instance(Conversation, props);
  const entryNode = nodes(conversation.output).find(node => node.type?.name === 'ConversationEntry');
  const entry = h.instance(entryNode.type, entryNode.props);
  const row = nodes(entry.output).find(node => node.type?.name === 'SubmissionAttachmentRow');
  assert.equal(row.props.document.file_url, pdf.file_url);
  const student = h.instance(entryNode.type, { ...entryNode.props, access: { staff: false } });
  assert.equal(nodes(student.output).some(node => node.type?.name === 'SubmissionAttachmentRow'), false);
  assert.match(textOf(student.output), /paper.pdf/);
});

test('rejected/student ticket never renders digital attachments; Drive archives preserve their original handoff', async () => {
  const h = createHarness();
  const { default: Ticket, SubmissionAttachmentRow: Row } = h.load('src/components/submissions/SubmissionTicket.jsx');
  for (const props of [
    { submission: { status: 'rejected', documents: [pdf] }, access: { staff: true } },
    { submission: { status: 'under_review', documents: [pdf] }, access: { staff: false } },
  ]) assert.equal(nodes(h.instance(Ticket, props).output).some(n => n.type === Row), false);
  const calls = []; h.native.Linking.openURL = async value => calls.push(value);
  const archive = h.instance(Row, { name: 'Archived file', url: 'https://drive.google.com/file/d/test/view', external: true });
  await byLabel(archive.output, 'Open Archived file').props.onPress(); archive.render();
  assert.equal(calls.length, 1);
  assert.equal(nodes(archive.output).some(n => n.type?.name === 'AttachmentPreview'), false);
});
