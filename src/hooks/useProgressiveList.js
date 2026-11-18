import { startTransition, useContext, useEffect, useState } from 'react';
import { NavigationTransitionContext } from '../navigation/NavigationTransitionContext';

/**
 * Render the first visible slice immediately so screen push transitions start
 * without a list-mount stall, then incrementally reveal remaining items.
 */
export default function useProgressiveList(items = [], initialCount = 3, step = 1) {
  const [limit, setLimit] = useState(initialCount);
  const transition = useContext(NavigationTransitionContext);

  useEffect(() => {
    if (limit >= items.length) return;
    let active = true;
    let frame = null;
    // One frame per committed slice. Scheduling from a state updater and again
    // from this effect can leave orphan callbacks and mount several slices at once.
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (!active || transition?.isActive()) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (active && !transition?.isActive()) startTransition(() => {
          setLimit(current => Math.min(items.length, current + step));
        });
      });
    };
    // A stable subscription pauses work without re-rendering every existing
    // card at both ends of every navigation animation.
    const unsubscribe = transition?.subscribe(schedule);
    schedule();

    return () => {
      active = false;
      unsubscribe?.();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [limit, items.length, step, transition]);

  return limit >= items.length ? items : items.slice(0, limit);
}
