/**
 * Hooks for the imported-content timeline and the curation review queue.
 *
 * - useTimeline: chronological ideas across sources (GET /api/ideas/timeline)
 * - useParsedIdeasReview: parsed Discord ideas + source message for the
 *   review queue (GET /api/parsed-ideas)
 * - curateParsedIdea / updateIdeaCuration: write helpers for the two
 *   curation targets (parsed NLP output vs. imported/journal ideas)
 */

import useSWR from 'swr';
import type {
  ParsedIdeaCurationRequest,
  ParsedIdeasListResponse,
  ReviewStatus,
  TimelineFilters,
  TimelineResponse,
  UpdateIdeaRequest,
  UserIdea,
} from '@/types/ideas';

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody?.error || errorBody?.detail || '';
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return response.json();
};

export function useTimeline(filters: TimelineFilters = {}) {
  const params = new URLSearchParams();
  if (filters.source) params.set('source', filters.source);
  if (filters.thread_key) params.set('thread_key', filters.thread_key);
  if (filters.author) params.set('author', filters.author);
  if (filters.symbol) params.set('symbol', filters.symbol);
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  const { data, error, isLoading, mutate } = useSWR<TimelineResponse>(
    `/api/ideas/timeline${qs ? `?${qs}` : ''}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  return {
    ideas: data?.ideas ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    refresh: () => mutate(),
  };
}

export interface ParsedReviewFilters {
  review_status?: ReviewStatus | '';
  symbol?: string;
  label?: string;
  limit?: number;
  offset?: number;
}

export function useParsedIdeasReview(filters: ParsedReviewFilters = {}) {
  const params = new URLSearchParams();
  if (filters.review_status) params.set('review_status', filters.review_status);
  if (filters.symbol) params.set('symbol', filters.symbol);
  if (filters.label) params.set('label', filters.label);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  const qs = params.toString();

  const { data, error, isLoading, mutate } = useSWR<ParsedIdeasListResponse>(
    `/api/parsed-ideas${qs ? `?${qs}` : ''}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    refresh: () => mutate(),
  };
}

async function writeJson(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error || errorBody?.detail || `Save failed (${response.status})`);
  }
  return response.json();
}

/** Correct a parsed Discord idea (labels, attribution, review status, ...). */
export function curateParsedIdea(id: string, body: ParsedIdeaCurationRequest) {
  return writeJson(`/api/parsed-ideas/${id}/curation`, 'PUT', body);
}

/** Update an imported/journal idea's curation fields. */
export function updateIdeaCuration(id: string, body: UpdateIdeaRequest): Promise<UserIdea> {
  return writeJson(`/api/ideas/${id}`, 'PUT', body);
}
