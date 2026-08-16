import { useQuery } from "@tanstack/react-query";
import { organizationsService } from "../services/organizationsService";
import { usersService } from "../services/usersService";

export function useOrganizations(search = "") {
  return useQuery({
    queryKey: ["organizations", search],
    queryFn: () => organizationsService.listOrganizations(search),
  });
}

export function useOrganizationUsers(orgId) {
  return useQuery({
    queryKey: ["users", "by-organization", orgId],
    queryFn: () => usersService.getUsersByOrganization(orgId),
    enabled: !!orgId,
  });
}
