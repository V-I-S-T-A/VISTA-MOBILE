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

  async requestPasswordChangeCode() {
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.AUTH.REQUEST_PASSWORD_CHANGE_CODE,
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async confirmPasswordChange({ oldPassword, newPassword, code }) {
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.AUTH.CONFIRM_PASSWORD_CHANGE,
        {
          old_password: oldPassword,
          new_password: newPassword,
          code,
        },
      );
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
