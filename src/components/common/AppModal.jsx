import { useEffect, useRef } from 'react';
import OverlayPortal, { useOverlayAvailable } from './OverlayPortal';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, sizes, space, shadows, motion } from '../../theme/tokens';
import useReducedMotion from '../../hooks/useReducedMotion';

function modalContent({ insets, close, children, progress }) {
  const Card = progress ? Animated.View : View;
  return <>
    <KeyboardAvoidingView behavior="padding" style={[styles.host, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
      {progress ? (
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      ) : <Pressable accessible={false} onPress={close} style={styles.backdrop} />}
      <Card accessibilityViewIsModal style={progress ? [styles.card, {
        opacity: progress,
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [motion.modalScale, 1] }) }],
      }] : styles.card}>
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
      </Card>
    </KeyboardAvoidingView>
  </>;
}

// The Android portal shares the activity window, so the native Modal fade does
// not run there. Animate its scrim and card together without delaying actions.
function PortalModalSurface({ insets, close, children, reducedMotion }) {
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    progress.stopAnimation();
    if (reducedMotion) progress.setValue(1);
    else Animated.timing(progress, {
      toValue: 1,
      duration: motion.page,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => progress.stopAnimation();
  }, [progress, reducedMotion]);
  return modalContent({ insets, close, children, progress });
}

export default function AppModal({ visible, onClose, children, dismissible = true }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const available = useOverlayAvailable();
  const portal = Platform.OS === 'android' && available;
  const close = () => { if (dismissible) onClose?.(); };
  if (portal) return visible ? <OverlayPortal onRequestClose={close}><PortalModalSurface insets={insets} close={close} reducedMotion={reducedMotion}>{children}</PortalModalSurface></OverlayPortal> : null;
  const content = modalContent({ insets, close, children });
  return <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={close}>{content}</Modal>;
}
const styles = StyleSheet.create({
  host: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.backdrop },
  card: { width: '100%', maxWidth: sizes.modalWidth, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radii.sheet, borderCurve: 'continuous', overflow: 'hidden', ...shadows.raised },
  content: { padding: space.lg, gap: space.sm },
});
