import OverlayPortal, { useOverlayAvailable } from './OverlayPortal';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, sizes } from '../../theme/tokens';

export default function AppModal({ visible, onClose, children, dismissible = true }) {
  const insets = useSafeAreaInsets();
  const available = useOverlayAvailable();
  const portal = Platform.OS === 'android' && available;
  const close = () => { if (dismissible) onClose?.(); };
  const content = <>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.host, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Pressable accessible={false} onPress={close} style={styles.backdrop} />
      <View accessibilityViewIsModal style={styles.card}>
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </>;
  if (portal) return visible ? <OverlayPortal onRequestClose={close}>{content}</OverlayPortal> : null;
  return <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={close}>{content}</Modal>;
}
const styles = StyleSheet.create({
  host: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.backdrop },
  card: { width: '100%', maxWidth: sizes.modalWidth, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radii.sheet, overflow: 'hidden', elevation: 5 },
  content: { padding: 16, gap: 8 },
});
