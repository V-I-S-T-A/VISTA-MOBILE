let accessToken = null;
let refreshToken = null;

export const tokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (tokens) => {
    accessToken = tokens?.access ?? null;
    refreshToken = tokens?.refresh ?? refreshToken;
  },
  setAccessToken: (token) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
    refreshToken = null;
  },
};
