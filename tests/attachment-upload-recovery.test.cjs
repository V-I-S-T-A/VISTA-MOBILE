const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');

const file = { uri: 'file:///local-test.pdf', name: 'Review.pdf', type: 'application/pdf', size: 2048 };
const asset = { secure_url: 'https://res.cloudinary.com/fixture/upload/review.pdf', public_id: 'fixture/review', resource_type: 'raw', bytes: 2048 };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = () => new Promise(resolve => setImmediate(resolve));

function uploader(transport) {
  let nextId = 0; const timers = new Map(), calls = [];
  class LocalFormData { fields = []; append(key, value) { this.fields.push([key, value]); } }
  const exports = {};
  const code = babel.transformSync(fs.readFileSync('src/services/uploadAttachment.js', 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  vm.runInNewContext(code, { exports, AbortController, TypeError, FormData: LocalFormData,
    fetch: async (...args) => { calls.push(args); return transport(...args); },
    setTimeout: callback => { const id = ++nextId; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
  });
  return { ...exports, calls, timers, expire: () => [...timers.values()].forEach(callback => callback()) };
}

test('successful upload keeps the native file descriptor and preset, validates metadata and clears its deadline', async () => {
  const f = uploader(async () => ({ ok: true, json: async () => asset }));
  assert.equal(f.ATTACHMENT_UPLOAD_TIMEOUT_MS, 120000);
  assert.deepEqual(await f.uploadAttachment(file), asset);
  const [url, request] = f.calls[0];
  assert.equal(url, 'https://api.cloudinary.com/v1_1/djtdar2ex/auto/upload');
  assert.equal(request.method, 'POST');
  assert.deepEqual(JSON.parse(JSON.stringify(request.body.fields)), [['file', { uri: file.uri, name: file.name, type: file.type }], ['upload_preset', 'vista_uploads']]);
  assert.equal(request.signal.aborted, false); assert.equal(f.timers.size, 0);
});

test('timeout releases the caller and aborts a stalled transport even when fetch ignores cancellation', async () => {
  const late = deferred(); const f = uploader(() => late.promise);
  const pending = f.uploadAttachment(file);
  const rejected = assert.rejects(pending, error => error.code === 'UPLOAD_TIMEOUT' && /selection is retained/.test(error.message));
  await flush(); f.expire(); await rejected;
  assert.equal(f.calls[0][1].signal.aborted, true); assert.equal(f.timers.size, 0);
  late.resolve({ ok: true, json: async () => asset }); await flush();
});

test('deadline also covers a response whose JSON body never finishes', async () => {
  const body = deferred(); const f = uploader(async () => ({ ok: true, json: () => body.promise }));
  const rejected = assert.rejects(f.uploadAttachment(file), error => error.code === 'UPLOAD_TIMEOUT');
  await flush(); f.expire(); await rejected;
  assert.equal(f.timers.size, 0);
  body.resolve(asset); await flush();
});

test('pre-cancelled uploads do not dispatch, and explicit cancellation rejects without waiting for transport', async () => {
  const late = deferred(); const f = uploader(() => late.promise); const controller = new AbortController();
  controller.abort();
  await assert.rejects(f.uploadAttachment(file, { signal: controller.signal }), error => error.code === 'ERR_CANCELED');
  assert.equal(f.calls.length, 0); assert.equal(f.timers.size, 0);
  const current = new AbortController();
  const rejected = assert.rejects(f.uploadAttachment(file, { signal: current.signal }), error => error.code === 'ERR_CANCELED');
  await flush(); current.abort(); await rejected;
  assert.equal(f.calls[0][1].signal.aborted, true); assert.equal(f.timers.size, 0);
  late.reject(new Error('late transport failure')); await flush();
});

test('malformed, incomplete and failed provider responses never masquerade as successful uploads', async () => {
  for (const result of [null, {}, { secure_url: asset.secure_url }]) {
    const f = uploader(async () => ({ ok: true, json: async () => result }));
    await assert.rejects(f.uploadAttachment(file), /could not be confirmed/); assert.equal(f.timers.size, 0);
  }
  const malformed = uploader(async () => ({ ok: true, json: async () => { throw new SyntaxError('private HTML'); } }));
  await assert.rejects(malformed.uploadAttachment(file), /unreadable response/);
  for (const status of [400, 429, 503]) {
    const f = uploader(async () => ({ ok: false, status, json: async () => ({ error: { message: '<html>private provider error</html>' } }) }));
    await assert.rejects(f.uploadAttachment(file), error => error.status === status && !error.message.includes('private'));
    assert.equal(f.timers.size, 0);
  }
  const network = uploader(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(network.uploadAttachment(file), error => error.code === 'ERR_NETWORK');
});

function submissionService(upload) {
  const posts = [];
  const h = createHarness({
    './uploadAttachment': upload,
    '../lib/apiClient': { apiClient: { post: async (...args) => { posts.push(args); return { data: { document_id: 'registered' } }; } }, unwrapApiError: error => error },
    '../config/api': { API_ENDPOINTS: { DOCUMENTS: { LIST: '/documents/' } } },
    '../lib/connectivityState.cjs': { connectivity: { isOnline: () => true } },
  });
  return { posts, service: h.load('src/services/submissionsService.js').submissionsService };
}

test('an interrupted or late upload cannot register an attachment or trigger another submission', async () => {
  const late = deferred(), f = uploader(() => late.promise), current = new AbortController();
  const { service, posts } = submissionService(f);
  let uploaded = 0;
  const rejected = assert.rejects(service.uploadSubmissionDocument('already-created', file, { signal: current.signal, onUploaded: () => uploaded++ }), error => error.code === 'ERR_CANCELED' && error.message.includes('submission was created'));
  await flush(); current.abort(); await rejected;
  late.resolve({ ok: true, json: async () => asset }); await flush();
  assert.equal(posts.length, 0); assert.equal(uploaded, 0);
});

test('upload registration keeps its existing contract and ends cancellable UI before the mutation', async () => {
  const f = uploader(async () => ({ ok: true, json: async () => asset }));
  const { service, posts } = submissionService(f); let uploaded = false;
  const result = await service.uploadSubmissionDocument('saved-entry', file, { onUploaded: () => { uploaded = true; assert.equal(posts.length, 0); } });
  assert.equal(uploaded, true); assert.equal(result.document_id, 'registered');
  assert.equal(posts.length, 1); assert.equal(posts[0][0], '/documents/');
  assert.equal(posts[0][1].submission_id, 'saved-entry'); assert.equal(posts[0][1].cloudinary_public_id, asset.public_id);
  assert.equal(posts[0][1].file_url, asset.secure_url);
});

test('creation-screen upload cancellation retains the created entry and offers attachment retry instead of resubmission', async () => {
  let creates = 0;
  const h = createHarness({
    '../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'AttachmentPreview' },
    '../../components/common/VistaProcessing': { __esModule: true, default: 'Processing' },
    '../../components/common/AppDialog': { AppAlert: { alert() {} } },
    '../../services/submissionsService': { submissionsService: {
      async createSubmission() { creates++; return { submission_id: 'saved-entry' }; },
      async uploadSubmissionDocument(id, selected, { signal }) {
        assert.equal(id, 'saved-entry'); assert.equal(selected, file);
        await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('Your submission was created. The file upload was stopped.'), { code: 'ERR_CANCELED' })), { once: true }));
      },
    } },
  });
  const page = h.instance(h.load('src/screens/staff/StaffSubmissionConfirmation.jsx').default, { navigation: {}, route: { params: { draft: { title: 'Local draft' }, file } } });
  const confirm = nodes(page.output).find(n => n.type === 'TouchableOpacity' && textOf(n).includes('Confirm and submit'));
  const pending = confirm.props.onPress(); await flush(); page.render();
  const processing = nodes(page.output).find(n => n.type === 'Processing');
  assert.equal(processing.props.visible, true); assert.equal(typeof processing.props.onCancel, 'function');
  processing.props.onCancel(); await pending; page.render();
  assert.equal(creates, 1); assert.match(textOf(page.output), /Retry attachment upload/);
  assert.ok(!nodes(page.output).some(n => n.type === 'TouchableOpacity' && textOf(n).includes('Confirm and submit')));
  assert.equal(nodes(page.output).find(n => n.type === 'Processing').props.visible, false);
  page.unmount();
});

