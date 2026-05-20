/**
 * Stock profile data fetching hook.
 *
 * Fetches the full StockProfileCurrent from the BFF proxy route.
 * Dedupes requests within 30 seconds and disables focus revalidation
 * since profile data changes infrequently.
 */

import useSWR from 'swr';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import type { StockProfileCurrent } from '@/types/api';

const fetcher = async (url: string): Promise<StockProfileCurrent> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Failed to fetch stock profile (${res.status})`);
  }
  return res.json();
};

/**
 * Hook to fetch a stock's full profile (price metrics, position, sentiment).
 *
 * @param ticker - Uppercase stock ticker, or null to skip fetching
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useStockProfile('AAPL');
 * ```
 */
export function useStockProfile(ticker: string | null) {
  const bucket = useBucket();
  const url = ticker
    ? withBucket(`/api/stocks/${ticker.toUpperCase()}`, bucket)
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<StockProfileCurrent>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  return {
    /** Full stock profile data */
    data,
    /** Error if fetch failed */
    error,
    /** True on initial load */
    isLoading,
    /** True when revalidating in background */
    isValidating,
    /** Manually refresh the data */
    refresh: () => mutate(),
  };
}
