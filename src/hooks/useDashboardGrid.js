import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContentHorizontalInsets } from '../theme/layout';
import { dashboardLayout, space } from '../theme/tokens';

export default function useDashboardGrid() {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measured, setMeasured] = useState(null);
  const horizontal = getContentHorizontalInsets(width, insets);
  const available = measured ?? width - horizontal.paddingLeft - horizontal.paddingRight;
  const columns = fontScale >= dashboardLayout.singleColumnFontScale ||
    (available - space.md) / 2 < dashboardLayout.minCardWidth * Math.max(fontScale, 1) ? 1 : 2;
  const onLayout = useCallback(event => {
    const next = event.nativeEvent.layout.width;
    if (next > 0) setMeasured(current => current === next ? current : next);
  }, []);
  return { columns, fontScale, onLayout };
}
