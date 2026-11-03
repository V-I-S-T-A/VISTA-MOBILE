import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const usersService = {
  // The branch permits staff/admin to search the directory, but restricts user
  // detail GETs to self/admin. Match the exact submission owner; never substitute
  // a similarly named account. Call only for an authenticated staff viewer.
  async getSubmissionSubmitter(submission) {
    if (submission?.submitted_by == null || !submission?.submitted_by_email) return null;
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.USERS.LIST, {
        params: { search: submission.submitted_by_email, page_size: 20 },
      });
      return (data?.results || []).find(user => String(user.user_id) === String(submission.submitted_by)) || null;
    } catch (error) { throw unwrapApiError(error); }
  },
  /**
   * Resolves candidate "Submitted By" users for the organization the OCR
   * pipeline detected. NOTE: GET /api/users/ is restricted to IsAdmin in
   * UserViewSet.get_permissions -- this call only succeeds when the
   * signed-in account is admin, or once that permission is broadened for
   * staff. Left as-is since that's a backend permission decision, not a
   * frontend integration concern.
   */
  async getUsersByOrganization(orgId) {
    if (!orgId) return [];
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.USERS.LIST, {
        params: { org_id: orgId, is_active: true, page_size: 50 },
      });
      return data?.results ?? data ?? [];
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
