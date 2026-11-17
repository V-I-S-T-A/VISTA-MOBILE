import { useEffect, useState } from 'react';
import { AccessibilityInfo, Keyboard, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useConnectivity from '../../hooks/useConnectivity';
import { checkConnection } from '../../lib/networkRuntime';
import { colors, radii, sizes, space, type, stateLayout } from '../../theme/tokens';
import { Text } from './FontText';
import AppButton from './AppButton';
import VistaIcon from './VistaIcon';

export default function OfflineBanner({ bottomOffset = 0 }) {
  const online = useConnectivity();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(false);
  const [visible, setVisible] = useState(!online);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => { setVisible(!online); }, [online]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => {
    if (online || !visible || checking) return;
    let active = true;
    const timer = setTimeout(() => setVisible(false), stateLayout.noticeDuration);
    // Keep recovery available until dismissed for users navigating by screen reader.
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => { if (active && enabled) clearTimeout(timer); }).catch(() => {});
    return () => { active = false; clearTimeout(timer); };
  }, [online, visible, checking]);
  if (online || !visible || keyboardOpen) return null;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: Math.max(insets.left, space.lg), right: Math.max(insets.right, space.lg), bottom: Math.max(insets.bottom, space.lg) + bottomOffset }}>
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingLeft: space.md, paddingRight: space.xs, paddingVertical: space.xs, borderRadius: radii.field, backgroundColor: colors.navy }}>
      <VistaIcon name="wifi-off" size={sizes.icon} color={colors.onBrand} />
      <Text style={{ ...type.meta, color: colors.onBrand, flex: 1 }}>Connection unavailable. Reconnect to refresh or save.</Text>
      <AppButton label="Retry" variant="secondary" busy={checking} onPress={async () => {
        setChecking(true);
        try { await checkConnection(); } finally { setChecking(false); }
      }} textStyle={{ color: colors.yellow }} />
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Dismiss connection notice" onPress={() => setVisible(false)} style={{ minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' }}>
        <VistaIcon name="x" size={sizes.icon} color={colors.onBrand} />
      </TouchableOpacity>
    </View>
  </View>;
}
