import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useScreenRefresh(queryKeys) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey, refetchType: "active" }),
        ),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, queryKeys]);
  return { refreshing, onRefresh };
}
