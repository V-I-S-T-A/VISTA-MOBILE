import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  findNodeHandle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import OverlayPortal, {
  useOverlayAvailable,
  useOverlayActive,
} from "./OverlayPortal";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./FontText";
import {
  colors,
  radii,
  sizes,
  type,
  sheetLayout,
  space,
  reviewControls,
} from "../../theme/tokens";

function focusAccessibility(ref) {
  // Some consumers retain a live row ref, never a snapshot of its host view.
  const node =
    ref?.current &&
    ("current" in Object(ref.current) ? ref.current.current : ref.current);
  const handle = node && findNodeHandle(node);
  if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
}

// Animate the content, never the full Android dialog window/system bars.
function SheetSurface({
  visible,
  title,
  children,
  close,
  busy,
  scroll,
  contentStyle,
  insets,
  density,
}) {
  const { height } = useWindowDimensions();
  const topLayer = useOverlayActive();
  const offset = useRef(new Animated.Value(height)).current;
  const heading = useRef(null);
  const started = useRef(false);
  const entered = useRef(false);
  const mounted = useRef(true);
  const active = useRef(visible);
  const measured = useRef(0);
  const animationRun = useRef(0);
  active.current = visible && topLayer;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      offset.stopAnimation();
    };
  }, [offset]);
  useEffect(() => {
    if (!visible) {
      animationRun.current++;
      started.current = false;
      entered.current = false;
      offset.stopAnimation();
      offset.setValue(height);
    } else if (measured.current) enter();
  }, [visible, offset]);
  useEffect(() => {
    if (topLayer && visible && entered.current) focusAccessibility(heading);
  }, [topLayer, visible]);
  function enter(event) {
    if (event) measured.current = event.nativeEvent.layout.height;
    if (!visible) return;
    if (started.current) return;
    started.current = true;
    const run = ++animationRun.current;
    offset.setValue(measured.current || height);
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!mounted.current || run !== animationRun.current) return;
        Animated.timing(offset, {
          toValue: 0,
          duration: reduced ? 0 : sheetLayout.duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && mounted.current && run === animationRun.current) {
            entered.current = true;
            if (active.current) focusAccessibility(heading);
          }
        });
      })
      .catch(() => {
        if (mounted.current && run === animationRun.current) {
          offset.setValue(0);
          entered.current = true;
          if (active.current) focusAccessibility(heading);
        }
      });
  }
  const body = scroll ? (
    <ScrollView
      style={{ flexGrow: 0, flexShrink: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        density === "compact" && styles.compactContent,
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.content,
        density === "compact" && styles.compactContent,
        { flexShrink: 1 },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.host, { paddingTop: Math.max(insets.top, space.lg) }]}
    >
      <Pressable accessible={false} onPress={close} style={styles.backdrop} />
      <Animated.View
        onLayout={enter}
        accessibilityViewIsModal
        onAccessibilityEscape={close}
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(
              insets.bottom,
              density === "compact" ? space.sm : space.md,
            ),
            transform: [{ translateY: offset }],
          },
        ]}
      >
        <View accessible={false} style={styles.handle} />
        <View style={styles.header}>
          <Text
            ref={heading}
            accessible
            accessibilityRole="header"
            style={[
              styles.title,
              density === "compact" && reviewControls.sheetTitle,
            ]}
          >
            {title}
          </Text>
          <Pressable
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
            accessibilityState={{ disabled: busy }}
            onPress={close}
            style={styles.close}
          >
            <Feather name="x" size={sizes.icon} color={colors.muted} />
          </Pressable>
        </View>
        {body}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

export default function AppBottomSheet({
  visible,
  title,
  children,
  onClose,
  busy = false,
  dismissible = true,
  scroll = true,
  portal = false,
  contentStyle,
  returnFocusRef,
  density = "regular",
}) {
  const insets = useSafeAreaInsets();
  const available = useOverlayAvailable();
  const usePortal = portal || (Platform.OS === "android" && available);
  const wasVisible = useRef(false);
  const returnTarget = useRef(returnFocusRef);
  const close = () => {
    if (!busy && dismissible) onClose?.();
  };
  useEffect(() => {
    if (visible) returnTarget.current = returnFocusRef;
    // Effects run after the dismissal commit. Do not queue focus into a later
    // frame, when navigation may already have removed the opening view.
    if (wasVisible.current && !visible)
      focusAccessibility(returnTarget.current);
    wasVisible.current = visible;
  }, [visible, returnFocusRef]);
  useEffect(() => {
    if (!usePortal || !visible || available) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => listener.remove();
  }, [usePortal, available, visible, busy, dismissible, onClose]);
  // Preserve the existing native Modal child lifecycle; React Native owns its
  // platform-specific mounting. Portal previews still mount only while open.
  const sheet = (
    <SheetSurface
      density={density}
      visible={visible}
      title={title}
      close={close}
      busy={busy || !dismissible}
      scroll={scroll}
      contentStyle={contentStyle}
      insets={insets}
    >
      {children}
    </SheetSurface>
  );
  if (usePortal)
    return visible ? (
      <OverlayPortal onRequestClose={close}>{sheet}</OverlayPortal>
    ) : null;
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={close}
    >
      {sheet}
    </Modal>
  );
}
const styles = StyleSheet.create({
  host: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
  },
  sheet: {
    maxHeight: sheetLayout.maxHeight,
    flexShrink: 1,
    width: "100%",
    maxWidth: sizes.contentWidth,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderCurve: "continuous",
    paddingTop: space.sm,
  },
  handle: {
    width: sheetLayout.handleWidth,
    height: sheetLayout.handleHeight,
    borderRadius: sheetLayout.handleHeight / 2,
    alignSelf: "center",
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: sheetLayout.padding,
    paddingRight: space.xs,
    paddingTop: space.xs,
  },
  title: {
    ...type.heading,
    fontFamily: "DMSans_600SemiBold",
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  compactContent: { paddingTop: 0, paddingBottom: 4, gap: reviewControls.gap },
  close: {
    minWidth: sizes.touch,
    minHeight: sizes.touch,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: sheetLayout.padding,
    paddingTop: space.xs,
    paddingBottom: space.md,
    gap: sheetLayout.gap,
  },
});
