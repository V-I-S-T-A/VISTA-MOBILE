import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const notificationService = {
  async getNotifications() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async markAsRead(notificationId) {
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.NOTIFICATIONS.READ(notificationId),
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