test('staff cancels only file staging; status mutation is not dispatched and selections/remarks remain', async () => {
  let updates = 0; const alerts = [];
  const h = createHarness({
    '../../../../components/submissions/StaffReviewFiles': { __esModule: true, default: 'StaffFiles' },
    '../../../../components/common/AppDialog': { AppAlert: { alert: (...args) => alerts.push(args) } },
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ mutateAsync: async () => { updates++; }, isPending: false }) },
    '../../../../services/submissionsService': { submissionsService: {
      prepareStatusAttachment: async (selected, { signal }) => {
        assert.equal(selected, file);
        return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('The file upload was stopped. Your file selection is retained.'), { code: 'ERR_CANCELED' })), { once: true }));
      },
    } },
    '../../../../services/reviewLogsService': { reviewLogsService: {} },
    '../../../../services/driveService': { driveService: {} },
    '../../../../services/prepareAttachment': {},
  });
  const page = h.instance(h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default, {
    submission: { submission_id: 'fixture', status: 'under_review', priority_escalation: false, documents: [] }, initialRemarks: 'Keep this draft',
  });
  nodes(page.output).find(n => n.type === 'StaffFiles').props.onChange([file]); page.render();
  const pending = nodes(page.output).find(n => n.props.label === 'Update Status').props.onPress(); await flush(); page.render();
  nodes(page.output).find(n => n.props.label === 'Cancel file upload').props.onPress(); await pending; page.render();
  assert.equal(updates, 0); assert.equal(alerts.at(-1)[0], 'Upload stopped');
  assert.equal(nodes(page.output).find(n => n.type === 'StaffFiles').props.files[0], file);
  assert.equal(nodes(page.output).find(n => n.props.accessibilityLabel === 'Reviewer remarks').props.value, 'Keep this draft');
  assert.equal(nodes(page.output).find(n => n.props.label === 'Update Status').props.busy, false);
  page.unmount();
});

