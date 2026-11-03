import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submissionsService } from "../services/submissionsService";
import { useAuth } from "../context/AuthContext";

export function useSubmissions(params = {}) {
  const auth = useAuth() || {};
  const userId = auth.user?.user_id || 'guest';
  return useQuery({
    queryKey: ["submissions", "list", userId, params],
    queryFn: () => submissionsService.listSubmissions(params),
  });
}

export function useSubmission(submissionId) {
  const auth = useAuth() || {};
  const userId = auth.user?.user_id || 'guest';
  return useQuery({
    queryKey: ["submissions", submissionId, userId],
    queryFn: () => submissionsService.getSubmission(submissionId),
    enabled: !!submissionId,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => submissionsService.createSubmission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useAutofillDocument() {
  return useMutation({
    mutationFn: (file) => submissionsService.autofillFromScan(file),
  });
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, ...payload }) =>
      submissionsService.updateSubmissionStatus(submissionId, {
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["submissions", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["review-logs", variables.submissionId],
      });
    },
  });
}
