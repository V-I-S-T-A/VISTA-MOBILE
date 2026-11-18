import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const ONBOARDING_COMPLETED_KEY = 'vista.onboarding.completed.v1';

// Separate from account credentials: signing out does not reset the tour.
// Android SecureStore is already excluded from backup and removed on uninstall.
export default function useOnboarding() {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const finishing = useRef(null);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      let saved = null;
      try {
        saved = Platform.OS === 'web'
          ? globalThis.localStorage?.getItem(ONBOARDING_COMPLETED_KEY)
          : await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
      } catch { /* Unavailable storage starts the tour, never blocks sign-in. */ }
      if (active) {
        if (!finishing.current) setCompleted(saved === 'true');
        setReady(true);
      }
    };
    restore();
    return () => { active = false; };
  }, []);

  const complete = () => {
    // Share the pending write so repeat taps cannot navigate ahead of persistence.
    if (!finishing.current) finishing.current = (async () => {
      try {
        if (Platform.OS === 'web') globalThis.localStorage?.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        else await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
      } catch { /* Continue this session; a later launch retries if saving failed. */ }
      setCompleted(true);
    })();
    return finishing.current;
  };
  return { ready, completed, complete };
}
