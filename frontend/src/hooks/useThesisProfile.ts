/**
 * Thesis-profile fetching hook (Project B).
 *
 * Fetches the AI-co-authored ThesisProfile for a (ticker, bucket). A 404
 * (no profile yet) resolves to `null` rather than an error, so the UI can
 * show a "Build profile" CTA. Only fetches when a CONCRETE bucket is active
 * (the backend GET requires one — 'all'/none returns 400).
 */

import useSWR from 'swr';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import type { BucketName } from '@/lib/bucket';
import type { ThesisProfile } from '@/types/api';

const fetcher = async (url: string): Promise<ThesisProfile | null> => {
  const res = await fetch(url);
  if (res.status === 404) return null; // no profile yet
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Failed to fetch profile (${res.status})`);
  }
  return res.json();
};

export function useThesisProfile(
  ticker: string | null,
  bucketOverride?: BucketName | null,
) {
  const ctxBucket = useBucket();
  const bucket = bucketOverride !== undefined ? bucketOverride : ctxBucket;
  const url = ticker && bucket
    ? withBucket(`/api/stocks/${ticker.toUpperCase()}/profile`, bucket)
    : null;

  const { data, error, isLoading, mutate } = useSWR<ThesisProfile | null>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return { data, error, isLoading, refresh: () => mutate() };
}
