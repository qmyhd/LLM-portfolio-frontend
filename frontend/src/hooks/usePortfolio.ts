/**
 * Portfolio data fetching hook with polling support.
 * 
 * Uses SWR for data fetching with automatic revalidation.
 * Polling can be toggled on/off using the global liveUpdates store.
 */

import useSWR from 'swr';
import { useLiveUpdates } from './useLiveUpdates';
import type { PortfolioSummary, Position } from '@/types/api';

export interface PortfolioData {
  summary: PortfolioSummary;
  positions: Position[];
  lastUpdated: string;
}

interface UsePortfolioOptions {
  /** Override global polling interval (ms). Default: 60000 (60s) */
  refreshInterval?: number;
  /** Disable polling regardless of global setting */
  disablePolling?: boolean;
}

const fetcher = async (url: string): Promise<PortfolioData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio: ${response.status}`);
  }
  return response.json();
};

/**
 * Hook to fetch and poll portfolio data.
 * 
 * @example
 * ```tsx
 * const { data, error, isLoading, refresh } = usePortfolio();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * 
 * return <PortfolioView data={data} />;
 * ```
 */
export function usePortfolio(options: UsePortfolioOptions = {}) {
  const { refreshInterval = 60000, disablePolling = false } = options;
  const { isEnabled } = useLiveUpdates();
  
  // Only poll if live updates are enabled and not explicitly disabled
  const shouldPoll = isEnabled && !disablePolling;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<PortfolioData>(
    '/api/portfolio',
    fetcher,
    {
      refreshInterval: shouldPoll ? refreshInterval : 0,
      revalidateOnFocus: shouldPoll,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );
  
  return {
    /** Portfolio data (summary + positions) */
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
