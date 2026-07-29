import { useQuery } from "@tanstack/react-query";
import { usersService } from "../services/usersService";

export function useOrganizationUsers(orgId) {
  return useQuery({
    queryKey: ["users", "by-organization", orgId],
    queryFn: () => usersService.getUsersByOrganization(orgId),
    enabled: !!orgId,
  });
}
