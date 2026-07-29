import { useMutation } from "@tanstack/react-query";
import { submissionsService } from "../services/submissionsService";

export function useAutofillDocument() {
  return useMutation({
    mutationFn: (file) => submissionsService.autofillFromScan(file),
  });
}
