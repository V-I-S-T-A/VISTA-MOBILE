import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Keyboard, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOverlayOpen } from './OverlayPortal';
import useReducedMotion from '../../hooks/useReducedMotion';
import { compact, motion, nav, space } from '../../theme/tokens';

// Edge-to-edge single positioning authority across all screens.
// Maintains stable safe-area resting coordinates and provides keyboard shrink compensation
// so the navbar remains anchored at the physical bottom behind the keyboard during adjustResize.
const restingState = {
  width: 0,
  height: 0,
  restingBottom: null,
};

export function getStableRestingBottom(insets, dimensions, isOverlayOpen = false) {
  const bottom = Number(insets?.bottom) || 0;
  const width = Number(dimensions?.width) || 0;
  const height = Number(dimensions?.height) || 0;

  // Genuine orientation change (aspect ratio flips or width changes significantly)
  const isRotation =
    restingState.width > 0 &&
    restingState.height > 0 &&
    width > 0 &&
    height > 0 &&
    (((restingState.width < restingState.height) !== (width < height)) ||
     Math.abs(restingState.width - width) > 50);

  if (isRotation || restingState.restingBottom === null) {
    restingState.width = width;
    restingState.height = height;
    restingState.restingBottom = bottom;
    return restingState.restingBottom;
  }

  // Update base orientation dimensions before keyboard shrinkage
  if (width > 0 && height > 0) {
    if (!isRotation && height > restingState.height) {
      restingState.height = height;
    }
    restingState.width = width;
  }

  // Under edge-to-edge, while an overlay is active, freeze the resting inset so
  // transient window/dialog focus transitions do not displace the resting baseline.
  if (!isOverlayOpen) {
    if (bottom <= restingState.restingBottom || Math.abs(bottom - restingState.restingBottom) <= 16) {
      restingState.restingBottom = bottom;
    }
  }

  return restingState.restingBottom;
}

export function resetRestingBottomAuthority() {
  restingState.width = 0;
  restingState.height = 0;
  restingState.restingBottom = null;
}

// Keep the existing edge-to-edge placement and the iOS home-indicator gap.
// Overlays (dropdowns, sheets, modals) must not cause transient system navigation-bar insets to jump the navbar.
export default function BottomNavFrame({ children, docked = false, scrollBehavior }) {
  const insets = useSafeAreaInsets();
  const isOverlayOpen = typeof useIsOverlayOpen === 'function' ? useIsOverlayOpen() : false;
  const dimensions = useWindowDimensions();
  const { width, height } = dimensions;
  const [keyboard, setKeyboard] = useState(false);
  const [scrollHidden, setScrollHidden] = useState(() => scrollBehavior?.isHidden() || false);
  const [screenReader, setScreenReader] = useState(true);
  const [barHeight, setBarHeight] = useState(compact.navHeight);
  const reducedMotion = useReducedMotion();
  const visibility = useRef(new Animated.Value(0)).current;
  const hidden = scrollHidden && !screenReader && !isOverlayOpen;

  useEffect(() => {
    setScrollHidden(scrollBehavior?.isHidden() || false);
    return scrollBehavior?.subscribe(setScrollHidden);
  }, [scrollBehavior]);
  useEffect(() => {
    let active = true;
    let revision = 0;
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', value => {
      revision++;
      if (active) setScreenReader(value);
    });
    const readRevision = revision;
    AccessibilityInfo.isScreenReaderEnabled?.().then(value => {
      if (active && readRevision === revision) setScreenReader(value);
    }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  useLayoutEffect(() => {
    visibility.stopAnimation();
    if (reducedMotion) visibility.setValue(hidden ? 1 : 0);
    else Animated.timing(visibility, {
      toValue: hidden ? 1 : 0, duration: 240,
      easing: hidden ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic), useNativeDriver: true,
      isInteraction: false,
    }).start();
    return () => visibility.stopAnimation();
  }, [hidden, reducedMotion, visibility]);

  const restingBottom = getStableRestingBottom(insets, { width, height }, isOverlayOpen);
  const effectiveBottom = Math.max(restingBottom, nav.bottomGap);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // When keyboard opens on Android with adjustResize, window height shrinks.
  // Compensate so the absolute navbar remains anchored at the physical bottom of the screen
  // (covered by the keyboard) instead of floating above the keyboard.
  const isKeyboardShrunk = restingState.height > 0 && (restingState.height - height > 100);
  const shrinkOffset = isKeyboardShrunk ? (restingState.height - height) : 0;
  const bottomPosition = effectiveBottom - shrinkOffset;

  return <Animated.View pointerEvents={keyboard || hidden ? 'none' : 'box-none'} accessibilityElementsHidden={keyboard || hidden}
    importantForAccessibility={keyboard || hidden ? 'no-hide-descendants' : 'auto'}
    onLayout={event => {
      const measured = event.nativeEvent.layout.height;
      if (measured > 0) setBarHeight(measured);
    }}
    style={[
      docked
        ? { paddingTop: 2, paddingBottom: effectiveBottom }
        : { position: 'absolute', left: 0, right: 0, bottom: bottomPosition },
      { paddingHorizontal: Math.max(space.md, insets.left, insets.right),
        opacity: keyboard ? 0 : visibility.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [{ translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [0, barHeight + effectiveBottom + nav.hideGap] }) }],
      }
    ]}>
    {children}
  </Animated.View>;
}
