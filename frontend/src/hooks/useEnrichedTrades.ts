import useSWR from 'swr';
import type { EnrichedTradesResponse } from '@/types/api';

const fetcher = async (url: string): Promise<EnrichedTradesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch trades (${res.status})`);
  return res.json();
};

/** Fetch enriched trades for a specific stock. */
export function useStockTrades(ticker: string, limit = 20) {
  const { data, error, isLoading } = useSWR<EnrichedTradesResponse>(
    `/api/stocks/${ticker}/trades?limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );
  return { data, error, isLoading };
}

/** Fetch recent enriched trades across all stocks (dashboard). */
export function useRecentTrades(limit = 10) {
  const { data, error, isLoading } = useSWR<EnrichedTradesResponse>(
    `/api/trades?limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );
  return { data, error, isLoading };
}
