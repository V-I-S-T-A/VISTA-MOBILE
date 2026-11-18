import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "vista.accessToken";
const REFRESH_TOKEN_KEY = "vista.refreshToken";
const PROFILE_KEY = 'vista.verifiedProfile.v1';

let accessToken = null;
let refreshToken = null;
let cachedUser = null;
const profileFields = ['user_id', 'role', 'email', 'first_name', 'last_name', 'image_url', 'org_image_url', 'is_first_login', 'department', 'org_id', 'org_joined_at'];
const validUser = user => user?.user_id != null && ['student', 'staff', 'admin'].includes(user.role);
const profileRecord = (user, binding) => user && binding ? JSON.stringify({ binding, user }) : null;
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
  getCachedUser: () => cachedUser,
  loadTokens() {
    return serialized(async () => {
      const [storedAccessToken, storedRefreshToken, storedProfile] = await Promise.all([
        readToken(ACCESS_TOKEN_KEY),
        readToken(REFRESH_TOKEN_KEY),
        readToken(PROFILE_KEY),
      ]);
      accessToken = storedAccessToken;
      refreshToken = storedRefreshToken;
      cachedUser = null;
      try {
        const profile = JSON.parse(storedProfile);
        const binding = refreshToken || accessToken;
        if (binding && profile?.binding === binding && validUser(profile.user)) cachedUser = profile.user;
      } catch { /* Missing/invalid cache never authenticates a different account. */ }
      return this.getTokens();
    });
  },
  saveCachedUser(user, { expectedRefreshToken = refreshToken } = {}) {
    return serialized(async () => {
      if (refreshToken !== expectedRefreshToken || !(refreshToken || accessToken)) throw new Error('Authentication session changed.');
      if (!validUser(user)) throw new Error('A verified account is required.');
      const profile = Object.fromEntries(profileFields.filter(key => user[key] !== undefined).map(key => [key, user[key]]));
      await writeToken(PROFILE_KEY, profileRecord(profile, refreshToken || accessToken));
      cachedUser = profile;
    });
  },
  setTokens(tokens, { expectedRefreshToken } = {}) {
    return serialized(async () => {
      if (expectedRefreshToken !== undefined && refreshToken !== expectedRefreshToken) throw new Error('Authentication session changed.');
      const nextAccessToken = tokens?.access ?? null;
      const nextRefreshToken = tokens?.refresh ?? refreshToken;
      // Only a refresh of the current session carries its verified profile
      // forward. A new login cannot inherit the previous account's offline UI.
      const nextUser = expectedRefreshToken !== undefined ? cachedUser : null;

      await Promise.all([
        writeToken(ACCESS_TOKEN_KEY, nextAccessToken),
        writeToken(REFRESH_TOKEN_KEY, nextRefreshToken),
        writeToken(PROFILE_KEY, profileRecord(nextUser, nextRefreshToken || nextAccessToken)),
      ]);
      accessToken = nextAccessToken;
      refreshToken = nextRefreshToken;
      cachedUser = nextUser;
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
      cachedUser = null;
      await Promise.all([
        writeToken(ACCESS_TOKEN_KEY, null),
        writeToken(REFRESH_TOKEN_KEY, null),
        writeToken(PROFILE_KEY, null),
      ]);
      notify();
    });
  },
};
