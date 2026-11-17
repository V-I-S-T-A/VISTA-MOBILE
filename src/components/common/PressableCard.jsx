import { Animated, TouchableOpacity, View } from 'react-native';
import usePressFeedback from '../../hooks/usePressFeedback';
import { motion } from '../../theme/tokens';

export default function PressableCard({ onPress, children, style, containerStyle, accessibilityLabel, accessibilityHint }) {
  const { scale, pressIn, pressOut } = usePressFeedback(!onPress);
  if (!onPress) return <View style={[style, containerStyle]}>{children}</View>;
  return <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
    accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}
    activeOpacity={motion.pressedOpacity} style={containerStyle}>
    <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
  </TouchableOpacity>;
}
