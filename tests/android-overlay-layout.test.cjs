const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

test('portal updates retain their layer ID and unmount removes only that portal', () => {
  const h = createHarness(), contexts = [];
  h.mocks.react.createContext = value => { const context = { value, Provider: 'ContextProvider' }; contexts.push(context); return context; };
  const { default: Portal, OverlayProvider } = h.load('src/components/common/OverlayPortal.jsx');
  const host = h.instance(OverlayProvider);
  contexts[0].value = host.output.props.value;
  const parent = h.instance(Portal, { children: 'parent draft' });
  const child = h.instance(Portal, { children: 'child confirmation' }); host.render();
  assert.equal(host.output.props.children[1].length, 2);
  const parentId = host.output.props.children[1][0].key;
  parent.render({ children: 'edited draft' }); host.render();
  assert.equal(host.output.props.children[1][0].key, parentId);
  child.unmount(); host.render();
  assert.equal(host.output.props.children[1].length, 1);
  assert.equal(host.output.props.children[1][0].props.children.props.children, 'edited draft');
  parent.unmount(); host.render(); assert.equal(host.output.props.children[1].length, 0);
  host.unmount();
});

test('nested overlays retain parent content, restrict accessibility and dispatch Back only to the top layer', () => {
  const h = createHarness(); let back, removed = 0, parentClosed = 0, childClosed = 0;
  h.native.BackHandler.addEventListener = (_, callback) => { back = callback; return { remove() { removed++; } }; };
  const { OverlayProvider } = h.load('src/components/common/OverlayPortal.jsx');
  const host = h.instance(OverlayProvider, { children: 'navigation' });
  const manager = host.output.props.value;
  const parent = { type: 'Draft', props: { value: 'unsaved remarks' } };
  manager.upsert('parent', parent, () => parentClosed++); host.render();
  manager.upsert('child', 'confirmation', () => childClosed++); host.render();
  const [underlay, layers] = host.output.props.children;
  assert.equal(underlay.props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(layers[0].props.pointerEvents, 'none');
  assert.equal(layers[0].props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(layers[1].props.pointerEvents, 'auto');
  assert.equal(back(), true); assert.equal(childClosed, 1); assert.equal(parentClosed, 0);
  manager.upsert('parent', parent, () => parentClosed++); host.render();
  assert.equal(host.output.props.children[1][1].key, 'child');
  manager.remove('child'); host.render();
  const retained = host.output.props.children[1][0];
  assert.equal(retained.props.children.props.children, parent);
  assert.equal(retained.props.pointerEvents, 'auto');
  assert.equal(back(), true); assert.equal(parentClosed, 1);
  manager.remove('parent'); host.render();
  assert.equal(host.output.props.children[0].props.importantForAccessibility, 'auto');
  host.unmount(); assert.ok(removed >= 3);
});

test('Android sheets, confirmations and processing reuse the activity window with guarded dismissal', () => {
  const h = createHarness({ './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true, useOverlayActive: () => true } });
  for (const file of ['AppBottomSheet', 'AppModal', 'VistaProcessing']) {
    const Component = h.load(`src/components/common/${file}.jsx`).default;
    let closed = 0;
    const props = { visible: true, title: 'Fixture', onClose: () => closed++, busy: true, dismissible: false };
    const component = h.instance(Component, props);
    assert.equal(component.output.type, 'OverlayPortal');
    assert.ok(!nodes(component.output).some(n => n.type === 'Modal'));
    component.output.props.onRequestClose(); assert.equal(closed, 0);
    if (file !== 'VistaProcessing') {
      component.render({ ...props, busy: false, dismissible: true });
      component.output.props.onRequestClose(); assert.equal(closed, 1);
    }
    component.render({ ...props, visible: false });
    assert.equal(component.output.type, 'OverlayPortal', 'Keep the surface for its coordinated exit');
    component.output.props.children.props.onHidden(); component.render();
    assert.equal(component.output, null);
    component.unmount();
  }
});

test('iOS and standalone consumers preserve native modal presentation', () => {
  const h = createHarness({ './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true, useOverlayActive: () => true } });
  h.native.Platform.OS = 'ios';
  for (const file of ['AppBottomSheet', 'AppModal', 'VistaProcessing']) {
    const component = h.instance(h.load(`src/components/common/${file}.jsx`).default, { visible: true });
    assert.equal(component.output.type, 'Modal'); component.unmount();
  }
});

test('covered sheet finishes entering without stealing focus, and restores focus only when topmost', async () => {
  let top = true, completeEntry; const focus = [];
  const h = createHarness({ './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true, useOverlayActive: () => top } });
  h.native.AccessibilityInfo.isReduceMotionEnabled = async () => false;
  h.native.Animated.timing = () => ({ start(callback) { completeEntry = callback; } });
  h.native.AccessibilityInfo.setAccessibilityFocus = node => focus.push(node);
  const Sheet = h.load('src/components/common/AppBottomSheet.jsx').default;
  const outer = h.instance(Sheet, { visible: true });
  const element = outer.output.props.children;
  const surface = h.instance(element.type, element.props);
  await Promise.resolve(); surface.render();
  nodes(surface.output).find(n => n.props?.accessibilityRole === 'header').props.ref.current = 'live-heading';
  nodes(surface.output).find(n => n.props?.onLayout).props.onLayout({ nativeEvent: { layout: { height: 240 } } });
  assert.equal(typeof completeEntry, 'function', 'The measured sheet starts its native animation immediately');
  top = false; surface.render(); completeEntry({ finished: true });
  assert.deepEqual(focus, []);
  top = true; surface.render(); assert.deepEqual(focus, ['live-heading']);
  surface.unmount(); outer.unmount();
});

test('rapid sheet dismissal prevents asynchronous accessibility focus after unmount', async () => {
  let completeEntry, stopped = 0; const focus = [];
  const h = createHarness({ './OverlayPortal': { __esModule: true, default: 'OverlayPortal', useOverlayAvailable: () => true, useOverlayActive: () => true } });
  h.native.AccessibilityInfo.isReduceMotionEnabled = async () => false;
  h.native.Animated.timing = () => ({ start(callback) { completeEntry = callback; } });
  h.native.Animated.Value.prototype.stopAnimation = () => stopped++;
  h.native.AccessibilityInfo.setAccessibilityFocus = node => focus.push(node);
  const outer = h.instance(h.load('src/components/common/AppBottomSheet.jsx').default, { visible: true });
  const element = outer.output.props.children, surface = h.instance(element.type, element.props);
  await Promise.resolve(); surface.render();
  nodes(surface.output).find(n => n.props?.accessibilityRole === 'header').props.ref.current = 'old-heading';
  nodes(surface.output).find(n => n.props?.onLayout).props.onLayout({ nativeEvent: { layout: { height: 240 } } });
  assert.equal(typeof completeEntry, 'function');
  assert.deepEqual(focus, []);
  surface.unmount(); outer.unmount(); completeEntry({ finished: true });
  assert.ok(stopped > 0, 'Unmount cancels the native animation');
  assert.deepEqual(focus, []);
});

test('bottom navbar frame freezes resting bottom inset while overlays are open, preventing transient system bar jumps', () => {
  let isOverlayOpen = false;
  let insets = { top: 24, bottom: 0, left: 0, right: 0 };
  let dimensions = { width: 360, height: 800, fontScale: 1 };
  const h = createHarness({
    './OverlayPortal': {
      __esModule: true,
      default: 'OverlayPortal',
      useOverlayAvailable: () => true,
      useOverlayActive: () => true,
      useIsOverlayOpen: () => isOverlayOpen,
    },
    'react-native-safe-area-context': {
      useSafeAreaInsets: () => insets,
    },
  });
  h.native.useWindowDimensions = () => dimensions;
  const BottomNavFrame = h.load('src/components/common/BottomNavFrame.jsx').default;

  // 1. Resting state (no overlay, immersive Android bottom inset 0)
  const nav = h.instance(BottomNavFrame, { docked: false, children: 'nav-content' });
  const getStyle = () => Object.assign({}, ...nav.output.props.style);
  assert.equal(getStyle().bottom, 8, 'Resting navbar sits at bottom: 8dp');

  // 2. Overlay opens (isOverlayOpen becomes true) and Android transiently reports 48dp system nav bar
  isOverlayOpen = true;
  insets = { top: 24, bottom: 48, left: 0, right: 0 };
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Navbar must NOT jump upward when overlay opens and insets surge');

  // 3. Overlay closes (isOverlayOpen becomes false) and Android re-hides system bar (insets return to 0)
  isOverlayOpen = false;
  insets = { top: 24, bottom: 0, left: 0, right: 0 };
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Navbar returns cleanly and remains at bottom: 8dp');

  // 4. Genuine rotation change updates resting inset
  insets = { top: 0, bottom: 16, left: 24, right: 24 };
  dimensions = { width: 800, height: 360, fontScale: 1 };
  nav.render();
  assert.equal(getStyle().bottom, 16, 'Rotation updates resting bottom inset');

  // 5. Docked navbar consumers preserve effective resting bottom padding
  const dockedNav = h.instance(BottomNavFrame, { docked: true, children: 'docked-content' });
  const getDockedStyle = () => Object.assign({}, ...dockedNav.output.props.style);
  assert.equal(getDockedStyle().paddingBottom, 16, 'Docked navbar respects resting inset');

  // 6. Overlay opens on docked navbar: bottom padding does NOT expand
  isOverlayOpen = true;
  insets = { top: 0, bottom: 48, left: 24, right: 24 };
  dockedNav.render();
  assert.equal(getDockedStyle().paddingBottom, 16, 'Docked navbar must NOT expand when overlay opens');

  // 7. App foreground/background transition:
  // When switching apps and returning, Android onResume reports 48dp system nav bar
  // while isOverlayOpen is FALSE. The navbar must NOT jump upward!
  dimensions = { width: 360, height: 800, fontScale: 1 };
  insets = { top: 24, bottom: 0, left: 0, right: 0 };
  isOverlayOpen = false;
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Settled portrait navbar sits at bottom: 8dp');

  // App resumes: insets surge to 48 without overlay
  insets = { top: 24, bottom: 48, left: 0, right: 0 };
  nav.render();
  assert.equal(getStyle().bottom, 8, 'App switching resume surge must NOT jump navbar upward');

  // System bar hides asynchronously
  insets = { top: 24, bottom: 0, left: 0, right: 0 };
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Navbar remains at bottom: 8dp after system bar re-hides');

  // 8. Closing overlay with delayed system bar re-hiding:
  // When sheet closes, isOverlayOpen becomes false while insets are still 48dp.
  isOverlayOpen = true;
  insets = { top: 24, bottom: 48, left: 0, right: 0 };
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Overlay open stays at 8dp');

  // Overlay closes, but system bar is still 48dp for 100ms
  isOverlayOpen = false;
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Navbar must NOT capture transient 48dp surge when overlay closes');

  // 9. Keyboard opens with adjustResize:
  // Window height shrinks from 800 to 520 (280dp keyboard).
  // The navbar must NOT float above the keyboard.
  dimensions = { width: 360, height: 520, fontScale: 1 };
  nav.render();
  // bottom coordinate compensates for shrink (8 - 280 = -272) so physical screen Y remains 800 - 56 - 8 = 736
  assert.equal(getStyle().bottom, 8 - 280, 'Navbar anchors to physical screen bottom and does not float above keyboard');

  // Keyboard dismisses: window height returns to 800
  dimensions = { width: 360, height: 800, fontScale: 1 };
  nav.render();
  assert.equal(getStyle().bottom, 8, 'Navbar cleanly returns to resting 8dp when keyboard dismisses');

  // 10. Screen navigation authority sharing:
  // A new screen instantiating BottomNavFrame immediately uses the shared resting inset
  const newScreenNav = h.instance(BottomNavFrame, { docked: false, children: 'screen-b' });
  const getNewScreenStyle = () => Object.assign({}, ...newScreenNav.output.props.style);
  assert.equal(getNewScreenStyle().bottom, 8, 'New screen immediately inherits resting baseline with zero jump');
});
