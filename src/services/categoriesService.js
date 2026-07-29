import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const categoriesService = {
  async listCategories() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST, {
        params: { page_size: 100 },
      });
      return data?.results ?? data ?? [];
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
