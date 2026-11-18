import axios from 'axios';
import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { onlineManager } from '@tanstack/react-query';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { connectivity } from './connectivityState.cjs';

let recheck = async () => connectivity.isOnline();
export const checkConnection = () => recheck();

export function startNetworkRuntime() {
  let active = true, revision = 0, timer = null, pending = null;
  // Older installed development clients can load the JS changes safely. New
  // standalone builds autolink ExpoNetwork and receive immediate device events.
  const network = Platform.OS === 'web' || requireOptionalNativeModule('ExpoNetwork')
    ? require('expo-network') : null;
  const apply = value => { if (active) { connectivity.setOnline(value); onlineManager.setOnline(value); } };
  const applyNative = state => {
    if (state.isConnected === false || state.isInternetReachable === false) apply(false);
    else if (state.isConnected === true || state.isInternetReachable === true) apply(true);
  };
  const schedule = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (active && !connectivity.isOnline() && AppState.currentState !== 'background') {
      timer = setTimeout(() => { timer = null; check(); }, 10000);
    }
  };
  const check = () => {
    if (pending) return pending;
    const requestedAt = revision;
    pending = (async () => {
      try {
        const state = network ? await network.getNetworkStateAsync() : null;
        if (!active || requestedAt !== revision) return connectivity.isOnline();
        if (state?.isConnected === false || state?.isInternetReachable === false) {
          apply(false);
          return false;
        }
        // Reach only VISTA's existing public version endpoint, with no tokens.
        // Any HTTP response proves connectivity; 401/403/5xx are not offline.
        await axios.get(API_CONFIG.BASE_URL + API_ENDPOINTS.APP.LATEST, {
          timeout: 5000, validateStatus: () => true, headers: { 'Cache-Control': 'no-cache' },
        });
        if (requestedAt === revision) apply(true);
      } catch {
        if (requestedAt === revision) apply(false);
      } finally { pending = null; schedule(); }
      return connectivity.isOnline();
    })();
    return pending;
  };
  const subscription = network?.addNetworkStateListener(state => {
    revision++;
    applyNative(state);
    schedule();
  });
  const unsubscribe = connectivity.subscribe(online => { onlineManager.setOnline(online); schedule(); });
  const foreground = AppState.addEventListener('change', state => {
    if (state === 'active') check();
    else if (timer !== null) { clearTimeout(timer); timer = null; }
  });
  recheck = check;
  check();
  return () => {
    active = false;
    if (timer !== null) clearTimeout(timer);
    subscription?.remove(); foreground.remove(); unsubscribe();
    recheck = async () => connectivity.isOnline();
  };
}
