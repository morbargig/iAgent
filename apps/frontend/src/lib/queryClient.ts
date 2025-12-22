import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,  // true = refetch only if stale (default behavior)
      refetchOnMount: true,      // true = refetch only if stale (default behavior)
    },
    mutations: {
      retry: 0,
    },
  },
});

