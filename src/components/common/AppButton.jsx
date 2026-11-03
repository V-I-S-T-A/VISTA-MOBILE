import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FontText';
import { colors, radii, sizes, type, reviewControls } from '../../theme/tokens';

export default function AppButton({ label, children, onPress, busy = false, disabled = false, variant = 'primary', style, textStyle, size = 'regular', surfaceStyle, ...props }) {
  const secondary = variant === 'secondary';
  const accent = variant === 'accent';
  const backgroundColor = secondary ? 'transparent' : variant === 'destructive' ? colors.danger : accent ? colors.yellow : colors.blue;
  const compact = size === 'compact';
  const content = busy ? <ActivityIndicator color={secondary ? colors.blue : accent ? colors.onYellow : 'white'} /> : children || <Text style={[styles.text, compact && reviewControls.action, { color: secondary ? colors.muted : accent ? colors.onYellow : 'white' }, textStyle]}>{label}</Text>;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }}
    activeOpacity={0.8} {...props} onPress={onPress} disabled={disabled || busy}
    style={[styles.button, compact && styles.compactTarget, { backgroundColor: compact ? 'transparent' : backgroundColor, opacity: disabled || busy ? 0.55 : 1 }, style]}>
    {compact ? <View style={[styles.compactSurface, { backgroundColor }, surfaceStyle]}>{content}</View> : content}
  </TouchableOpacity>;
}
const styles = StyleSheet.create({
  button: { minHeight: sizes.touch, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  compactTarget: { paddingVertical: 0, paddingHorizontal: 0, borderRadius: reviewControls.radius },
  compactSurface: { width: '100%', minHeight: reviewControls.actionHeight, paddingVertical: 4, paddingHorizontal: reviewControls.padding, borderRadius: reviewControls.radius, alignItems: 'center', justifyContent: 'center' },
  text: { ...type.body, fontFamily: type.medium, textAlign: 'center', flexShrink: 1 },
});
