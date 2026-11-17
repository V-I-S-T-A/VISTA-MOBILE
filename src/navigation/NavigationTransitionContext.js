import { createContext } from 'react';

// InteractionManager is a stub in RN 0.81; follow the real native timeline.
export const NavigationTransitionContext = createContext(null);

export function createNavigationTransition() {
  let active = false;
  const listeners = new Set();
  return {
    isActive: () => active,
    setActive(value) {
      if (active === value) return;
      active = value;
      listeners.forEach(listener => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
