import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@/entities/User';
import { queryClientInstance } from '@/lib/query-client';

const USER_QUERY_KEY = ['currentUser'];

/**
 * Shared hook to get the current authenticated user.
 * Powered by React Query for automatic caching, deduplication, and refetch.
 * API surface: { currentUser, isLoading, error, refresh, logout }
 */
export function useCurrentUser() {
  const queryClient = useQueryClient();

  const { data: currentUser = null, isLoading, error } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const user = await User.me();
      return user ?? null;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
    meta: { errorMessage: 'useCurrentUser: failed to fetch user' },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await User.logout();
      queryClient.setQueryData(USER_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
    } catch (err) {
      console.error('useCurrentUser: logout failed', err);
    }
  }, [queryClient]);

  return { currentUser, isLoading, error, refresh, logout };
}

/**
 * Clear the cached user synchronously (e.g. immediately before page reload on logout).
 * For use outside of React components.
 */
export function clearUserCache() {
  queryClientInstance.setQueryData(USER_QUERY_KEY, null);
  queryClientInstance.removeQueries({ queryKey: USER_QUERY_KEY });
}
