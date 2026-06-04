/**
 * Video-research feature hooks.
 *
 * `useResolveVideo` is an async action (not SWR) for the POST /videos/resolve
 * flow. `useQuotes` is an SWR wrapper over the /api/quotes proxy, mirroring the
 * shape used by the credibility hooks.
 */

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import type { Quote, QuoteFilters, ResolvedVideo } from '@/types/research';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed (${res.status})`);
  }
  return res.json();
};

const swrConfig = { revalidateOnFocus: false, dedupingInterval: 30000 } as const;

export function useResolveVideo() {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolve = useCallback(async (url: string): Promise<ResolvedVideo | null> => {
    setIsResolving(true);
    setError(null);
    try {
      const res = await fetch('/api/videos/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Request failed (${res.status})`);
      }
      return (await res.json()) as ResolvedVideo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resolve video'));
      return null;
    } finally {
      setIsResolving(false);
    }
  }, []);

  return { resolve, isResolving, error };
}

export function useQuotes(filters?: QuoteFilters) {
  const qs = new URLSearchParams();
  if (filters?.q) qs.set('q', filters.q);
  if (filters?.person_id != null) qs.set('person_id', String(filters.person_id));
  if (filters?.category) qs.set('category', filters.category);
  if (filters?.ticker) qs.set('ticker', filters.ticker);
  if (filters?.video_id) qs.set('video_id', filters.video_id);
  if (filters?.status) qs.set('status', filters.status);
  const s = qs.toString();
  const url = `/api/quotes${s ? `?${s}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ quotes: Quote[] }>(url, fetcher, swrConfig);

  return { quotes: data?.quotes ?? [], error, isLoading, refresh: () => mutate() };
}
