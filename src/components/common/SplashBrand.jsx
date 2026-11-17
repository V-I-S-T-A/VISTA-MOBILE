import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, StyleSheet, View } from 'react-native';
import { Text } from './FontText';
import useReducedMotion from '../../hooks/useReducedMotion';
import { colors, radii, space, splashLayout, type } from '../../theme/tokens';

// Double beat, then rest. Reduced-motion and background states stay still.
export default function SplashBrand({ active = true }) {
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const phase = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    phase.setValue(0);
    if (!active || reduced || !foreground) return;
    const animation = Animated.loop(Animated.timing(phase, { toValue: 1, duration: splashLayout.beatDuration, easing: Easing.linear, useNativeDriver: true, isInteraction: false }));
    animation.start();
    return () => { animation.stop(); phase.stopAnimation(); phase.setValue(0); };
  }, [active, reduced, foreground, phase]);
  const inputRange = [0, 0.13, 0.24, 0.37, 0.52, 1];
  const scale = phase.interpolate({ inputRange, outputRange: [1, 1.065, 1, 1.04, 1, 1] });
  const haloScale = phase.interpolate({ inputRange, outputRange: [0.75, 1, 0.9, 1.18, 1.28, 1.28] });
  const opacity = phase.interpolate({ inputRange, outputRange: [0, 0.13, 0.05, 0.1, 0, 0] });
  return <View style={styles.mark} accessible accessibilityRole="image" accessibilityLabel="VISTA">
    <Animated.View pointerEvents="none" style={[styles.halo, { opacity, transform: [{ scale: haloScale }] }]} />
    <Animated.View pointerEvents="none" style={[styles.ring, { opacity, transform: [{ scale: haloScale }] }]} />
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image source={require('../../assets/vista-logo.webp')} style={styles.logo} resizeMode="contain" accessible={false} />
    </Animated.View>
  </View>;
}

export function SplashCredit() {
  return <View style={styles.credit} accessible accessibilityLabel="from P.House">
    <Text style={styles.from}>from</Text>
    <View style={styles.creator}>
      <Image source={require('../../assets/branding/house.png')} style={styles.house} resizeMode="contain" accessible={false} />
      <Text style={styles.name}>P.House</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  mark: { width: splashLayout.haloSize, height: splashLayout.haloSize, alignItems: 'center', justifyContent: 'center' },
  logo: { width: splashLayout.logoSize, height: splashLayout.logoSize },
  halo: { position: 'absolute', width: splashLayout.haloSize, height: splashLayout.haloSize, borderRadius: radii.pill, backgroundColor: colors.blue },
  ring: { position: 'absolute', width: splashLayout.ringSize, height: splashLayout.ringSize, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.blue },
  credit: { alignItems: 'center', gap: space.xs },
  from: { ...type.meta, color: colors.muted },
  creator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  house: { width: splashLayout.houseSize, height: splashLayout.houseSize },
  name: { ...type.heading, color: colors.blue },
});
