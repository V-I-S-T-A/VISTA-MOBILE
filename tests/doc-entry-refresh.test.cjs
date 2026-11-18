const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const file = name => ({ uri: `file:///fixture/${name}.jpg`, name: `${name}.jpg`, type: 'image/jpeg' });
const draft = (name = 'Detected document', code = 'FM-USTP-OSA-11') => ({
  status: 'draft_pending_review', display_name: name, template_confidence: 98,
  suggested_org_id: 3, suggested_doc_type_id: 5, suggested_category_id: 4,
  fields: { document_code: { value: code, needs_review: false } },
});

function fixture({ recognize = async () => draft(), prepare = async value => value, referenceError } = {}) {
  const requests = [], navigations = [], alerts = [], ocrFiles = [], preparedFiles = [];
  let resets = 0;
  const queryClient = { invalidateQueries: args => { requests.push(args.queryKey); } };
  const mutation = {
    isPending: false, reset: () => resets++,
    mutateAsync: value => { ocrFiles.push(value); return recognize(value); },
  };
  const h = createHarness({
    '@tanstack/react-query': { useQueryClient: () => queryClient },
    '../../../hooks/useConnectivity': { __esModule: true, default: () => true },
    '../../../components/common/AppDialog': { AppAlert: { alert: (...args) => alerts.push(args) } },
    '../../../components/common/AccountHeader': { __esModule: true, default: 'Header' },
    '../../../components/common/VistaProcessing': { __esModule: true, default: 'Processing' },
    '../../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'Preview' },
    '../../../utils/documentScan': {},
    '../../../services/prepareAttachment': { prepareAttachment: value => { preparedFiles.push(value); return prepare(value); } },
    '../../../hooks/useSubmissions': { useAutofillDocument: () => mutation },
    '../../../hooks/useOrganizations': {
      useOrganizations: () => ({ data: [{ org_id: 3, name: 'Fixture organization' }], error: referenceError }),
      useOrganizationUsers: id => ({ data: id ? [{ user_id: 7, first_name: 'Test', last_name: 'Student' }] : [] }),
    },
    '../../../hooks/useCategories': { useCategories: () => ({ data: [{ category_id: 4, name: 'Fixture category' }] }) },
    '../../../hooks/useDocumentTypes': { useDocumentTypes: () => ({ data: [{ doc_type_id: 5, name: 'Fixture type' }] }) },
    '../../../hooks/useAcademicYears': { useActiveAcademicYear: () => ({ data: { academic_year_id: 9, year: '2026–2027' } }) },
  });
  const navigation = { navigate: (...args) => navigations.push(args), setParams() {} };
  const page = h.instance(h.load('src/screens/staff/docEntry/StaffDocumentEntryContent.jsx').default, { navigation });
  page.render();
  const find = predicate => nodes(page.output).find(predicate);
  const field = label => find(node => node.props?.label === label);
  const title = () => find(node => node.props?.accessibilityLabel === 'Document title');
  const refresh = async () => { await find(node => node.type === 'ScrollView').props.refreshControl.props.onRefresh(); page.render(); };
  const scan = async value => { page.render({ ...page.props, initialAttachment: value }); await tick(); page.render(); page.render(); };
  return { page, find, field, title, refresh, scan, requests, navigations, alerts, ocrFiles, preparedFiles, resets: () => resets };
}

test('pull refresh removes the scanned preview and OCR output, resets entry fields, and retains the active year', async () => {
  const f = fixture();
  await f.scan(file('first'));
  assert.ok(f.find(node => node.type === 'Preview'));
  assert.match(textOf(f.page.output), /Detected: Detected document/);
  assert.equal(f.title().props.value, 'Detected document');
  assert.equal(f.field('Submitted by').props.value.id, 7);
  f.title().props.onChangeText('Manually edited title');
  f.find(node => node.props?.accessibilityLabel === 'Priority escalation').props.onValueChange(true);
  f.page.render();
  await f.refresh();
  f.page.render();
  assert.equal(f.find(node => node.type === 'Preview'), undefined);
  assert.doesNotMatch(textOf(f.page.output), /Detected:/);
  assert.ok(f.find(node => node.props?.title === 'Ready for your document'));
  assert.equal(f.title().props.value, '');
  for (const label of ['Organization', 'Document type', 'Category', 'Submitted by']) assert.equal(f.field(label).props.value, null, label);
  assert.equal(f.field('Academic year').props.value.id, 9);
  assert.equal(f.find(node => node.props?.accessibilityLabel === 'Priority escalation').props.value, false);
  assert.equal(f.resets(), 1);
  assert.deepEqual(f.requests.map(key => key[0]), ['organizations', 'categories', 'document-types', 'academic-years', 'users']);
  assert.equal(f.navigations.length, 0, 'Refreshing only resets local state and refetches reference lists');
  f.field('Submit').props.onPress();
  assert.equal(f.alerts.at(-1)[0], 'Missing title');
});

