import { useEffect, useRef } from 'react';
import OverlayPortal, { useOverlayAvailable } from './OverlayPortal';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, sizes, space, shadows, motion } from '../../theme/tokens';
import useReducedMotion from '../../hooks/useReducedMotion';
import useOverlayPresence from '../../hooks/useOverlayPresence';

function modalContent({ insets, close, children, progress, visible = true }) {
  const Card = progress ? Animated.View : View;
  return <>
    <KeyboardAvoidingView behavior="padding" style={[styles.host, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
      {progress ? (
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      ) : <Pressable accessible={false} onPress={close} style={styles.backdrop} />}
      <Card pointerEvents={visible ? 'auto' : 'none'} accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'} accessibilityViewIsModal onAccessibilityEscape={close} style={progress ? [styles.card, {
        opacity: progress,
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [motion.modalScale, 1] }) }],
      }] : styles.card}>
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
      </Card>
    </KeyboardAvoidingView>
  </>;
}

// Animate the card and scrim inside their window on both platforms. Native
// Modal window animation stays off so entry/exit never play twice.
function ModalSurface({ insets, close, children, reducedMotion, visible, onHidden }) {
  const progress = useRef(new Animated.Value(reducedMotion && visible ? 1 : 0)).current;
  const callback = useRef(onHidden);
  callback.current = onHidden;
  useEffect(() => {
    let active = true;
    progress.stopAnimation();
    if (reducedMotion) {
      progress.setValue(visible ? 1 : 0);
      if (!visible) callback.current();
    }
    else Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: motion.modal,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => { if (active && finished && !visible) callback.current(); });
    return () => { active = false; progress.stopAnimation(); };
  }, [progress, reducedMotion, visible]);
  return modalContent({ insets, close, children, progress, visible });
}

export default function AppModal({ visible, onClose, onDismiss, children, dismissible = true }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const available = useOverlayAvailable();
  const portal = Platform.OS === 'android' && available;
  const presence = useOverlayPresence(visible, children);
  const wasPresent = useRef(false);
  useEffect(() => {
    if (wasPresent.current && !presence.present) onDismiss?.();
    wasPresent.current = presence.present;
  }, [presence.present, onDismiss]);
  const close = () => { if (visible && dismissible) onClose?.(); };
  const content = <ModalSurface insets={insets} close={close} reducedMotion={reducedMotion} visible={visible} onHidden={presence.onHidden}>{presence.content}</ModalSurface>;
  if (portal) return presence.present ? <OverlayPortal onRequestClose={close}>{content}</OverlayPortal> : null;
  return <Modal visible={presence.present} transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={close}>{content}</Modal>;
}
const styles = StyleSheet.create({
  host: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.backdrop },
  card: { width: '100%', maxWidth: sizes.modalWidth, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radii.sheet, borderCurve: 'continuous', overflow: 'hidden', ...shadows.raised },
  content: { padding: space.lg, gap: space.sm },
});
