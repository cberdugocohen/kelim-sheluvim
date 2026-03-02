import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Generic React Query hook for entity list/filter operations.
 * Replaces manual useState + useEffect + apiCallWithRetry patterns.
 *
 * @param {string} key - Unique query key (e.g. 'services', 'students')
 * @param {Function} queryFn - Async function that returns data
 * @param {object} options - Additional React Query options
 */
export function useEntityQuery(key, queryFn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    ...options,
  });
}

/**
 * Generic React Query hook for entity mutations (create/update/delete).
 * Automatically invalidates related queries on success.
 *
 * @param {Function} mutationFn - Async function that performs the mutation
 * @param {object} options - { invalidateKeys: string[], onSuccess, onError }
 */
export function useEntityMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  const { invalidateKeys = [], ...rest } = options;

  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
      rest.onSuccess?.(...args);
    },
    ...rest,
  });
}
