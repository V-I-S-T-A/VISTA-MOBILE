import { API_CONFIG, API_ENDPOINTS } from "../config/api";

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      Object.values(data || {})?.flat?.()?.[0] ||
      "Request failed.";
    throw new Error(message);
  }

  return data;
}

async function apiRequest(path, { method = "GET", body, accessToken } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
}

export const authService = {
  login({ email, password }) {
    return apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: { email, password },
    });
  },

  me(accessToken) {
    return apiRequest(API_ENDPOINTS.AUTH.ME, { accessToken });
  },

  logout({ refresh, accessToken }) {
    return apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      accessToken,
      body: { refresh },
    });
  },
};