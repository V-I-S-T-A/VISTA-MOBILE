import { useEffect, useState } from 'react';
import { connectivity } from '../lib/connectivityState.cjs';

export default function useConnectivity() {
  const [online, setOnline] = useState(connectivity.isOnline);
  useEffect(() => {
    const unsubscribe = connectivity.subscribe(setOnline);
    setOnline(connectivity.isOnline());
    return unsubscribe;
  }, []);
  return online;
}
