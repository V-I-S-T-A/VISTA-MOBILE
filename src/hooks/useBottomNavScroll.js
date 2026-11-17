import { useEffect, useMemo } from 'react';
import { createBottomNavScroll } from '../utils/bottomNavScroll.cjs';
import { nav } from '../theme/tokens';

export default function useBottomNavScroll(navigation) {
  const behavior = useMemo(() => createBottomNavScroll(nav.scroll), []);
  useEffect(() => {
    // Cached tab routes keep their scroll position but always return with controls visible.
    const unsubscribe = navigation?.addListener?.('focus', () => behavior.show());
    return () => { unsubscribe?.(); behavior.show(); };
  }, [navigation, behavior]);
  return behavior;
}
