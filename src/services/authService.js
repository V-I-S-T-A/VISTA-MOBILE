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
};
