import { useMemo } from 'react';
import { Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

// Every Android navigator hides the navigation bar. Its temporary Back/Home/
// Recents bar overlays the app; the foreground inset must not become page padding.
// Keep the native safe-area provider above this boundary so top/side cutouts and
// frame updates still follow the real window. iOS keeps its home-indicator inset.
export default function ImmersiveLayout({ children }) {
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  const bottom = android ? 0 : insets.bottom;
  const stableInsets = useMemo(
    () => ({ top: insets.top, right: insets.right, bottom, left: insets.left }),
    [insets.top, insets.right, bottom, insets.left],
  );

  return (
    <SafeAreaInsetsContext.Provider value={stableInsets}>
      <KeyboardProvider navigationBarTranslucent={android} preserveEdgeToEdge={android}>
        {children}
      </KeyboardProvider>
    </SafeAreaInsetsContext.Provider>
  );
}
