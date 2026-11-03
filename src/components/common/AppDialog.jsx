import { useEffect, useRef, useState } from 'react';
import { Alert as NativeAlert } from 'react-native';
import AppModal from './AppModal';
import AppBottomSheet from './AppBottomSheet';
import AppButton from './AppButton';
import { Text } from './FontText';
import { colors, type } from '../../theme/tokens';

let present;
let nextId = 0;
// Same call shape as the existing alerts: retain callback identity, labels,
// cancel/destructive actions and options while sharing one visual host.
export const AppAlert = { alert(title, message, buttons, options) {
  if (!present) return NativeAlert.alert(title, message, buttons, options);
  present({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }], options: options || {} });
} };

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const acted = useRef(null);
  useEffect(() => {
    const enqueue = dialog => setQueue(current => [...current, { ...dialog, id: ++nextId }]);
    present = enqueue;
    return () => { if (present === enqueue) present = undefined; };
  }, []);
  const dialog = queue[0];
  const choose = button => {
    if (!dialog || acted.current === dialog.id) return;
    acted.current = dialog.id;
    setQueue(current => current.slice(1)); button?.onPress?.();
  };
  const cancel = () => {
    const button = dialog?.buttons.find(item => item.style === 'cancel');
    if (button) choose(button);
    else if (dialog?.options.cancelable) { setQueue(current => current.slice(1)); dialog.options.onDismiss?.(); }
  };
  // Keep consequential confirmations blocking; source choices and ordinary
  // acknowledgements use the same bottom-sheet surface as the rest of the app.
  const destructive = dialog?.buttons.some(button => button.style === 'destructive');
  const Presentation = destructive ? AppModal : AppBottomSheet;
  return <>{children}<Presentation title={dialog?.title} visible={!!dialog} onClose={cancel} returnFocusRef={dialog?.options.returnFocusRef} dismissible={!!dialog?.buttons.some(button => button.style === 'cancel') || !!dialog?.options.cancelable}>
    {destructive ? <Text style={{ ...type.heading, color: colors.text }}>{dialog?.title}</Text> : null}
    {dialog?.message ? <Text style={{ ...type.body, color: colors.muted, marginBottom: 8 }}>{dialog.message}</Text> : null}
    {dialog?.buttons.filter(button => button.style !== 'cancel').map((button, index) => <AppButton key={index} label={button.text || 'OK'} variant={button.style === 'destructive' ? 'destructive' : 'primary'} onPress={() => choose(button)} />)}
    {dialog?.buttons.filter(button => button.style === 'cancel').map((button, index) => <AppButton key={`cancel-${index}`} label={button.text || 'Cancel'} variant="secondary" onPress={() => choose(button)} />)}
  </Presentation></>;
}
