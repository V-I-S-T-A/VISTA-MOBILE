import { useLayoutEffect } from 'react';
import Animated, { cancelAnimation, Easing, runOnJS, runOnUI, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ScreenMotionContext } from './ScreenMotionContext';
import { motion } from '../theme/tokens';

// Keep the route mounted while UI-thread values move its body and cancel that
// movement for its header. Retargeting withTiming continues from the actual
// displayed position, including rapid reversals, without a JS frame listener.
export default function TabScene({ sceneKey, transition, width, current, visible = current, onFinish, children }) {
  const offset = useSharedValue(0);
  const active = useSharedValue(false);
  const participates = Boolean(transition?.scenes.has(sceneKey));
  const incoming = transition?.to === sceneKey;
  const direction = transition?.direction || 0;
  const revision = transition?.revision;
  const reduced = transition?.reduced;
  const ready = transition?.ready;
  const seed = incoming ? direction * width : 0;
  const target = incoming ? 0 : (transition?.scenes.get(sceneKey)?.exitDirection || -direction) * width;
  const style = useAnimatedStyle(() => ({
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    opacity: participates ? incoming && !active.value ? 0 : 1 : visible ? 1 : 0,
    transform: [{ translateX: participates ? active.value ? offset.value : seed : 0 }],
  }));
  useLayoutEffect(() => {
    const reset = () => {
      'worklet';
      cancelAnimation(offset); active.value = false; offset.value = 0;
    };
    if (!participates) { runOnUI(reset)(); return; }
    if (!ready) return;
    // Native layout first, then the committed starting pose. Starting from the
    // parent layout effect can race Fabric attaching a cold/cached scroll tree.
    const frame = requestAnimationFrame(() => runOnUI(() => {
      'worklet';
      if (!active.value) offset.value = seed;
      active.value = true;
      if (reduced) { offset.value = target; runOnJS(onFinish)(revision, sceneKey); }
      else offset.value = withTiming(target, { duration: motion.tab, easing: Easing.out(Easing.cubic) }, finished => {
        if (finished) runOnJS(onFinish)(revision, sceneKey);
      });
    })());
    return () => cancelAnimationFrame(frame);
  }, [revision, participates, reduced, width, ready]);
  useLayoutEffect(() => () => cancelAnimation(offset), [offset]);
  const headerMotion = participates ? { visible: true, offset, active, seed } : null;
  return <Animated.View style={[{ opacity: participates ? incoming ? 0 : 1 : visible ? 1 : 0 }, style]} pointerEvents={current ? 'box-none' : 'none'}>
    <ScreenMotionContext.Provider value={headerMotion}>{children}</ScreenMotionContext.Provider>
  </Animated.View>;
}
