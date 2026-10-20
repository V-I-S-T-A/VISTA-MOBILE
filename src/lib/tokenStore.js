import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "vista.accessToken";
const REFRESH_TOKEN_KEY = "vista.refreshToken";

let accessToken = null;
let refreshToken = null;

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
  async setTokens(tokens) {
    const nextAccessToken = tokens?.access ?? null;
    const nextRefreshToken = tokens?.refresh ?? refreshToken;

    await Promise.all([
      writeToken(ACCESS_TOKEN_KEY, nextAccessToken),
      writeToken(REFRESH_TOKEN_KEY, nextRefreshToken),
    ]);
    accessToken = nextAccessToken;
    refreshToken = nextRefreshToken;
  },
  async setAccessToken(token) {
    await this.setTokens({ access: token });
  },
  async clear() {
    accessToken = null;
    refreshToken = null;
    await Promise.all([
      writeToken(ACCESS_TOKEN_KEY, null),
      writeToken(REFRESH_TOKEN_KEY, null),
    ]);
  },
};
