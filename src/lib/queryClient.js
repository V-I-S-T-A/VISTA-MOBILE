import { QueryClient } from "@tanstack/react-query";
import { isConnectionError } from './connectivityState.cjs';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A missing cache must become an explicit offline error, not an indefinitely
      // paused loading/empty screen. Existing successful data remains in cache.
      networkMode: 'always',
      retry: (failures, error) => !isConnectionError(error) && failures < 1,
      staleTime: 60 * 1000,
      refetchOnReconnect: true,
    },
    // Never queue a user write to execute unexpectedly after reconnecting.
    mutations: { networkMode: 'always', retry: false },
  },
});
