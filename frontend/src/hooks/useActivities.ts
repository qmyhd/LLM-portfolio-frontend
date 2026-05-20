/**
 * SWR hook for fetching account activities (trades, dividends, fees).
 */

import useSWR from 'swr';
import { useBucket } from '@/contexts/BucketContext';
import type { ActivitiesResponse } from '@/types/api';

const fetcher = async (url: string): Promise<ActivitiesResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody?.error || errorBody?.detail || '';
    throw new Error(
      detail
        ? `Activities error: ${detail}`
        : `Failed to fetch activities (${response.status})`,
    );
  }
  return response.json();
};

interface UseActivitiesOptions {
  activityType?: string;
  symbol?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const { activityType, symbol, limit = 50, startDate, endDate } = options;
  const bucket = useBucket();

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (activityType) params.set('activityType', activityType);
    if (symbol) params.set('symbol', symbol);
    if (limit) params.set('limit', String(limit));
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (bucket) params.set('bucket', bucket);
    const qs = params.toString();
    return `/api/activities${qs ? `?${qs}` : ''}`;
  };

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ActivitiesResponse>(buildUrl(), fetcher, {
      refreshInterval: 0, // Activities are not real-time
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    });

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(),
  };
}
