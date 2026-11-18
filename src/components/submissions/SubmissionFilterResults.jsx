import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { SubmissionListSkeleton } from '../common/Skeleton';
import useReducedMotion from '../../hooks/useReducedMotion';
import { motion } from '../../theme/tokens';
import useNavigationContentReady from '../../hooks/useNavigationContentReady';

// Only the result body is deferred. Filters and queries update immediately;
// cached rows mount in a background render instead of blocking the selection.
export default function SubmissionFilterResults({ filterKey, loading = false, children }) {
  const contentReady = useNavigationContentReady(filterKey);
  const pending = loading || !contentReady;
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    opacity.stopAnimation();
    if (pending || reducedMotion) opacity.setValue(1);
    else {
      opacity.setValue(motion.pressedOpacity);
      Animated.timing(opacity, {
        toValue: 1, duration: motion.fast,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    }
    return () => opacity.stopAnimation();
  }, [filterKey, pending, reducedMotion, opacity]);

  return <Animated.View style={{ opacity }}>
    {pending ? <SubmissionListSkeleton count={5} /> : children}
  </Animated.View>;
}
