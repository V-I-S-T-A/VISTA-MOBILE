import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import useReducedMotion from './useReducedMotion';
import { motion } from '../theme/tokens';

// Animate the visual surface, keeping its hit target and layout stationary.
export default function usePressFeedback(disabled = false) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (disabled || reduced) { scale.stopAnimation(); scale.setValue(1); }
    return () => scale.stopAnimation();
  }, [disabled, reduced, scale]);
  const feedback = pressed => {
    scale.stopAnimation();
    if (disabled || reduced) { scale.setValue(1); return; }
    Animated.timing(scale, { toValue: pressed ? motion.pressedScale : 1,
      duration: pressed ? motion.pressIn : motion.pressOut,
      easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  return { scale, pressIn: () => feedback(true), pressOut: () => feedback(false) };
}
