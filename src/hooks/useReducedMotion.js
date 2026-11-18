import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// New controls reuse the preference already read by the mounted navigator.
// The conservative startup value avoids a motion flash before the first read.
let currentPreference = true;
let preferenceRevision = 0;

// Start without motion while the native preference resolves; also respect changes
// made in system settings while VISTA remains open.
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(() => currentPreference);
  useEffect(() => {
    let active = true;
    const readRevision = preferenceRevision;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      if (!active) return;
      preferenceRevision++;
      currentPreference = value;
      setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && readRevision === preferenceRevision) {
        currentPreference = value;
        setReduced(value);
      }
    }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
