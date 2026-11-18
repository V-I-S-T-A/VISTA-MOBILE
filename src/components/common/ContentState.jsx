import { Image, StyleSheet, View } from 'react-native';
import { isConnectionError } from '../../lib/connectivityState.cjs';
import { colors, space, stateLayout, type } from '../../theme/tokens';
import { Text } from './FontText';
import AppButton from './AppButton';

// Static requires include both illustrations in release builds; no image request is needed.
const artwork = {
  empty: require('../../assets/state-empty.webp'),
  error: require('../../assets/state-connection.webp'),
};

export default function ContentState({ variant = 'empty', title, message, error, onRetry, busy = false, compact = false, children }) {
  const failed = variant === 'error';
  const unauthorized = [401, 403].includes(error?.status || error?.response?.status);
  const connection = failed && !error?.status && !error?.response?.status && isConnectionError(error);
  const heading = unauthorized ? 'Access unavailable' : connection ? 'Let’s reconnect' : title || (failed ? 'Could not load this content' : 'Nothing here yet');
  const description = unauthorized
    ? 'Your session may have expired, or you may not have access to this content.'
    : connection ? 'VISTA can’t be reached right now. Check your connection and try again.'
    : message || (failed ? 'Please try again in a moment.' : 'New items will appear here when they’re available.');
  const artSize = compact ? stateLayout.compactArtSize : stateLayout.artSize;
  return <View style={[styles.state, compact && styles.compact]}>
    <Image source={failed ? artwork.error : artwork.empty} resizeMode="contain" pointerEvents="none" accessible={false}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants" accessibilityIgnoresInvertColors style={{ width: artSize, height: artSize }} />
    <Text accessibilityRole={failed ? 'alert' : 'header'} style={styles.title}>{heading}</Text>
    <Text style={styles.message}>{description}</Text>
    {onRetry ? <AppButton label="Try again" onPress={onRetry} busy={busy} variant="secondary" /> : null}
    {children}
  </View>;
}

const styles = StyleSheet.create({
  state: { width: '100%', alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.md },
  compact: { paddingVertical: space.lg },
  title: { ...type.heading, color: colors.text, textAlign: 'center', maxWidth: stateLayout.contentWidth },
  message: { ...type.body, color: colors.muted, textAlign: 'center', maxWidth: stateLayout.contentWidth },
});
