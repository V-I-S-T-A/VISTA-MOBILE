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

  async uploadSubmissionDocument(submissionId, file) {
    const uploadData = new FormData();
    uploadData.append("file", { uri: file.uri, name: file.name, type: file.type || "application/octet-stream" });
    uploadData.append("upload_preset", "vista_uploads");
    let cloudinary;
    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/djtdar2ex/auto/upload", { method: "POST", body: uploadData });
      cloudinary = await response.json();
      if (!response.ok || !cloudinary.secure_url) throw new Error(cloudinary.error?.message || "Cloudinary did not return a file URL.");
    } catch (error) {
      throw new Error(`Submission created, but the attachment upload failed: ${error.message || "check your connection and retry."}`);
    }
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.DOCUMENTS.LIST, {
        submission_id: submissionId,
        file_name: file.name || "document",
        file_url: cloudinary.secure_url,
        cloudinary_public_id: cloudinary.public_id,
        cloudinary_resource_type: cloudinary.resource_type,
        mime_type: file.type || "application/octet-stream",
        file_size_kb: Math.max(1, Math.round((file.size || 0) / 1024)),
      });
      return data;
    } catch (error) {
      throw new Error(`Submission created and file uploaded, but registering the attachment failed: ${unwrapApiError(error).message || "retry from the review screen."}`);
    }
  },

  async listSubmissions(params = {}) {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.SUBMISSIONS.LIST, {
        params: { page_size: 20, ordering: "-submitted_at", ...params },
      });
      return data; // paginated shape: { count, results, next, previous, ... }
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async getSubmission(submissionId) {
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.SUBMISSIONS.DETAIL(submissionId),
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  // Stage the asset only. The status endpoint associates it transactionally and
  // records add/replace in review history, unlike the creation document endpoint.
  async prepareStatusAttachment(file) {
    const body = new FormData();
    body.append('file', { uri: file.uri, name: file.name, type: file.type || 'application/octet-stream' });
    body.append('upload_preset', 'vista_uploads');
    const response = await fetch('https://api.cloudinary.com/v1_1/djtdar2ex/auto/upload', { method: 'POST', body });
    const result = await response.json();
    if (!response.ok || !result.secure_url || !result.public_id || !result.resource_type) {
      throw new Error(result.error?.message || 'The attachment upload could not be confirmed.');
    }
    return { file_name: file.name, file_url: result.secure_url, cloudinary_public_id: result.public_id,
      cloudinary_resource_type: result.resource_type, mime_type: file.type || 'application/octet-stream',
      file_size_kb: Math.max(1, Math.round((result.bytes ?? file.size ?? 0) / 1024)) };
  },

  async updateSubmissionStatus(submissionId, { status, remarksText, priorityEscalation, attachmentAction, attachment }) {
    try {
      const { data } = await apiClient.patch(
        API_ENDPOINTS.SUBMISSIONS.STATUS(submissionId),
        { ...(status ? { status } : {}), remarks_text: remarksText, ...(priorityEscalation !== undefined ? { priority_escalation: priorityEscalation } : {}),
          ...(attachment ? { attachment_action: attachmentAction, attachment } : {}) },
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },
};
