/**
 * SWR hook for portfolio top movers (gainers/losers).
 *
 * Polls when live updates are enabled since movers are market-data driven.
 */

import useSWR from 'swr';
import { useLiveUpdates } from './useLiveUpdates';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import type { MoversResponse } from '@/types/ideas';

const fetcher = async (url: string): Promise<MoversResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody?.error || errorBody?.detail || '';
    throw new Error(
      detail
        ? `Movers error: ${detail}`
        : `Failed to fetch movers (${response.status})`
    );
  }
  return response.json();
};

interface UseMoversOptions {
  limit?: number;
  refreshInterval?: number;
  disablePolling?: boolean;
}

/**
 * Hook to fetch top gainers and losers from portfolio positions.
 *
 * @param options - Limit, polling interval, and disable toggle
 */
export function useMovers(options: UseMoversOptions = {}) {
  const { limit = 10, refreshInterval = 60000, disablePolling = false } = options;
  const { isEnabled } = useLiveUpdates();
  const bucket = useBucket();
  const shouldPoll = isEnabled && !disablePolling;

  const url = withBucket(`/api/portfolio/movers?limit=${limit}`, bucket);

  const { data, error, isLoading, isValidating, mutate } = useSWR<MoversResponse>(
    url,
    fetcher,
    {
      refreshInterval: shouldPoll ? refreshInterval : 0,
      revalidateOnFocus: shouldPoll,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    isPolling: shouldPoll,
    refresh: () => mutate(),
  };
}
