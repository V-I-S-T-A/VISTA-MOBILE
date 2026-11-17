import { Platform, TurboModuleRegistry, View } from 'react-native';

// An older installed development client may receive the current JS before its
// native rebuild. Keep its existing navigation/native refresh usable rather than
// importing RNGH's enforcing TurboModule and crashing at startup.
export const nativeGesturesAvailable = Platform.OS === 'web' || !!TurboModuleRegistry?.get('RNGestureHandlerModule');
const runtime = nativeGesturesAvailable ? require('react-native-gesture-handler') : null;
export const GestureHandlerRootView = runtime?.GestureHandlerRootView || View;
export const Gesture = runtime?.Gesture;
export const GestureDetector = runtime?.GestureDetector;
