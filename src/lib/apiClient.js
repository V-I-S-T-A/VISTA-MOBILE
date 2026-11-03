import axios from "axios";
import { API_CONFIG, API_ENDPOINTS } from "../config/api";
import { tokenStore } from "./tokenStore";

// Each client owns its refresh queue. Production uses the same instance as before;
// the factory also permits isolated physical-device verification without user tokens.
export function createAuthenticatedApiClient({ baseURL = API_CONFIG.BASE_URL, store = tokenStore, timeout = API_CONFIG.DEFAULT_TIMEOUT_MS } = {}) {
  const client = axios.create({
    baseURL: baseURL,
    timeout: timeout,
  });

  client.interceptors.request.use((config) => {
    const token = store.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Single-flight refresh so parallel 401s don't each trigger their own
  // /auth/token/refresh/ call.
  let isRefreshing = false;
  let pendingQueue = [];

  function resolveQueue(error, token = null) {
    pendingQueue.forEach(({ resolve, reject }) =>
      error ? reject(error) : resolve(token),
    );
    pendingQueue = [];
  }

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;

      if (
        !response ||
        !config ||
        response.status !== 401 ||
        config?._retry ||
        !store.getRefreshToken()
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          config._retry = true;
          config.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(config);
        });
      }

      config._retry = true;
      isRefreshing = true;
      const refreshAtStart = store.getRefreshToken();

      try {
        const { data } = await axios.post(
          `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh: refreshAtStart },
          { timeout: timeout },
        );
        if (store.getRefreshToken() !== refreshAtStart) throw new Error('Authentication session changed.');
        await store.setTokens({
          access: data.access,
          refresh: data.refresh,
        }, { expectedRefreshToken: refreshAtStart });
        resolveQueue(null, data.access);
        config.headers.Authorization = `Bearer ${data.access}`;
        return client(config);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        if (store.getRefreshToken() === refreshAtStart && [400, 401].includes(refreshError.response?.status)) {
          await store.clear();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
  return client;
}
export const apiClient = createAuthenticatedApiClient();

export function unwrapApiError(error) {
  const data = error?.response?.data;
  const message =
    data?.detail ||
    data?.non_field_errors?.[0] ||
    (data && Object.values(data).flat?.()[0]) ||
    error.message ||
    "Request failed.";
  const wrapped = new Error(message);
  wrapped.code = data?.code;
  wrapped.status = error?.response?.status;
  return wrapped;
}
