import { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import AppButton from '../../components/common/AppButton';
import OnboardingStudents from '../../components/common/OnboardingStudents';
import { ONBOARDING_TOURS, ONBOARDING_MASCOTS } from '../../data/onboardingContent';
import { colors, motion, onboardingLayout, radii, sizes, space, type } from '../../theme/tokens';

export default function OnboardingScreen({ onComplete, initialAudience = 'student', replay = false }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [audience, setAudience] = useState(initialAudience === 'staff' ? 'staff' : 'student');
  const [step, setStep] = useState(-1);
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  const scroll = useRef(null);
  const slides = ONBOARDING_TOURS[audience];
  const slide = slides[step];
  const mascots = ONBOARDING_MASCOTS[audience];
  const artHeight = Math.max(onboardingLayout.artMinHeight, Math.min(onboardingLayout.artMaxHeight, height * onboardingLayout.artRatio));
  const back = () => { setStep(current => Math.max(-1, current - 1)); scroll.current?.scrollTo({ y: 0, animated: false }); };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step < 0) return false;
      if (!finishingRef.current) back();
      return true;
    });
    return () => subscription.remove();
  }, [step]);
  const finish = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    await onComplete();
  };
  const next = () => {
    if (step === slides.length - 1) return finish();
    setStep(current => current + 1);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={styles.width}>
        <View style={[styles.header, step < 0 && styles.welcomeHeader]}>
          {step < 0 ? (
            <View style={styles.brand}>
              <Image source={require('../../assets/vista-logo.webp')} style={styles.logo} resizeMode="contain" accessible={false} />
              <Text style={styles.brandText}>VISTA</Text>
            </View>
          ) : (
            <Text style={styles.progress}>{step + 1} of {slides.length}</Text>
          )}
          {step >= 0 ? <AppButton label="Skip" variant="secondary" style={styles.skip} textStyle={styles.skipText} onPress={finish} disabled={finishing} /> : null}
        </View>
      </View>

      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.width}>
          {step < 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeIntro}>
                <Text accessibilityRole="header" style={styles.title}>Welcome to VISTA</Text>
                <Text style={styles.description}>See how VISTA helps you, one feature at a time.</Text>
                <Text style={styles.caption}>Choose your tour</Text>
              </View>
              {[
                { id: 'student', title: 'Student', description: 'Monitor documents and follow staff feedback.' },
                { id: 'staff', title: 'OSA Staff', description: 'Register, review, and organize event documents.' },
              ].map(role => (
                <TouchableOpacity key={role.id} accessibilityRole="radio" accessibilityState={{ checked: audience === role.id }}
                  accessibilityLabel={`${role.title} tour, ${role.description}`} onPress={() => setAudience(role.id)} activeOpacity={motion.pressedOpacity}
                  style={[styles.roleCard, role.id === 'staff' && styles.staffCard, audience === role.id && styles.selectedCard]}>
                  <View style={styles.roleText}>
                    <Text style={styles.roleTitle}>{role.title}</Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                    <Text style={styles.selectedLabel}>{audience === role.id ? 'Selected' : 'Tap to explore'}</Text>
                  </View>
                  <OnboardingStudents active={audience === role.id} character={role.id} style={styles.roleArt} />
                </TouchableOpacity>
              ))}
              <Text style={styles.note}>Your account access is determined when you sign in.</Text>
            </View>
          ) : (
            <View key={`${audience}-${step}`}>
              <View style={[styles.scene, { height: artHeight }]}>
                  <OnboardingStudents active character={audience} gesture={step} style={styles.heroArt} />
                  {step > 0 ? <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.contextMascots}>
                    <Image source={mascots[step]} resizeMode="contain" style={styles.contextMascot} />
                    <Image source={mascots[step - 1]} resizeMode="contain" style={styles.companionMascot} />
                  </View> : null}
                {step === 0 ? <View style={styles.features} accessible accessibilityLabel={slide.highlights.join(', ')}>
                  {mascots.map((source, index) => <View key={index} style={[styles.featureCircle, index === step && styles.currentFeature]}>
                    <Image source={source} resizeMode="contain" style={styles.mascot} accessible={false} />
                  </View>)}
                </View> : null}
              </View>
              <View style={styles.copy}>
                <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <View style={styles.width}>
          {step >= 0 ? <View accessible accessibilityLabel={`Page ${step + 1} of ${slides.length}`} style={styles.dots}>
            {slides.map((_, index) => <View key={index} style={[styles.dot, index === step && styles.activeDot]} />)}
          </View> : null}
          <View style={styles.actions}>
            {step >= 0 ? <TouchableOpacity onPress={back} disabled={finishing} accessibilityRole="button" accessibilityLabel="Previous onboarding page" style={styles.back}>
              <Feather name="arrow-left" size={sizes.navIcon} color={colors.navy} />
            </TouchableOpacity> : null}
            <AppButton style={styles.next} label={step < 0 ? `Explore the ${audience === 'student' ? 'Student' : 'Staff'} tour` : step === slides.length - 1 ? replay ? 'Done' : 'Get started' : 'Next'} onPress={next} busy={finishing} />
          </View>
          {step < 0 ? <AppButton label={replay ? 'Back to Settings' : 'I already have an account'} variant="secondary" onPress={finish} disabled={finishing} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  width: { width: '100%', maxWidth: sizes.contentWidth, alignSelf: 'center' },
  header: { paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: sizes.touch + space.lg },
  welcomeHeader: { minHeight: onboardingLayout.logoSize + space.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  logo: { width: onboardingLayout.logoSize, height: onboardingLayout.logoSize },
  brandText: { ...type.heading, color: colors.blue, letterSpacing: 2 },
  back: { width: sizes.touch, minHeight: sizes.touch, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  progress: { ...type.sectionTitle, color: colors.blue },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl, flexGrow: 1 },
  welcome: { paddingTop: space.xs, gap: space.md },
  welcomeIntro: { gap: space.xs },
  title: { ...type.title, fontFamily: type.bold, letterSpacing: 0, color: colors.navy },
  description: { ...type.body, color: colors.muted },
  caption: { ...type.label, color: colors.blue },
  roleCard: { flexDirection: 'row', alignItems: 'center', minHeight: onboardingLayout.roleMinHeight, padding: space.md, borderRadius: radii.card, backgroundColor: colors.selectedSurface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  staffCard: { backgroundColor: colors.warningSurface },
  selectedCard: { borderColor: colors.blue },
  roleText: { flex: 1, gap: space.sm, minWidth: 0, paddingRight: onboardingLayout.roleArtWidth },
  roleTitle: { ...type.heading, color: colors.navy },
  roleDescription: { ...type.meta, color: colors.text },
  selectedLabel: { ...type.meta, color: colors.blue, fontFamily: type.medium },
  roleArt: { position: 'absolute', right: 0, bottom: 0, width: onboardingLayout.roleArtWidth, height: onboardingLayout.roleArtHeight },
  note: { ...type.meta, color: colors.muted },
  scene: { backgroundColor: colors.selectedSurface, borderRadius: radii.sheet, marginTop: space.sm, overflow: 'hidden' },
  heroArt: { position: 'absolute', bottom: 0, right: 0, width: '88%', height: '94%' },
  features: { position: 'absolute', left: space.md, top: space.lg, bottom: space.lg, justifyContent: 'space-between' },
  featureCircle: { width: onboardingLayout.featureSize, height: onboardingLayout.featureSize, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  currentFeature: { borderColor: colors.blue },
  mascot: { width: onboardingLayout.mascotSize, height: onboardingLayout.mascotSize },
  contextMascots: { position: 'absolute', left: space.lg, top: space.xxxl, bottom: space.xxl, justifyContent: 'space-between', alignItems: 'center' },
  contextMascot: { width: onboardingLayout.contextMascotSize, height: onboardingLayout.contextMascotSize },
  companionMascot: { width: onboardingLayout.mascotSize, height: onboardingLayout.mascotSize },
  copy: { paddingTop: space.xl, gap: space.md },
  skip: { backgroundColor: colors.field, borderRadius: radii.pill },
  skipText: { color: colors.text },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.surface },
  actions: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  next: { flex: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  dot: { width: onboardingLayout.dotSize, height: onboardingLayout.dotSize, borderRadius: radii.pill, backgroundColor: colors.border },
  activeDot: { width: onboardingLayout.activeDotWidth, backgroundColor: colors.blue },
});
