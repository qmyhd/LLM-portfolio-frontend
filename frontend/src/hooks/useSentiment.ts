/**
 * Sentiment data fetching hook.
 *
 * Fetches aggregated sentiment from the BFF proxy route.
 * Dedupes requests within 60 seconds (sentiment changes slowly)
 * and only retries once on failure.
 */

import useSWR from 'swr';

interface SentimentData {
  ticker: string;
  window: string;
  totalMentions: number;
  bullishPct: number | null;
  bearishPct: number | null;
  neutralPct: number | null;
}

const fetcher = async (url: string): Promise<SentimentData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Failed to fetch sentiment (${res.status})`);
  }
  return res.json();
};

/**
 * Hook to fetch sentiment data.
 *
 * @param ticker - Optional ticker to scope sentiment. Omit for portfolio-wide.
 * @param window - Time window (default '30d')
 *
 * @example
 * ```tsx
 * // Portfolio-wide sentiment
 * const { data } = useSentiment();
 *
 * // Ticker-specific sentiment
 * const { data } = useSentiment('AAPL', '7d');
 * ```
 */
export function useSentiment(ticker?: string, window = '30d') {
  const params = new URLSearchParams({ window });
  if (ticker) params.set('ticker', ticker);

  const { data, error, isLoading, mutate } = useSWR<SentimentData>(
    `/api/sentiment?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000, errorRetryCount: 1 },
  );

  return {
    /** Sentiment data (percentages, mentions, window) */
    data,
    /** Error if fetch failed */
    error,
    /** True on initial load */
    isLoading,
    /** Manually refresh the data */
    refresh: () => mutate(),
  };
}

export type { SentimentData };
