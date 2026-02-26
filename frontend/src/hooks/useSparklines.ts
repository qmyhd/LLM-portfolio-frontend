/**
 * SWR hook for batch sparkline close-price data.
 *
 * Fetches close prices for all held symbols, used by HoldingsList sparklines.
 */

import useSWR from 'swr';
import type { SparklineResponse } from '@/types/api';

const fetcher = async (url: string): Promise<SparklineResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody?.error || errorBody?.detail || '';
    throw new Error(
      detail
        ? `Sparklines error: ${detail}`
        : `Failed to fetch sparklines (${response.status})`,
    );
  }
  return response.json();
};

export function useSparklines(period: '1W' | '1M' | '3M' = '1M') {
  const url = `/api/sparklines?period=${period}`;

  const { data, error, isLoading } = useSWR<SparklineResponse>(url, fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    errorRetryCount: 2,
    errorRetryInterval: 10000,
  });

  // Build a symbol -> closes lookup map for quick access
  const sparklinesMap: Record<string, number[]> = {};
  for (const item of data?.sparklines ?? []) {
    sparklinesMap[item.symbol] = item.closes;
  }

  return {
    data,
    sparklinesMap,
    error,
    isLoading,
  };
}
