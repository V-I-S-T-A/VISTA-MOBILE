import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/common/FontText';
import AppButton from '../components/common/AppButton';
import SplashBrand, { SplashCredit } from '../components/common/SplashBrand';
import { useScreenRefresh } from '../hooks/useScreenRefresh';
import { colors, space, splashLayout, type } from '../theme/tokens';

export default function SplashScreen({ error, onRetry }) {
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useScreenRefresh([], error ? onRetry : undefined);
  return <View style={styles.screen}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      alwaysBounceVertical={Boolean(error)} overScrollMode={error ? 'always' : 'never'}
      refreshControl={error ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
      <SplashBrand active={!error} />
      {error ? <View style={styles.error}>
        <Text style={styles.message} accessibilityLiveRegion="polite">{error}</Text>
        <AppButton label="Try again" onPress={onRetry} />
      </View> : null}
    </ScrollView>
    <View pointerEvents="none" style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) + splashLayout.footerGap }]}>
      <SplashCredit />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, paddingVertical: splashLayout.creditClearance },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: space.lg },
  error: { gap: space.lg, width: '100%', maxWidth: splashLayout.messageWidth, marginTop: space.xl },
  message: { ...type.body, textAlign: 'center', color: colors.muted },
});
