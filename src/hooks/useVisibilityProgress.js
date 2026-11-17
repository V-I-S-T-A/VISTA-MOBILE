import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import useReducedMotion from './useReducedMotion';
import { motion } from '../theme/tokens';

// One native timeline for simple overlays and transient notices. Interrupted
// animations resume from the displayed value; stale callbacks cannot dismiss it.
export default function useVisibilityProgress(visible, onHidden, duration = motion.fast) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced && visible ? 1 : 0)).current;
  const callback = useRef(onHidden);
  callback.current = onHidden;
  useEffect(() => {
    let active = true;
    progress.stopAnimation();
    if (reduced) {
      progress.setValue(visible ? 1 : 0);
      if (!visible) callback.current?.();
    } else Animated.timing(progress, { toValue: visible ? 1 : 0, duration,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true }).start(({ finished }) => {
      if (active && finished && !visible) callback.current?.();
    });
    return () => { active = false; progress.stopAnimation(); };
  }, [visible, reduced, duration, progress]);
  return progress;
}
