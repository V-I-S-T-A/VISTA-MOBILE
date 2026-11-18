import { useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Immersive Android's transient system bar must not relayout the profile footer.
// Genuine width/orientation changes establish a fresh baseline. Keyboard resize
// remains available to the existing keyboard-aware form.
export default function useStableBottomLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const resting = useRef(null);
  if (!resting.current || Math.abs(width - resting.current.width) > 50) {
    resting.current = { width, height, bottom: insets.bottom };
  }
  resting.current.height = Math.max(resting.current.height, height);
  const shrink = resting.current.height - height;
  return {
    bottom: resting.current.bottom,
    marginBottom: shrink > 0 && shrink <= 100 ? -shrink : 0,
  };
}
