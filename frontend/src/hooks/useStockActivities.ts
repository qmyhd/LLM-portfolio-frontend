import useSWR from 'swr';
import type { StockActivitiesResponse } from '@/types/api';

const fetcher = async (url: string): Promise<StockActivitiesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch stock activities (${res.status})`);
  return res.json();
};

export function useStockActivities(ticker: string, limit = 50) {
  const { data, error, isLoading } = useSWR<StockActivitiesResponse>(
    `/api/stocks/${ticker}/activities?limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );
  return { data, error, isLoading };
}
