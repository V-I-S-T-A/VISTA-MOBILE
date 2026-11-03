import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants from 'expo-constants';
import { apiClient } from '../lib/apiClient';
import { API_CONFIG } from '../config/api';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { tokenStore } from '../lib/tokenStore';
import { createPushRegistrationController } from './pushRegistrationController.cjs';
import { revokePushDevice } from './revokePushDevice.cjs';

const STORE_KEY = 'vista.push-registration.v1';
const LEGACY_KEY = 'vista-push-token';
let nativeToken;
export function notificationModule() {
  if (Platform.OS !== 'android' || !requireOptionalNativeModule('ExpoPushTokenManager')) return null;
  return require('expo-notifications');
}
const native = () => {
  const module = notificationModule();
  if (!module) throw new Error('native-push-build-required');
  return module;
};
function bounded(operation, ms = 20000) {
  let timer;
  return Promise.race([operation, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('push-registration-timeout')), ms);
  })]).finally(() => clearTimeout(timer));
}
export function createAndroidPushClient({ client = apiClient, baseURL = API_CONFIG.BASE_URL, storageKey = STORE_KEY, legacyKey = LEGACY_KEY } = {}) {
  let lastError;
  async function revoke(record) {
    await revokePushDevice(record, { client, revokeReceipt: key =>
      axios.post(baseURL + '/notifications/devices/revoke/', { revoke_key: key }, { timeout: 15000 }) });
  }
  return createPushRegistrationController({
    load: async () => {
      const stored = await SecureStore.getItemAsync(storageKey);
      if (stored) return JSON.parse(stored);
      const legacy = legacyKey ? await SecureStore.getItemAsync(legacyKey) : null;
      return legacy ? { token: legacy, userId: null } : null;
    },
    save: async record => {
      if (record) await SecureStore.setItemAsync(storageKey, JSON.stringify(record));
      else await SecureStore.deleteItemAsync(storageKey);
      if (legacyKey) await SecureStore.deleteItemAsync(legacyKey);
    },
    permission: async () => {
      const notifications = native();
      await notifications.setNotificationChannelAsync('vista-updates', {
        name: 'VISTA updates', importance: notifications.AndroidImportance.HIGH,
        lightColor: '#FDC849', sound: 'default',
      });
      const permission = await notifications.getPermissionsAsync();
      const channel = await notifications.getNotificationChannelAsync('vista-updates');
      // A disabled channel is an explicit user preference, not a prompt to repeat.
      if (channel?.importance === notifications.AndroidImportance.NONE) return { ...permission, granted: false, canAskAgain: false };
      return permission;
    },
    askPermission: () => native().requestPermissionsAsync(),
    token: async () => {
      const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) throw new Error('missing-eas-project-id');
      const result = await bounded(native().getExpoPushTokenAsync({
        projectId, ...(nativeToken ? { devicePushToken: nativeToken } : {}),
      }));
      return result.data;
    },
    register: async (token, previousToken) => {
      const { data } = await client.post('/notifications/devices/',
        { token, ...(previousToken ? { previous_token: previousToken } : {}) });
      lastError = null;
      return data;
    },
    revoke,
    isActive: () => AppState.currentState == null || AppState.currentState === 'active',
    setTimer: (callback, delay) => setTimeout(callback, delay),
    clearTimer: timer => clearTimeout(timer),
    onError: error => {
      const code = error.response?.status || error.code || 'pending';
      if (__DEV__ && lastError !== code) console.warn('Android push registration pending:', code);
      lastError = code;
    },
  });
}
const controller = createAndroidPushClient();

export function startPushSession(userId) {
  if (Platform.OS !== 'android') return () => {};
  controller.start(userId);
  const foreground = AppState.addEventListener('change', state => {
    if (state === 'active') controller.request();
  });
  const tokens = tokenStore.subscribe(() => {
    if (tokenStore.getAccessToken()) controller.request();
  });
  const notifications = notificationModule();
  const changed = notifications?.addPushTokenListener(token => {
    nativeToken = token;
    controller.request();
  });
  return () => { foreground.remove(); tokens(); changed?.remove(); controller.stop(); };
}
export async function unregisterPush() {
  if (Platform.OS === 'android') await controller.logout();
}
export function resumePushSession(userId) {
  if (Platform.OS === 'android') return controller.start(userId);
}
