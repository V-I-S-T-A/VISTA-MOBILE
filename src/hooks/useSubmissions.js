import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submissionsService } from "../services/submissionsService";

export function useSubmissions(params = {}) {
  return useQuery({
    queryKey: ["submissions", "list", params],
    queryFn: () => submissionsService.listSubmissions(params),
  });
}

export function useSubmission(submissionId) {
  return useQuery({
    queryKey: ["submissions", submissionId],
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
    mutationFn: ({ submissionId, status, remarksText }) =>
      submissionsService.updateSubmissionStatus(submissionId, {
        status,
        remarksText,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["submissions", "list"] });
    },
  });
}
