import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const documentTypesService = {
  async listDocumentTypes() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.DOCUMENT_TYPES.LIST, {
        params: { is_active: true, page_size: 100 },
      });
      return data?.results ?? data ?? [];
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
