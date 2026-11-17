import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useConnectivity from '../../hooks/useConnectivity';
import { checkConnection } from '../../lib/networkRuntime';
import { colors, radii, space, type } from '../../theme/tokens';
import { Text } from './FontText';
import AppButton from './AppButton';

export default function OfflineBanner() {
  const online = useConnectivity();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(false);
  if (online) return null;
  return <View style={{ paddingTop: insets.top + space.xs, paddingHorizontal: space.md, backgroundColor: colors.background }}>
    <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radii.field, backgroundColor: colors.warningSurface }}>
      <Text style={{ ...type.meta, color: colors.warningText, flex: 1 }}>Connection unavailable. Browse cached data; reconnect to refresh or save.</Text>
      <AppButton label="Retry" variant="secondary" busy={checking} onPress={async () => {
        setChecking(true);
        try { await checkConnection(); } finally { setChecking(false); }
      }} />
    </View>
  </View>;
}
