import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const authService = {
  async login({ email, password }) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async me() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async updateMe(payload) {
    try {
      const { data } = await apiClient.patch(API_ENDPOINTS.AUTH.ME, payload);
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async logout({ refresh }) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refresh,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async changePassword({ oldPassword, newPassword }) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async requestPasswordReset(email) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, { email });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async confirmPasswordReset({ email, code, newPassword }) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
        email,
        code,
        new_password: newPassword,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
