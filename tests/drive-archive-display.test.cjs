const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const saved = { archive_id: 'archive', drive_file_id: 'file', file_name: 'Certificate of Compliance.pdf',
  drive_view_link: 'https://drive.google.com/file/d/example/view', root_folder_name: 'OSA documents',
  folder_path: ['2026-2027', 'University City Scholars - USTP', 'Student Activity Request Form (SARF)'],
  upload_kind: 'approved', archived_by_name: 'Uploader' };
const byLabel = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label || node.props?.label === label);
const flat = value => Object.assign({}, ...[value].flat());
function expand(h, node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(child => expand(h, child));
  if (['SavedArchive', 'PathStep'].includes(node.type?.name)) return expand(h, h.instance(node.type, node.props).output);
  return { ...node, props: { ...node.props, children: expand(h, node.props?.children) } };
}
function fixture(archives = [saved], handledBy = { changed_by_name: 'Reviewer' }, extra = {}) {
  const alerts = [];
  const h = createHarness({ '../common/AppDialog': { AppAlert: { alert: (...args) => alerts.push(args) } } });
  const Card = h.load('src/components/staff/DriveArchiveCard.jsx').default;
  const view = h.instance(Card, { submission: { status: 'approved', drive_archives: archives, ...extra }, handledBy });
  return { h, Card, view, alerts, tree: () => expand(h, view.output) };
}

test('saved archive matches web metadata and exposes the exact original Drive link', async () => {
  const f = fixture(); const tree = f.tree(); const content = textOf(tree);
  for (const text of ['Archived to Drive', saved.root_folder_name, ...saved.folder_path, saved.file_name, 'Approved File', 'Handled by Reviewer', 'Archived by Uploader']) assert.ok(content.includes(text), text);
  const urls = []; f.h.native.Linking.openURL = async url => urls.push(url);
  const button = byLabel(tree, `Open ${saved.file_name} in Google Drive`);
  assert.equal(button.props.accessibilityRole, 'link');
  await button.props.onPress(); assert.deepEqual(urls, [saved.drive_view_link]);
  const nativeButton = f.h.instance(button.type, button.props).output;
  assert.ok(flat(nativeButton.props.style).minHeight >= 48);
});

test('approval and pending uploads never fabricate a confirmed location', () => {
  const f = fixture([], { changed_by_name: 'Reviewer' }, { drive_sync_result: { status: 'queued' }, title: 'Guessed location' });
  const text = textOf(f.tree());
  assert.match(text, /Approval recorded/); assert.match(text, /no saved Google Drive location/);
  assert.doesNotMatch(text, /Archived to Drive|Guessed location|Automated subfolder/);
  assert.equal(byLabel(f.tree(), 'Open in Drive'), undefined);
  assert.equal(fixture([], null).view.output, null);
  for (const status of ['under_review', 'rejected', 'pending']) assert.equal(fixture([saved], null, { status }).view.output, null);
  assert.match(textOf(fixture([saved], null, { status: 'Approved' }).tree()), /Archived to Drive/);
});

test('multiple archive destinations, report labels and missing details remain distinct without a connection lookup', () => {
  const report = { ...saved, archive_id: 'report', root_folder_name: 'Earlier saved root', upload_kind: 'report', file_name: 'Report.pdf', folder_path: [], archived_by_name: null, drive_view_link: '' };
  const f = fixture([saved, report], null);
  const entries = nodes(f.view.output).filter(node => node.type?.name === 'SavedArchive');
  const first = expand(f.h, f.h.instance(entries[0].type, entries[0].props).output);
  const second = expand(f.h, f.h.instance(entries[1].type, entries[1].props).output);
  assert.match(textOf(first), /OSA documents/); assert.doesNotMatch(textOf(first), /Earlier saved root/);
  assert.match(textOf(second), /Earlier saved root/); assert.match(textOf(second), /Accomplishment Report/);
  assert.match(textOf(second), /Folder path details are unavailable/); assert.match(textOf(second), /Drive link unavailable/);
  assert.match(textOf(first), /Handled by Uploader/); assert.doesNotMatch(textOf(first), /Archived by Uploader/);
});

test('long names remain readable and deeper paths do not keep shrinking the mobile column', () => {
  const path = Array.from({ length: 8 }, (_, index) => `${index} ${'Long organization or folder name '.repeat(3)}`);
  const f = fixture([{ ...saved, folder_path: path, file_name: 'Long approved filename '.repeat(12) }]);
  const tree = f.tree();
  for (const name of path) {
    const text = nodes(tree).find(node => node.type === 'Text' && textOf(node) === name);
    assert.ok(text); assert.equal(text.props.numberOfLines, undefined);
  }
  const insets = nodes(tree).map(node => flat(node.props?.style).marginLeft).filter(value => value !== undefined);
  assert.ok(insets.length >= 8); assert.ok(insets.every(value => value <= 16));
});

test('invalid links have no action and failed handoff shows the existing VISTA dialog', async () => {
  for (const link of ['', 'javascript:alert(1)', 'file:///private/archive']) {
    const f = fixture([{ ...saved, drive_view_link: link }]);
    assert.match(textOf(f.tree()), /Drive link unavailable/);
    assert.equal(byLabel(f.tree(), `Open ${saved.file_name} in Google Drive`), undefined);
  }
  const f = fixture(); f.h.native.Linking.openURL = async () => { throw new Error('offline'); };
  await byLabel(f.tree(), `Open ${saved.file_name} in Google Drive`).props.onPress();
  assert.equal(f.alerts[0][0], 'Could not open Google Drive');
});
