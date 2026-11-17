const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

function fixture(os = 'android', initialBottom = 0) {
  let raw = { top: 24, right: 0, bottom: initialBottom, left: 0 };
  const context = { Provider: 'InsetsProvider' };
  const h = createHarness({
    'react-native-safe-area-context': { SafeAreaInsetsContext: context, useSafeAreaInsets: () => raw },
    'react-native-keyboard-controller': { KeyboardProvider: 'KeyboardProvider' },
  });
  h.native.Platform.OS = os;
  const layout = h.instance(h.load('src/components/common/ImmersiveLayout.jsx').default, { children: 'all app content' });
  return { h, layout, change(next) { raw = { ...raw, ...next }; layout.render(); } };
}

test('Android foreground 0 → 48 → 0 insets do not move pages or invalidate their inset context', () => {
  const f = fixture();
  const baseline = f.layout.output.props.value;
  for (const bottom of [48, 0, 48, 0]) {
    f.change({ bottom });
    assert.equal(f.layout.output.props.value, baseline);
    assert.equal(f.layout.output.props.value.bottom, 0);
  }
  const keyboard = f.layout.output.props.children;
  assert.equal(keyboard.props.navigationBarTranslucent, true, 'Do not add a native content margin for the temporary navigation bar');
  assert.equal(keyboard.props.preserveEdgeToEdge, true);
  assert.equal(keyboard.props.children, 'all app content');
  assert.equal(keyboard.props.enabled, undefined, 'Keep keyboard handling enabled with its existing default');
  assert.equal(keyboard.props.statusBarTranslucent, undefined, 'Preserve existing status bar layout');
});

test('cold mounting or opening a page while Android bar is already visible still starts with zero bottom padding', () => {
  const f = fixture('android', 48);
  assert.equal(f.layout.output.props.value.bottom, 0);
  f.change({ bottom: 0 });
  assert.equal(f.layout.output.props.value.bottom, 0);
});

test('cutouts, rotation and genuine frame updates remain native; iOS keeps its home indicator', () => {
  const f = fixture();
  f.change({ top: 0, left: 32, right: 16, bottom: 48 });
  assert.deepEqual({ ...f.layout.output.props.value }, { top: 0, left: 32, right: 16, bottom: 0 });
  assert.equal(f.layout.output.props.style, undefined, 'No fixed viewport height or keyboard resize compensation');
  const ios = fixture('ios', 34);
  assert.equal(ios.layout.output.props.value.bottom, 34);
  ios.change({ top: 0, bottom: 21, left: 44, right: 44 });
  assert.equal(ios.layout.output.props.value.bottom, 21);
  assert.equal(ios.layout.output.props.value.left, 44);
  assert.equal(ios.layout.output.props.children.props.navigationBarTranslucent, false);
});

test('newly mounted floating nav and profile footer share the stable inset even during foreground surge', () => {
  const f = fixture('android', 48);
  const h = createHarness({ 'react-native-safe-area-context': { useSafeAreaInsets: () => f.layout.output.props.value } });
  const nav = h.instance(h.load('src/components/common/BottomNavFrame.jsx').default);
  assert.equal(Object.assign({}, ...nav.output.props.style).bottom, 8);
  const footer = h.instance(h.load('src/hooks/useStableBottomLayout.js').default);
  assert.equal(footer.output.bottom, 0);
  f.change({ bottom: 0 }); nav.render(); footer.render();
  assert.equal(Object.assign({}, ...nav.output.props.style).bottom, 8);
  assert.equal(footer.output.bottom, 0);
  nav.unmount(); footer.unmount();
});

test('bottom sheet and settings footer retain spacing across Android navigation visibility', () => {
  const f = fixture();
  const h = createHarness({
    'react-native-safe-area-context': { useSafeAreaInsets: () => f.layout.output.props.value },
    '../../context/AuthContext': { useAuth: () => ({ user: { role: 'staff' } }) },
    './OverlayPortal': { __esModule: true, default: 'Portal', useOverlayAvailable: () => true, useOverlayActive: () => true },
  });
  const sheet = h.instance(h.load('src/components/common/AppBottomSheet.jsx').default, { visible: true, title: 'Layout fixture' });
  const surface = h.instance(sheet.output.props.children.type, sheet.output.props.children.props);
  const settings = h.instance(h.load('src/screens/shared/SettingsScreen.jsx').default, { navigation: {} });
  const padding = () => ({
    sheet: nodes(surface.output).flatMap(n => [].concat(n.props?.style || [])).find(s => s?.paddingBottom !== undefined)?.paddingBottom,
    settings: nodes(settings.output).find(n => n.type === 'ScrollView').props.contentContainerStyle.paddingBottom,
  });
  const baseline = padding();
  assert.ok(baseline.sheet > 0); assert.ok(baseline.settings > 0);
  for (const bottom of [48, 0]) {
    f.change({ bottom });
    sheet.render(); surface.render(sheet.output.props.children.props); settings.render();
    assert.deepEqual(padding(), baseline);
  }
  surface.unmount(); sheet.unmount(); settings.unmount();
});

