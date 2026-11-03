import { forwardRef, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { TextInput } from './FontText';
import { colors, radii, sizes, type, form, reviewControls } from '../../theme/tokens';

export default forwardRef(function AppInput({ style, multiline, size = 'regular', ...props }, ref) {
  const input = useRef(null);
  if (size === 'compact') return <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.compactTarget}>
    <TextInput ref={node => { input.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }} placeholderTextColor="#8290A8" underlineColorAndroid="transparent" {...props} multiline={multiline} style={[styles.field, styles.compactField, multiline && styles.multiline, style]} />
  </Pressable>;
  return <TextInput ref={ref} placeholderTextColor="#8290A8" underlineColorAndroid="transparent" {...props} multiline={multiline}
    style={[styles.field, multiline && styles.multiline, style]} />;
});
const styles = StyleSheet.create({
  field: { ...type.field, minHeight: sizes.input, borderWidth: 1, borderColor: colors.border, borderRadius: radii.field, paddingHorizontal: form.paddingHorizontal, paddingVertical: form.paddingVertical, backgroundColor: colors.surface, color: colors.text },
  compactTarget: { minHeight: sizes.touch, justifyContent: 'center' },
  compactField: { ...reviewControls.value, minHeight: reviewControls.fieldHeight, paddingVertical: 4, paddingHorizontal: reviewControls.padding, borderRadius: reviewControls.radius },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
