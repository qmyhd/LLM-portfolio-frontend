/**
 * Orders data fetching hook.
 *
 * Fetches orders from the BFF proxy route with optional filters.
 * Dedupes requests within 10 seconds and retries up to 3 times.
 */

import useSWR from 'swr';
import { useBucket } from '@/contexts/BucketContext';
import type { OrdersResponse } from '@/types/api';

interface UseOrdersOptions {
  /** Max number of orders to fetch. Default: 50 */
  limit?: number;
  /** Filter by status (e.g. 'filled', 'pending', 'cancelled'). Omit or 'all' for no filter. */
  status?: string;
  /** Filter by ticker symbol */
  ticker?: string;
  /** Include DRIP (dividend reinvestment) orders */
  includeDrip?: boolean;
}

const fetcher = async (url: string): Promise<OrdersResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Failed to fetch orders (${res.status})`);
  }
  return res.json();
};

/**
 * Hook to fetch orders with optional filtering.
 *
 * @example
 * ```tsx
 * // Recent 5 orders (dashboard widget)
 * const { data } = useOrders({ limit: 5 });
 *
 * // Filtered orders page
 * const { data, isLoading } = useOrders({ status: 'filled' });
 * ```
 */
export function useOrders(options: UseOrdersOptions = {}) {
  const { limit = 50, status, ticker, includeDrip } = options;
  const bucket = useBucket();

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (status && status !== 'all') params.set('status', status);
  if (ticker) params.set('ticker', ticker);
  if (includeDrip) params.set('include_drip', '1');
  if (bucket) params.set('bucket', bucket);

  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    `/api/orders?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000, errorRetryCount: 3 },
  );

  return {
    /** Orders response (orders array, total, hasMore) */
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
