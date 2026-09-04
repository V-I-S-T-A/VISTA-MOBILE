import { useQuery } from "@tanstack/react-query";
import { reviewLogsService } from "../services/reviewLogsService";

export function useReviewLogs(submissionId) {
  return useQuery({
    queryKey: ["review-logs", submissionId],
    queryFn: () => reviewLogsService.listReviewLogs(submissionId),
    enabled: Boolean(submissionId),
  });
}