test('the shared boundary encloses startup, auth, both role navigators, toasts and overlays', () => {
  const source = fs.readFileSync(path.join(__dirname, '../App.jsx'), 'utf8');
  const body = source.slice(source.indexOf('<SafeAreaProvider>'), source.indexOf('</SafeAreaProvider>'));
  const start = body.indexOf('<ImmersiveLayout>'), end = body.indexOf('</ImmersiveLayout>');
  assert.ok(start >= 0 && end > start);
  for (const name of ['ToastProvider', 'AuthProvider', 'NavigationContainer', 'OverlayProvider', 'RootNavigator', 'UpdateManager']) {
    const location = body.indexOf(`<${name}`);
    assert.ok(location > start && location < end, name);
  }
  const root = fs.readFileSync(path.join(__dirname, '../src/navigation/RootNavigator.jsx'), 'utf8');
  for (const screen of ['SplashScreen', 'AuthNavigator', 'StaffNavigator', 'StudentNavigator']) assert.match(root, new RegExp(`<${screen}`));
  for (const role of ['Auth', 'Staff', 'Student']) {
    const navigator = fs.readFileSync(path.join(__dirname, `../src/navigation/${role}Navigator.jsx`), 'utf8');
    assert.match(navigator, /navigationBarHidden: true/, 'Zero Android bottom inset is only valid for immersive navigators');
  }
});

test('image preview uses an overlaying native navigation bar and retains close behavior without removing the attachment', async () => {
  const f = fixture('android', 48); let removed = 0;
  const h = createHarness({
    'react-native-safe-area-context': { useSafeAreaInsets: () => f.layout.output.props.value },
    'expo-file-system/legacy': {},
  });
  h.native.StatusBar = 'StatusBar';
  const file = { uri: 'file:///layout-fixture.webp', name: 'Preview fixture.webp', type: 'image/webp' };
  const preview = h.instance(h.load('src/components/submissions/DraftAttachmentPreview.jsx').default, { file, onRemove: () => removed++ });
  await nodes(preview.output).find(n => n.props?.accessibilityLabel === 'Preview attachment: Preview fixture.webp').props.onPress();
  preview.render();
  let modal = nodes(preview.output).find(n => n.type === 'Modal');
  assert.equal(modal.props.visible, true);
  assert.equal(modal.props.navigationBarTranslucent, true);
  assert.equal(modal.props.statusBarTranslucent, true);
  const bottomPadding = node => nodes(node).find(n => n.type === 'View' && n.props.style?.backgroundColor === '#10213A').props.style.paddingBottom;
  assert.equal(bottomPadding(modal), 12);
  assert.equal(nodes(modal).find(n => n.type === 'StatusBar').props.barStyle, 'light-content');
  f.change({ bottom: 0 }); preview.render();
  modal = nodes(preview.output).find(n => n.type === 'Modal');
  assert.equal(bottomPadding(modal), 12);
  modal.props.onRequestClose(); preview.render();
  assert.equal(nodes(preview.output).find(n => n.type === 'Modal').props.visible, false);
  assert.ok(!nodes(preview.output).some(n => n.type === 'StatusBar'), 'Closing restores the underlying status bar appearance');
  assert.equal(removed, 0);
  preview.unmount();
});

test('standalone processing fallback also keeps the native navigation bar over its window', () => {
  const h = createHarness({ './OverlayPortal': { useOverlayAvailable: () => false } });
  const processing = h.instance(h.load('src/components/common/VistaProcessing.jsx').default, { visible: true });
  assert.equal(processing.output.type, 'Modal');
  assert.equal(processing.output.props.navigationBarTranslucent, true);
  assert.equal(processing.output.props.statusBarTranslucent, true);
  const surface = h.instance(processing.output.props.children.type, processing.output.props.children.props);
  assert.equal(surface.output.props.style.flex, 1);
  processing.unmount();
});
