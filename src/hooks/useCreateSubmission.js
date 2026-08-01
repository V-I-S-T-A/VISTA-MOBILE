import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionsService } from "../services/submissionsService";

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => submissionsService.createSubmission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
