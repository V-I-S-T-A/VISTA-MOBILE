import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const organizationsService = {
  async listOrganizations(search = "") {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.ORGANIZATIONS.LIST, {
        params: { is_active: true, search, page_size: 50 },
      });
      return data?.results ?? data ?? [];
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
