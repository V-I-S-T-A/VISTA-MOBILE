import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { driveService } from "../services/driveService";

export function useDriveConnection() {
  return useQuery({
    queryKey: ["drive", "connection"],
    queryFn: driveService.getConnection,
    staleTime: 60 * 1000,
  });
}

export function useDriveAuthStart() {
  return useMutation({
    mutationFn: (mode) => driveService.startAuth(mode),
  });
}

export function useDriveFolders(search = "") {
  return useQuery({
    queryKey: ["drive", "folders", search],
    queryFn: () => driveService.listFolders(search),
  });
}

export function useSelectDriveFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => driveService.selectFolder(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["drive", "connection"] }),
  });
}

export function useCreateDriveFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderName) => driveService.createFolder(folderName),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["drive", "connection"] }),
  });
}

export function useDisconnectDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => driveService.disconnect(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["drive", "connection"] }),
  });
}

export function useDriveFolderPreview(submissionId) {
  return useQuery({
    queryKey: ["drive", "folder-path-preview", submissionId],
    queryFn: () => driveService.previewFolderPath(submissionId),
    enabled: !!submissionId,
  });
}

// Kicks off the archive-to-Drive job on the server and resolves as soon
// as it's queued -- it does NOT wait for the actual upload. Pair with
// useDriveUploadStatus to find out how it went.
export function useDriveUpload() {
  return useMutation({
    mutationFn: (payload) => driveService.uploadDocument(payload),
  });
}

// Polls a background upload task until it finishes. Safe to mount with
// taskId = null/undefined -- it just stays disabled.
export function useDriveUploadStatus(taskId) {
  return useQuery({
    queryKey: ["drive", "upload-status", taskId],
    queryFn: () => driveService.getUploadStatus(taskId),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status;
      return currentStatus === "pending" || currentStatus === undefined
        ? 1500
        : false;
    },
  });
}
