import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const submissionsService = {
  /**
   * Sends a scanned document to the OCR autofill endpoint.
   * Mirrors the backend guarantee exactly: this NEVER creates a
   * Submission, it only returns suggested field values for the caller
   * to pre-fill the create form with. `file` is { uri, name, type }.
   */
  async autofillFromScan(file) {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name || `upload_${Date.now()}`,
      type: file.type,
    });

    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.SUBMISSIONS.AUTOFILL,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  /**
   * The single path that actually creates a Submission. Must only ever
   * be called after explicit staff confirmation of the reviewed form --
   * never automatically after autofillFromScan().
   */
  async createSubmission(payload) {
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.SUBMISSIONS.LIST,
        payload,
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
