/**
 * Trading ideas fetching hook with polling support.
 * 
 * Uses SWR for data fetching with automatic revalidation.
 * Polling can be toggled on/off using the global liveUpdates store.
 */

import useSWR from 'swr';
import { useLiveUpdates } from './useLiveUpdates';
import type { StockIdea } from '@/types/api';

export interface IdeasData {
  ideas: StockIdea[];
  total: number;
}

interface UseIdeasOptions {
  /** Filter by direction (bullish, bearish, neutral) */
  direction?: 'bullish' | 'bearish' | 'neutral';
  /** Maximum number of ideas to fetch */
  limit?: number;
  /** Override global polling interval (ms). Default: 60000 (60s) */
  refreshInterval?: number;
  /** Disable polling regardless of global setting */
  disablePolling?: boolean;
}

const fetcher = async (url: string): Promise<IdeasData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ideas: ${response.status}`);
  }
  return response.json();
};

/**
 * Hook to fetch and poll trading ideas for a specific ticker.
 * 
 * @param ticker - Stock ticker symbol (e.g., 'AAPL')
 * @param options - Filtering and polling options
 * 
 * @example
 * ```tsx
 * const { data, error, isLoading, refresh } = useIdeas('AAPL', {
 *   direction: 'bullish',
 *   limit: 10,
 * });
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * 
 * return <IdeasList ideas={data.ideas} />;
 * ```
 */
export function useIdeas(ticker: string | null, options: UseIdeasOptions = {}) {
  const {
    direction,
    limit = 50,
    refreshInterval = 60000,
    disablePolling = false,
  } = options;
  const { isEnabled } = useLiveUpdates();
  
  // Only poll if live updates are enabled and not explicitly disabled
  const shouldPoll = isEnabled && !disablePolling;
  
  // Build URL with query params
  const buildUrl = () => {
    if (!ticker) return null;
    const params = new URLSearchParams();
    if (direction) params.set('direction', direction);
    if (limit) params.set('limit', String(limit));
    const queryString = params.toString();
    return `/api/stocks/${ticker.toUpperCase()}/ideas${queryString ? `?${queryString}` : ''}`;
  };
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<IdeasData>(
    buildUrl(),
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
    /** Ideas data */
    data,
    /** Error if fetch failed */
    error,
    /** True on initial load */
    isLoading,
    /** True when revalidating in background */
    isValidating,
    /** True if polling is active */
    isPolling: shouldPoll,
    /** Manually refresh the data */
    refresh: () => mutate(),
  };
}