test('leaving during image preparation cannot start a late file upload or status update', async () => {
  const prepared = deferred(); let uploads = 0, updates = 0; const alerts = [];
  const h = createHarness({
    '../../../../components/submissions/StaffReviewFiles': { __esModule: true, default: 'StaffFiles' },
    '../../../../components/common/AppDialog': { AppAlert: { alert: (...args) => alerts.push(args) } },
    '../../../../hooks/useSubmissions': { useUpdateSubmissionStatus: () => ({ mutateAsync: async () => { updates++; }, isPending: false }) },
    '../../../../services/submissionsService': { submissionsService: { prepareStatusAttachment: async () => { uploads++; return asset; } } },
    '../../../../services/reviewLogsService': { reviewLogsService: {} },
    '../../../../services/driveService': { driveService: {} },
    '../../../../services/prepareAttachment': { prepareAttachment: () => prepared.promise },
  });
  const page = h.instance(h.load('src/screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard.jsx').default, {
    submission: { submission_id: 'fixture', status: 'under_review', priority_escalation: false, documents: [] },
  });
  nodes(page.output).find(n => n.type === 'StaffFiles').props.onChange([{ ...file, type: 'image/webp' }]); page.render();
  const pending = nodes(page.output).find(n => n.props.label === 'Update Status').props.onPress();
  await flush(); page.unmount(); prepared.resolve(file); await pending;
  assert.equal(uploads, 0); assert.equal(updates, 0); assert.equal(alerts.length, 0);
});

test('a late creation response after leaving the view cannot start another upload or show a stale success dialog', async () => {
  const created = deferred(); let uploads = 0; const alerts = [];
  const h = createHarness({
    '../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'AttachmentPreview' },
    '../../components/common/AppDialog': { AppAlert: { alert: (...args) => alerts.push(args) } },
    '../../services/submissionsService': { submissionsService: {
      createSubmission: () => created.promise,
      uploadSubmissionDocument: async () => { uploads++; },
    } },
  });
  const page = h.instance(h.load('src/screens/staff/StaffSubmissionConfirmation.jsx').default, { navigation: {}, route: { params: { draft: { title: 'Local draft' }, file } } });
  const pending = nodes(page.output).find(n => n.type === 'TouchableOpacity' && textOf(n).includes('Confirm and submit')).props.onPress();
  page.unmount(); created.resolve({ submission_id: 'already-saved' }); await pending;
  assert.equal(uploads, 0); assert.equal(alerts.length, 0);
});

test('creation upload cancellation disappears before attachment registration and does not cancel that save', async () => {
  const registering = deferred(); let creates = 0;
  const h = createHarness({
    '../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'AttachmentPreview' },
    '../../components/common/VistaProcessing': { __esModule: true, default: 'Processing' },
    '../../components/common/AppDialog': { AppAlert: { alert() {} } },
    '../../services/submissionsService': { submissionsService: {
      createSubmission: async () => { creates++; return { submission_id: 'saved-entry' }; },
      uploadSubmissionDocument: async (id, selected, { onUploaded, signal }) => {
        onUploaded(); await registering.promise; assert.equal(signal.aborted, false);
      },
    } },
  });
  const page = h.instance(h.load('src/screens/staff/StaffSubmissionConfirmation.jsx').default, { navigation: {}, route: { params: { draft: {}, file } } });
  const pending = nodes(page.output).find(n => n.type === 'TouchableOpacity' && textOf(n).includes('Confirm and submit')).props.onPress();
  await flush(); page.render();
  const processing = nodes(page.output).find(n => n.type === 'Processing');
  assert.equal(processing.props.visible, true); assert.equal(processing.props.onCancel, undefined);
  registering.resolve(); await pending; page.render();
  assert.equal(creates, 1); assert.match(textOf(page.output), /created successfully/);
  page.unmount();
});

test('processing remains blocking by default; only the explicit file-transfer action can cancel', () => {
  let cancelled = 0;
  const h = createHarness({ './VistaLoader': { __esModule: true, default: 'Loader' } });
  const Processing = h.load('src/components/common/VistaProcessing.jsx').default;
  const page = h.instance(Processing, { visible: true });
  const surfaceElement = page.output.props.children;
  const surface = h.instance(surfaceElement.type, surfaceElement.props);
  assert.ok(!nodes(surface.output).some(n => n.props.label === 'Cancel file upload'));
  page.render({ visible: true, onCancel: () => cancelled++ });
  surface.render(page.output.props.children.props);
  const cancel = nodes(surface.output).find(n => n.props.label === 'Cancel file upload');
  assert.ok(cancel); cancel.props.onPress(); assert.equal(cancelled, 1);
  page.output.props.onRequestClose(); assert.equal(cancelled, 1, 'Android Back must not cancel a protected save');
  surface.unmount(); page.unmount();
});
