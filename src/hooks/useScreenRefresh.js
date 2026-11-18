import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useScreenRefresh(queryKeys = [], refreshAction) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(null);
  const onRefresh = useCallback(() => {
    if (pending.current) return pending.current;
    setRefreshing(true);
    const tasks = queryKeys.map(queryKey => Promise.resolve().then(() =>
      queryClient.invalidateQueries({ queryKey, refetchType: 'active' }),
    ));
    if (refreshAction) tasks.push(Promise.resolve().then(refreshAction));
    pending.current = Promise.allSettled(tasks).finally(() => {
      setRefreshing(false);
      pending.current = null;
    });
    return pending.current;
  }, [queryClient, queryKeys, refreshAction]);
  return { refreshing, onRefresh };
}
