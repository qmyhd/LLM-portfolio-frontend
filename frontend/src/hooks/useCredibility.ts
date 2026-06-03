/**
 * Credibility-feature data hooks.
 *
 * SWR wrappers over the /api/people, /api/identities, /api/credibility, and
 * /api/stocks/{ticker}/topic-tags proxy routes. Each hook returns a
 * destructured slice plus `{ error, isLoading, refresh }`, mirroring the
 * shape used by useThesisProfile.
 */

import useSWR from 'swr';
import type {
  PersonListItem,
  PersonDetail,
  PersonRevision,
  UnmatchedIdentity,
  CredibilityCategory,
  TopicTag,
} from '@/types/credibility';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed (${res.status})`);
  }
  return res.json();
};

const swrConfig = { revalidateOnFocus: false, dedupingInterval: 30000 } as const;

export function usePeople(opts?: { status?: string; category?: string; tier?: string }) {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set('status', opts.status);
  if (opts?.category) qs.set('category', opts.category);
  if (opts?.tier) qs.set('tier', opts.tier);
  const s = qs.toString();
  const url = `/api/people${s ? `?${s}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ people: PersonListItem[] }>(
    url,
    fetcher,
    swrConfig,
  );

  return { people: data?.people ?? [], error, isLoading, refresh: () => mutate() };
}

export function usePerson(id: number | null) {
  const url = id != null ? `/api/people/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR<PersonDetail>(url, fetcher, swrConfig);

  return { person: data, error, isLoading, refresh: () => mutate() };
}

export function usePersonRevisions(id: number | null) {
  const url = id != null ? `/api/people/${id}/revisions` : null;

  const { data, error, isLoading, mutate } = useSWR<{ id: number; revisions: PersonRevision[] }>(
    url,
    fetcher,
    swrConfig,
  );

  return { revisions: data?.revisions ?? [], error, isLoading, refresh: () => mutate() };
}

export function useUnmatchedIdentities() {
  const { data, error, isLoading, mutate } = useSWR<{ unmatched: UnmatchedIdentity[] }>(
    '/api/identities/unmatched',
    fetcher,
    swrConfig,
  );

  return { unmatched: data?.unmatched ?? [], error, isLoading, refresh: () => mutate() };
}

export function useCredibilityCategories() {
  const { data, error, isLoading, mutate } = useSWR<{ categories: CredibilityCategory[] }>(
    '/api/credibility/categories',
    fetcher,
    swrConfig,
  );

  return { categories: data?.categories ?? [], error, isLoading, refresh: () => mutate() };
}

export function useTierMultipliers() {
  const { data, error, isLoading, mutate } = useSWR<{ multipliers: Record<string, number> }>(
    '/api/credibility/tier-multipliers',
    fetcher,
    swrConfig,
  );

  return { multipliers: data?.multipliers ?? {}, error, isLoading, refresh: () => mutate() };
}

export function useTopicTags(ticker: string | null) {
  const url = ticker ? `/api/stocks/${ticker}/topic-tags` : null;

  const { data, error, isLoading, mutate } = useSWR<{ symbol: string; tags: TopicTag[] }>(
    url,
    fetcher,
    swrConfig,
  );

  return { tags: data?.tags ?? [], error, isLoading, refresh: () => mutate() };
}
