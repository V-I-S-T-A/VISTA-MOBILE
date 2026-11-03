import { Text } from './FontText';
import AppButton from './AppButton';
import AppBottomSheet from './AppBottomSheet';
import { colors, type } from '../../theme/tokens';

export default function ConfirmDialog({ visible, title, message, confirmLabel = 'Continue', cancelLabel = 'Cancel', onConfirm, onCancel, busy = false, destructive = false, returnFocusRef }) {
  return <AppBottomSheet visible={visible} title={title} onClose={onCancel} busy={busy} dismissible={!busy} returnFocusRef={returnFocusRef}>
    {message ? <Text style={{ ...type.body, color: colors.muted }}>{message}</Text> : null}
    <AppButton label={confirmLabel} accessibilityLabel={`Confirm ${confirmLabel.toLowerCase()}`} onPress={onConfirm} busy={busy} variant={destructive ? 'destructive' : 'primary'} />
    <AppButton label={cancelLabel} onPress={onCancel} disabled={busy} variant="secondary" />
  </AppBottomSheet>;
}
