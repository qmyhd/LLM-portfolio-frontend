/**
 * SWR hook for the unified ideas store (all sources).
 *
 * Named useUserIdeas to avoid collision with the existing useIdeas hook
 * which fetches per-ticker Discord parsed ideas.
 */

import useSWR from 'swr';
import type { UserIdeasResponse, IdeasFilters } from '@/types/ideas';

const fetcher = async (url: string): Promise<UserIdeasResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ideas: ${response.status}`);
  }
  return response.json();
};

interface UseUserIdeasOptions {
  /** Override deduping interval (ms). Default: 10000 */
  dedupingInterval?: number;
}

/**
 * Hook to fetch and manage unified ideas from all sources.
 *
 * @param filters - Filtering and pagination options
 * @param options - SWR configuration overrides
 */
export function useUserIdeas(filters: IdeasFilters = {}, options: UseUserIdeasOptions = {}) {
  const { dedupingInterval = 10000 } = options;

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (filters.symbol) params.set('symbol', filters.symbol);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.source) params.set('source', filters.source);
    if (filters.status) params.set('status', filters.status);
    if (filters.q) params.set('q', filters.q);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset !== undefined) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return `/api/ideas${qs ? `?${qs}` : ''}`;
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<UserIdeasResponse>(
    buildUrl(),
    fetcher,
    {
      refreshInterval: 0, // Ideas are not real-time
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh: () => mutate(),
  };
}
