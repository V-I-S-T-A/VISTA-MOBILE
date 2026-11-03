import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "vista.accessToken";
const REFRESH_TOKEN_KEY = "vista.refreshToken";

let accessToken = null;
let refreshToken = null;
const listeners = new Set();
const notify = () => listeners.forEach(listener => { try { listener(); } catch {} });
let writeQueue = Promise.resolve();
const serialized = operation => {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
};

async function readToken(key) {
  if (Platform.OS === "web") {
    return typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function writeToken(key, token) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      if (token) localStorage.setItem(key, token);
      else localStorage.removeItem(key);
    }
    return;
  }

  if (token) await SecureStore.setItemAsync(key, token);
  else await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  getTokens: () => ({ access: accessToken, refresh: refreshToken }),
  async loadTokens() {
    const [storedAccessToken, storedRefreshToken] = await Promise.all([
      readToken(ACCESS_TOKEN_KEY),
      readToken(REFRESH_TOKEN_KEY),
    ]);
    accessToken = storedAccessToken;
    refreshToken = storedRefreshToken;
    return this.getTokens();
  },
  setTokens(tokens, { expectedRefreshToken } = {}) {
    return serialized(async () => {
      if (expectedRefreshToken !== undefined && refreshToken !== expectedRefreshToken) throw new Error('Authentication session changed.');
      const nextAccessToken = tokens?.access ?? null;
      const nextRefreshToken = tokens?.refresh ?? refreshToken;

      await Promise.all([
        writeToken(ACCESS_TOKEN_KEY, nextAccessToken),
        writeToken(REFRESH_TOKEN_KEY, nextRefreshToken),
      ]);
      accessToken = nextAccessToken;
      refreshToken = nextRefreshToken;
      notify();
    });
  },
  async setAccessToken(token) {
    await this.setTokens({ access: token });
  },
  clear() {
    return serialized(async () => {
      accessToken = null;
      refreshToken = null;
      await Promise.all([
        writeToken(ACCESS_TOKEN_KEY, null),
        writeToken(REFRESH_TOKEN_KEY, null),
      ]);
      notify();
    });
  },
};
