import { useQuery } from "@tanstack/react-query";
import { documentTypesService } from "../services/documentTypesService";

export function useDocumentTypes() {
  return useQuery({
    queryKey: ["document-types"],
    queryFn: documentTypesService.listDocumentTypes,
  });
}
