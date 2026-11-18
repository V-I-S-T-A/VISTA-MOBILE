import { Component } from 'react';
import { Animated, Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { colors, motion, radii, sizes, space, stateLayout, type } from '../../theme/tokens';
import useVisibilityProgress from '../../hooks/useVisibilityProgress';
import * as NativeSplash from 'expo-splash-screen';

// This last-resort view does not depend on auth, navigation, portals, fonts or
// remote assets: any of those descendants may be the component that failed.
export function AppRecoveryScreen({ onRetry }) {
  const opacity = useVisibilityProgress(true);
  return <SafeAreaView onLayout={() => { NativeSplash.hideAsync().catch(() => {}); }} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.xl, paddingTop: space.xxxl + (StatusBar.currentHeight || 0), paddingBottom: space.xxxl }}>
      <Animated.View style={{ alignItems: 'center', opacity }}>
        <View style={{ width: '100%', maxWidth: sizes.contentWidth, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, padding: space.xxl, gap: space.md }}>
          <Image accessible={false} source={require('../../assets/state-connection.webp')} resizeMode="contain" style={{ width: stateLayout.artSize, height: stateLayout.artSize }} />
          <Text accessibilityRole="header" style={{ fontSize: type.title.fontSize, lineHeight: type.title.lineHeight, fontWeight: '600', color: colors.text, textAlign: 'center' }}>Let’s try that again</Text>
          <Text accessibilityRole="alert" style={{ fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: colors.muted, textAlign: 'center', maxWidth: stateLayout.contentWidth }}>VISTA could not display this screen. Reopen the app view to continue.</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Reopen VISTA" activeOpacity={motion.pressedOpacity} onPress={onRetry} style={{ width: '100%', minHeight: sizes.touch, justifyContent: 'center', alignItems: 'center', borderRadius: radii.button, padding: space.md, backgroundColor: colors.blue }}>
            <Text style={{ color: colors.onBrand, fontSize: type.button.fontSize, lineHeight: type.button.lineHeight, fontWeight: '600' }}>Reopen VISTA</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.muted, fontSize: type.meta.fontSize, lineHeight: type.meta.lineHeight, textAlign: 'center' }}>If you were sending an update, check its latest state before sending it again.</Text>
        </View>
      </Animated.View>
    </ScrollView>
  </SafeAreaView>;
}

export default class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    // Do not print exception payloads, account data, tokens or document contents.
    if (__DEV__) console.warn('[VISTA] A screen could not be rendered. Recovery is available.');
  }
  retry = () => this.setState({ failed: false });
  render() {
    return this.state.failed ? <AppRecoveryScreen onRetry={this.retry} /> : this.props.children;
  }
}
