import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const reviewLogsService = {
  async listReviewLogs(submissionId, { page = 1, pageSize = 50, signal } = {}) {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.REVIEW_LOGS.LIST, {
        params: {
          submission_id: submissionId,
          page, page_size: pageSize,
          ordering: "-changed_at",
        }, signal,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
  async getReplies(logId, { page = 1, signal } = {}) {
    try {
      const { data } = await apiClient.get(`/review-logs/${logId}/replies/`, {
        params: { page, page_size: 20 }, signal,
      });
      return data;
    } catch (error) { throw unwrapApiError(error); }
  },
  async createReply(logId, payload, { signal } = {}) {
    try {
      const { data } = await apiClient.post(`/review-logs/${logId}/replies/`, payload, { signal });
      return data;
    } catch (error) { throw unwrapApiError(error); }
  },
};
