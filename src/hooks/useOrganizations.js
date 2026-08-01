import { useQuery } from "@tanstack/react-query";
import { organizationsService } from "../services/organizationsService";

export function useOrganizations(search = "") {
  return useQuery({
    queryKey: ["organizations", search],
    queryFn: () => organizationsService.listOrganizations(search),
  });
}
