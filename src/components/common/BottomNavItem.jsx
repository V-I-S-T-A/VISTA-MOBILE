import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, TouchableOpacity } from 'react-native';
import { motion, nav, sizes } from '../../theme/tokens';
import { navigationStyles } from '../../theme/layout';
import useReducedMotion from '../../hooks/useReducedMotion';
import VistaIcon from './VistaIcon';

// Equal icon-only slots match the reference; the central scan stays an action.
// Navigation runs immediately and never waits for visual feedback.
export default function BottomNavItem({ label, icon, selected = false, action = false, onPress }) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const highlighted = !action && (selected || pressed);
  const pressScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) { pressScale.stopAnimation(); pressScale.setValue(1); }
    return () => pressScale.stopAnimation();
  }, [reduced, pressScale]);
  const feedback = pressed => {
    pressScale.stopAnimation();
    if (reduced) pressScale.setValue(1);
    else Animated.timing(pressScale, {
      toValue: pressed ? motion.pressedScale : 1,
      duration: pressed ? motion.pressIn : motion.pressOut,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  };
  return <TouchableOpacity
    accessibilityLabel={label}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    onPressIn={() => { setPressed(true); feedback(true); }}
    onPressOut={() => { setPressed(false); feedback(false); }}
    activeOpacity={action ? 1 : motion.pressedOpacity}
    style={navigationStyles.item}
  >
    <Animated.View pointerEvents="none" accessible={false} style={[
      navigationStyles.indicator,
      action && navigationStyles.action,
      { transform: [{ translateY: action ? -nav.actionLift : 0 }, { scale: pressScale }] },
    ]}>
      <VistaIcon name={icon} size={action ? nav.actionIcon : sizes.navIcon} color={highlighted ? nav.selected : nav.inactive} />
    </Animated.View>
  </TouchableOpacity>;
}
