import axios from "axios";
import { API_CONFIG, API_ENDPOINTS } from "../config/api";
import { tokenStore } from "./tokenStore";

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.DEFAULT_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (
      !response ||
      response.status !== 401 ||
      config?._retry ||
      !tokenStore.getRefreshToken()
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newAccessToken) => {
        config._retry = true;
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(config);
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        { refresh: tokenStore.getRefreshToken() },
      );
      tokenStore.setAccessToken(data.access);
      resolveQueue(null, data.access);
      config.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(config);
    } catch (refreshError) {
      resolveQueue(refreshError, null);
      tokenStore.clear();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function unwrapApiError(error) {
  const data = error?.response?.data;
  const message =
    data?.detail ||
    data?.non_field_errors?.[0] ||
    (data && Object.values(data).flat?.()[0]) ||
    error.message ||
    "Request failed.";
  return new Error(message);
}
