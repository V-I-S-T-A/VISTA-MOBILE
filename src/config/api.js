export const API_CONFIG = {
  BASE_URL: (
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api"
  ).replace(/\/$/, ""),
  ENDPOINTS: {
    AUTH: "/auth",
  },
  DEFAULT_TIMEOUT_MS: 30000,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_CONFIG.ENDPOINTS.AUTH}/login/`,
    LOGOUT: `${API_CONFIG.ENDPOINTS.AUTH}/logout/`,
    ME: `${API_CONFIG.ENDPOINTS.AUTH}/me/`,
    REFRESH: `${API_CONFIG.ENDPOINTS.AUTH}/token/refresh/`,
  },
  SUBMISSIONS: {
    LIST: "/submissions/",
    AUTOFILL: "/submissions/autofill/",
  },
  ACADEMIC_YEARS: {
    LIST: "/academic-years/",
  },
  ORGANIZATIONS: {
    LIST: "/organizations/",
  },
  USERS: {
    LIST: "/users/",
  },
  CATEGORIES: {
    LIST: "/categories/",
  },
  DOCUMENT_TYPES: {
    LIST: "/document-types/",
  },
};
