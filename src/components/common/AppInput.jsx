import { forwardRef, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { TextInput } from './FontText';
import { colors, radii, sizes, type, form, reviewControls } from '../../theme/tokens';

export default forwardRef(function AppInput({ style, multiline, size = 'regular', error = false, onFocus, onBlur, ...props }, ref) {
  const input = useRef(null);
  const [focused, setFocused] = useState(false);
  const state = { onFocus: event => { setFocused(true); onFocus?.(event); }, onBlur: event => { setFocused(false); onBlur?.(event); } };
  const fieldStyle = [styles.field, size === 'compact' && styles.compactField, multiline && styles.multiline, props.editable === false && styles.disabled, focused && styles.focused, error && styles.error, style];
  if (size === 'compact') return <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.compactTarget}>
    <TextInput ref={node => { input.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }} placeholderTextColor={colors.placeholder} underlineColorAndroid="transparent" {...props} {...state} multiline={multiline} style={fieldStyle} />
  </Pressable>;
  return <TextInput ref={ref} placeholderTextColor={colors.placeholder} underlineColorAndroid="transparent" {...props} {...state} multiline={multiline} style={fieldStyle} />;
});
const styles = StyleSheet.create({
  field: { ...type.field, minHeight: sizes.input, borderWidth: 1, borderColor: colors.border, borderRadius: radii.field, borderCurve: 'continuous', paddingHorizontal: form.paddingHorizontal, paddingVertical: form.paddingVertical, backgroundColor: colors.field, color: colors.text },
  focused: { borderColor: colors.focus, backgroundColor: colors.surface },
  error: { borderColor: colors.danger },
  disabled: { backgroundColor: colors.disabledSurface, color: colors.disabledText },
  compactTarget: { minHeight: sizes.touch, justifyContent: 'center' },
  compactField: { ...reviewControls.value, minHeight: reviewControls.fieldHeight, paddingVertical: 4, paddingHorizontal: reviewControls.padding, borderRadius: reviewControls.radius },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
