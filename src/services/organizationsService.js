import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const organizationsService = {
  async listOrganizations(search = "") {
    try {
      const organizations = [];
      let page = 1;
      while (true) {
        const { data } = await apiClient.get(API_ENDPOINTS.ORGANIZATIONS.LIST, {
          params: { is_active: true, search, page_size: 50, page },
        });
        organizations.push(...(data?.results ?? data ?? []));
        if (!data?.next) return organizations;
        page++;
      }
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
