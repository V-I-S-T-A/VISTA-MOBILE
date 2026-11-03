import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Image, Text, View } from 'react-native';

const PHASES = Array.from({ length: 17 }, (_, index) => index / 16);

export default function VistaLoader({ fullScreen = false, light = false, fontsReady = true, message = 'Saving your submission…', onLayout }) {
  const phase = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => active && setReduceMotion(value));
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; listener.remove(); };
  }, []);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (reduceMotion || !active) return;
    // One native clock drives every element and does not block virtualized lists.
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true, isInteraction: false }));
    loop.start();
    return () => { loop.stop(); phase.setValue(0); };
  }, [phase, reduceMotion, active]);
  return <View onLayout={onLayout} accessibilityRole="progressbar" accessibilityLabel={message} accessibilityLiveRegion="polite"
    style={{ ...(fullScreen ? { flex: 1, backgroundColor: light ? '#FFFFFF' : '#17283E' } : {}), alignItems: 'center', justifyContent: 'center', padding: 28 }}>
    <Animated.View style={{ transform: [{ translateY: phase.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -8, 0, -4, 0] }) }] }}>
      <Image source={require('../../assets/logo.webp')} style={{ width: 64, height: 64 }} resizeMode="contain" />
    </Animated.View>
    <View style={{ flexDirection: 'row', gap: 9, marginTop: 22, marginBottom: 20 }}>
      {['#1A59A5', '#FDC849', '#5AB5CD'].map((color, index) => <Animated.View key={color} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, transform: [{ translateY: phase.interpolate({ inputRange: PHASES, outputRange: PHASES.map(value => reduceMotion ? 0 : -6 * Math.max(0, Math.sin((value - index / 6) * Math.PI * 2))) }) }] }} />)}
    </View>
    <Text style={{ ...(fontsReady ? { fontFamily: 'DMSans_500Medium' } : {}), color: light ? '#1E3A68' : '#FFFFFF', fontSize: 14, lineHeight: 21, textAlign: 'center' }}>{message}</Text>
  </View>;
}