test('a new scan after refresh autofills a fresh title and description without the previous priority or attachment', async () => {
  const f = fixture({ recognize: async value => draft(value.name, value.name.startsWith('first') ? 'FM-USTP-OSA-11' : 'FM-USTP-OSA-010') });
  await f.scan(file('first'));
  f.title().props.onChangeText('Old manual title');
  f.find(node => node.props?.accessibilityLabel === 'Priority escalation').props.onValueChange(true);
  f.page.render();
  await f.refresh();
  await f.scan(file('second'));
  f.field('Submit').props.onPress();
  const [route, payload] = f.navigations[0];
  assert.equal(route, 'StaffSubmissionConfirmation');
  assert.equal(payload.draft.title, 'second.jpg');
  assert.equal(payload.draft.description, 'Document code: FM-USTP-OSA-010');
  assert.equal(payload.draft.priority_escalation, false);
  assert.equal(payload.draft.academic_year_id, 9);
  assert.equal(payload.file.uri, file('second').uri);
});

test('refresh during image preparation discards its late result before starting OCR', async () => {
  const pending = deferred();
  const f = fixture({ prepare: () => pending.promise });
  await f.scan(file('pending'));
  await f.refresh();
  pending.resolve(file('pending'));
  await tick(); f.page.render();
  assert.equal(f.ocrFiles.length, 0);
  assert.equal(f.find(node => node.type === 'Preview'), undefined);
  assert.equal(f.title().props.value, '');
  assert.equal(f.find(node => node.type === 'Processing').props.visible, false);
});

test('a refreshed entry ignores old OCR success and lets a newer scan remain busy until its own completion', async () => {
  const old = deferred(), current = deferred();
  const f = fixture({ recognize: value => value.name === 'old.jpg' ? old.promise : current.promise });
  await f.scan(file('old'));
  await f.refresh();
  await f.scan(file('current'));
  old.resolve(draft('Stale output'));
  await tick(); f.page.render();
  assert.equal(f.title().props.value, '');
  assert.equal(f.find(node => node.type === 'Processing').props.visible, true);
  current.resolve(draft('Current output'));
  await tick(); f.page.render();
  assert.equal(f.title().props.value, 'Current output');
  assert.equal(f.find(node => node.type === 'Preview').props.file.name, 'current.jpg');
  assert.equal(f.find(node => node.type === 'Processing').props.visible, false);
});

test('a discarded OCR failure does not show an obsolete error after refresh', async () => {
  const pending = deferred();
  const f = fixture({ recognize: () => pending.promise });
  await f.scan(file('old'));
  await f.refresh();
  pending.reject(new Error('Stale recognition failure'));
  await tick(); f.page.render();
  assert.equal(f.alerts.length, 0);
  assert.equal(f.find(node => node.type === 'Preview'), undefined);
  assert.equal(f.title().props.value, '');
});

test('form-option Retry preserves the unsaved document and entered values', async () => {
  const f = fixture({ referenceError: new Error('Options unavailable') });
  await f.scan(file('keep'));
  f.title().props.onChangeText('Keep this draft'); f.page.render();
  await f.find(node => node.props?.title === 'Could not load form options').props.onRetry();
  f.page.render();
  assert.equal(f.title().props.value, 'Keep this draft');
  assert.equal(f.find(node => node.type === 'Preview').props.file.name, 'keep.jpg');
  assert.equal(f.field('Organization').props.value.id, 3);
  assert.equal(f.resets(), 0);
  assert.equal(f.requests.length, 5);
  assert.equal(f.navigations.length, 0);
});
