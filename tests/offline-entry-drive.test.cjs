const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

test('offline document entry renders its editable form and local attachment state even while reference queries are pending', () => {
  let online = false, loading = true, refreshed = 0, navigated = 0;
  const h = createHarness({
    '../../../hooks/useConnectivity': { __esModule: true, default: () => online },
    '../../../hooks/useScreenRefresh': { useScreenRefresh: () => ({ onRefresh: () => refreshed++, refreshing: false }) },
    '../../../hooks/useOrganizations': { useOrganizations: () => ({ isLoading: loading }), useOrganizationUsers: () => ({ data: [] }) },
    '../../../hooks/useCategories': { useCategories: () => ({ isLoading: loading }) },
    '../../../hooks/useDocumentTypes': { useDocumentTypes: () => ({ isLoading: loading }) },
    '../../../hooks/useAcademicYears': { useActiveAcademicYear: () => ({ isLoading: loading }) },
    '../../../hooks/useSubmissions': { useAutofillDocument: () => ({ isPending: false }) },
    '../../../services/prepareAttachment': {}, '../../../utils/documentScan': {},
    '../../../components/submissions/DraftAttachmentPreview': { __esModule: true, default: 'AttachmentPreview' },
  });
  const page = h.instance(h.load('src/screens/staff/docEntry/StaffDocumentEntryContent.jsx').default, { navigation: { navigate: () => navigated++ } });
  const title = () => nodes(page.output).find(n => n.props?.accessibilityLabel === 'Document title');
  assert.ok(title());
  assert.ok(!nodes(page.output).some(n => n.type?.name === 'FormSkeleton'));
  assert.ok(nodes(page.output).some(n => n.props?.title === 'Ready for your document'));
  assert.ok(nodes(page.output).some(n => n.props?.accessibilityLabel === 'Attach document (optional)' && !n.props.disabled));
  title().props.onChangeText('Local unsaved title'); page.render();
  const state = nodes(page.output).find(n => n.type?.name === 'ContentState' && n.props.variant === 'error');
  assert.equal(state.props.error.code, 'OFFLINE'); state.props.onRetry(); assert.equal(refreshed, 1);
  online = true; page.render();
  assert.ok(nodes(page.output).some(n => n.type?.name === 'FormSkeleton'), 'Online initial loading still uses its existing skeleton');
  loading = false; page.render();
  assert.equal(title().props.value, 'Local unsaved title');
  assert.equal(navigated, 0, 'Opening and refreshing never submits a document');
});

function driveFixture({ online = false, connection, loading = true, folders = [], foldersLoading = true } = {}) {
  let retries = 0, writes = 0;
  const mutation = () => ({ isPending: false, mutate: () => writes++, mutateAsync: async () => { writes++; } });
  const h = createHarness({
    '../../../hooks/useConnectivity': { __esModule: true, default: () => online },
    '../../../utils/driveAuth': { runDriveAuthSession: async () => { writes++; } },
    '../../../components/common/Toast': { useToast: () => ({ success() {}, error() {} }) },
    '../../../hooks/useDrive': {
      useDriveConnection: () => ({ data: connection, isLoading: loading, refetch: () => retries++ }),
      useDriveFolders: () => ({ data: folders, isLoading: foldersLoading, refetch: () => retries++ }),
      useDriveAuthStart: mutation, useDisconnectDrive: mutation, useSelectDriveFolder: mutation, useCreateDriveFolder: mutation,
    },
  });
  const page = h.instance(h.load('src/screens/staff/gdriveSync/GDriveSyncLoginCard.jsx').default);
  return { h, page, retries: () => retries, writes: () => writes };
}

test('uncached offline Drive shows bundled recovery state instead of waiting on a connection skeleton', () => {
  const f = driveFixture();
  assert.ok(!nodes(f.page.output).some(n => n.type?.name === 'DriveSkeleton'));
  const state = nodes(f.page.output).find(n => n.type?.name === 'ContentState');
  assert.equal(state.props.error.code, 'OFFLINE');
  state.props.onRetry(); assert.equal(f.retries(), 1); assert.equal(f.writes(), 0);
});

test('cached Drive identity remains visible offline and empty pending folders show recovery without altering Google authorization', () => {
  const f = driveFixture({ connection: { connected: true, google_account_email: 'staff@example.test' }, loading: false });
  assert.ok(nodes(f.page.output).some(n => n.type?.name === 'DriveAccountIdentity' && n.props.email === 'staff@example.test'));
  const state = nodes(f.page.output).find(n => n.type?.name === 'ContentState');
  assert.equal(state.props.error.code, 'OFFLINE');
  state.props.onRetry(); assert.equal(f.retries(), 1); assert.equal(f.writes(), 0);
  const cached = driveFixture({ connection: { connected: true }, loading: false, folders: [{ id: 'local-cache', name: 'Cached archive' }], foldersLoading: false });
  assert.ok(nodes(cached.page.output).some(n => n.type === 'FlatList' && n.props.data[0].id === 'local-cache'));
  assert.equal(cached.writes(), 0);
});

test('online empty Drive folders use the local empty mascot while initial online connection keeps its loading skeleton', () => {
  const pending = driveFixture({ online: true });
  assert.equal(pending.page.output.type.name, 'DriveSkeleton');
  const f = driveFixture({ online: true, connection: { connected: true }, loading: false, foldersLoading: false });
  const list = nodes(f.page.output).find(n => n.type === 'FlatList');
  assert.equal(list.props.ListEmptyComponent.type.name, 'ContentState');
  assert.equal(list.props.ListEmptyComponent.props.title, 'No Drive folders yet');
  assert.equal(f.writes(), 0);
});

test('native scan descriptors remain local and launching a camera scan makes no data request', async () => {
  let scans = 0;
  const h = createHarness({
    'react-native-document-scanner-plugin': { __esModule: true, default: { scanDocument: async () => { scans++; return { status: 'success', scannedImages: ['file:///local/scan.jpg'] }; } } },
  });
  const result = await h.load('src/utils/documentScan.js').scanDocument();
  assert.equal(scans, 1); assert.equal(result.uri, 'file:///local/scan.jpg'); assert.equal(result.type, 'image/jpeg');
});
