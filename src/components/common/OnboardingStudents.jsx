import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import useReducedMotion from '../../hooks/useReducedMotion';
import { onboardingLayout } from '../../theme/tokens';
import { ONBOARDING_CHARACTERS, ONBOARDING_POSES } from '../../data/onboardingCharacters';

function ArtworkPiece({ rig, bounds, scale, rotation }) {
  const crops = (bounds.regions || [bounds]).map((region, index) => <View key={index} style={{ position: 'absolute', width: region.width * scale, height: region.height * scale, overflow: 'hidden',
    left: (rotation ? region.x - bounds.pivot.x : region.x) * scale,
    top: (rotation ? region.y - bounds.pivot.y : region.y) * scale }}>
    <Image source={rig.source} resizeMode="stretch" style={{ position: 'absolute', width: rig.width * scale, height: rig.height * scale, left: -region.x * scale, top: -region.y * scale }} />
  </View>);
  return rotation ? <Animated.View style={{ position: 'absolute', left: bounds.pivot.x * scale, top: bounds.pivot.y * scale, width: 0, height: 0, transform: [{ rotate: rotation }] }}>{crops}</Animated.View> : crops[0];
}

// The torso stays anchored. Cropped head and forearm layers turn about their
// own neck/elbow pivots; no translation/rotation is applied to the whole image.
export default function OnboardingStudents({ active, style, character = 'student', gesture = 0 }) {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const phase = useRef(new Animated.Value(0)).current;
  const rig = ONBOARDING_POSES[character]?.[gesture] || ONBOARDING_CHARACTERS[character] || ONBOARDING_CHARACTERS.student;
  const artworkWidth = rig.width - (rig.cropLeft || 0) - (rig.cropRight || 0);
  const scale = Math.min(frame.width / artworkWidth, frame.height / rig.height);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    phase.setValue(0);
    if (!active || reduced || !focused || !foreground) return;
    const config = { duration: onboardingLayout.motionDuration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false };
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(phase, { ...config, toValue: 1 }),
      Animated.timing(phase, { ...config, toValue: 0 }),
    ]));
    animation.start();
    return () => { animation.stop(); phase.stopAnimation(); phase.setValue(0); };
  }, [active, reduced, focused, foreground, phase, character, gesture]);
  const arm = (rig.armDegrees ?? onboardingLayout.armDegrees) * (gesture === 2 ? 0.6 : 1);
  const head = rig.headDegrees ?? onboardingLayout.headDegrees;
  const headRotation = phase.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', `${head}deg`, `${-head}deg`, `${head / 2}deg`, '0deg'] });
  const armRotation = phase.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', `${-arm}deg`, `${arm * 0.6}deg`, `${-arm * 0.75}deg`, '0deg'] });
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={style}
      onLayout={({ nativeEvent: { layout } }) => setFrame(previous => previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height })}>
      {scale > 0 ? <View style={{ position: 'absolute', left: (frame.width - artworkWidth * scale) / 2 - (rig.cropLeft || 0) * scale, bottom: -(rig.bottomInset || 2) * scale, width: rig.width * scale, height: rig.height * scale }}>
        <ArtworkPiece rig={rig} bounds={rig.head} scale={scale} rotation={headRotation} />
        <ArtworkPiece rig={rig} bounds={rig.arm} scale={scale} rotation={armRotation} />
        {rig.body.map((bounds, index) => <ArtworkPiece key={index} rig={rig} bounds={bounds} scale={scale} />)}
      </View> : <Image source={rig.source} resizeMode="contain" style={{ width: '100%', height: '100%' }} />}
    </View>
  );
}
