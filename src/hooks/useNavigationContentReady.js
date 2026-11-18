import { startTransition, useContext, useDeferredValue, useEffect, useState } from 'react';
import { NavigationTransitionContext } from '../navigation/NavigationTransitionContext';

// Commit the destination's header/loading layout first. Prepare expensive read-only
// content after the actual native transition, without delaying queries or adding a
// timer. Once prepared, cached content stays mounted during later navigation.
export default function useNavigationContentReady(contentKey = true) {
  const transition = useContext(NavigationTransitionContext);
  const deferredKey = useDeferredValue(contentKey, null);
  const [preparedKey, setPreparedKey] = useState(null);

  useEffect(() => {
    if (preparedKey === contentKey || deferredKey !== contentKey) return;
    let active = true;
    const prepare = () => {
      if (active && !transition?.isActive()) {
        startTransition(() => setPreparedKey(contentKey));
      }
    };
    // Read the live bus here: the navigator sets it in its parent layout effect.
    const unsubscribe = transition?.subscribe(prepare);
    prepare();
    return () => { active = false; unsubscribe?.(); };
  }, [contentKey, deferredKey, preparedKey, transition]);

  return preparedKey === contentKey;
}
