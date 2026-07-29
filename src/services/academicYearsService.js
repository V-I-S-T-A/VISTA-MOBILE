import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const academicYearsService = {
  async getActiveAcademicYear() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.ACADEMIC_YEARS.LIST, {
        params: { is_active: true, ordering: "-year", page_size: 1 },
      });
      const results = data?.results ?? data ?? [];
      return results[0] ?? null;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
