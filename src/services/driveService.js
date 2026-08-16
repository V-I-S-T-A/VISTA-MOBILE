import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

export const driveService = {
  async getConnection() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.DRIVE.CONNECTION);
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async startAuth(mode = "existing") {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.DRIVE.AUTH_START, {
        params: { mode, client_type: "mobile" },
      });
      return data; 
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async listFolders(search = "") {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.DRIVE.FOLDERS, {
        params: search ? { search } : {},
      });
      return data?.folders ?? [];
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async selectFolder({ folderId, folderName }) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.DRIVE.FOLDER_SELECT, {
        folder_id: folderId,
        folder_name: folderName,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async createFolder(folderName) {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.DRIVE.FOLDER_CREATE, {
        folder_name: folderName,
      });
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async disconnect() {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.DRIVE.DISCONNECT);
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async previewFolderPath(submissionId) {
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.DRIVE.FOLDER_PATH_PREVIEW,
        {
          params: { submission_id: submissionId },
        },
      );
      return data;
    } catch (error) {
      throw unwrapApiError(error);
    }
  },

  async uploadDocument({
    submissionId,
    file,
    fileName,
    folderId,
    useAutoFolder = true,
  }) {
    const formData = new FormData();
    formData.append("submission_id", submissionId);
    formData.append("use_auto_folder", useAutoFolder ? "true" : "false");
    if (fileName) formData.append("file_name", fileName);
    if (folderId) formData.append("folder_id", folderId);
    formData.append("file", {
      uri: file.uri,
      name: file.name || `archive_${Date.now()}`,
      type: file.type || "application/octet-stream",
    });

    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.DRIVE.UPLOAD,
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
};
