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
    DETAIL: (id) => `/submissions/${id}/`,
    STATUS: (id) => `/submissions/${id}/status/`,
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
  DRIVE: {
    CONNECTION: "/drive/connection/",
    AUTH_START: "/drive/auth/start/",
    FOLDERS: "/drive/folders/",
    FOLDER_SELECT: "/drive/folders/select/",
    FOLDER_CREATE: "/drive/folders/create/",
    DISCONNECT: "/drive/disconnect/",
    FOLDER_PATH_PREVIEW: "/drive/folder-path-preview/",
    UPLOAD: "/drive/upload/",
  },
};
