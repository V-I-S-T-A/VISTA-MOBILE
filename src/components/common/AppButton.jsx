import { ActivityIndicator, Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import usePressFeedback from '../../hooks/usePressFeedback';
import { Text } from './FontText';
import { colors, radii, sizes, type, reviewControls, space, motion } from '../../theme/tokens';

export default function AppButton({ label, children = null, onPress, onPressIn, onPressOut, busy = false, disabled = false, variant = 'primary', style = undefined, textStyle = undefined, size = 'regular', surfaceStyle = undefined, ...props }) {
  const feedback = usePressFeedback(disabled || busy);
  const secondary = variant === 'secondary';
  const accent = variant === 'accent';
  const backgroundColor = secondary ? 'transparent' : variant === 'destructive' ? colors.danger : accent ? colors.yellow : colors.blue;
  const compact = size === 'compact';
  const content = busy ? <ActivityIndicator color={secondary ? colors.blue : accent ? colors.onYellow : 'white'} /> : children || <Text style={[styles.text, compact && reviewControls.action, { color: secondary ? colors.muted : accent ? colors.onYellow : 'white' }, textStyle]}>{label}</Text>;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }}
    activeOpacity={motion.pressedOpacity} {...props} onPress={onPress} disabled={disabled || busy}
    onPressIn={event => { feedback.pressIn(); onPressIn?.(event); }} onPressOut={event => { feedback.pressOut(); onPressOut?.(event); }}
    style={[styles.button, compact && styles.compactTarget, { backgroundColor: compact ? 'transparent' : backgroundColor, opacity: disabled || busy ? motion.disabledOpacity : 1 }, style]}>
    <Animated.View style={[styles.feedback, { transform: [{ scale: feedback.scale }] }]}>
      {compact ? <View style={[styles.compactSurface, { backgroundColor }, surfaceStyle]}>{content}</View> : content}
    </Animated.View>
  </TouchableOpacity>;
}
const styles = StyleSheet.create({
  feedback: { width: '100%', flexShrink: 1, alignItems: 'center' },
  button: { minHeight: sizes.touch, paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radii.button, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  compactTarget: { paddingVertical: 0, paddingHorizontal: 0, borderRadius: reviewControls.radius },
  compactSurface: { width: '100%', minHeight: reviewControls.actionHeight, paddingVertical: 4, paddingHorizontal: reviewControls.padding, borderRadius: reviewControls.radius, alignItems: 'center', justifyContent: 'center' },
  text: { ...type.button, textAlign: 'center', flexShrink: 1 },
});
