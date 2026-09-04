import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const reviewLogsService = {
  async listReviewLogs(submissionId) {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.REVIEW_LOGS.LIST, {
        params: {
          submission_id: submissionId,
          page_size: 50,
          ordering: "-changed_at",
        },
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
