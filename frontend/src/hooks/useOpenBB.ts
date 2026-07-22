/**
 * OpenBB insights data fetching hooks.
 * Uses SWR for caching and automatic revalidation.
 */

import useSWR from 'swr';
import type {
  TranscriptResponse,
  ManagementResponse,
  FundamentalsResponse,
  FilingsResponse,
  NewsResponse,
} from '@/types/api';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const detail = errorBody?.error || errorBody?.detail || '';
    throw new Error(
      detail ? detail : `Request failed (${res.status})`
    );
  }
  return res.json();
};

export function useTranscript(ticker: string | null, year?: number, quarter?: number) {
  const qs = new URLSearchParams();
  if (year) qs.set('year', String(year));
  if (quarter) qs.set('quarter', String(quarter));
  const qsStr = qs.toString();
  const url = ticker
    ? `/api/stocks/${ticker.toUpperCase()}/transcript${qsStr ? `?${qsStr}` : ''}`
    : null;

  return useSWR<TranscriptResponse>(url, fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });
}

export function useManagement(ticker: string | null) {
  const url = ticker ? `/api/stocks/${ticker.toUpperCase()}/management` : null;
  return useSWR<ManagementResponse>(url, fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });
}

export function useFundamentals(ticker: string | null) {
  const url = ticker ? `/api/stocks/${ticker.toUpperCase()}/fundamentals` : null;
  return useSWR<FundamentalsResponse>(url, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });
}

export function useFilings(ticker: string | null, formType?: string, limit = 10) {
  const qs = new URLSearchParams();
  if (formType) qs.set('form_type', formType);
  qs.set('limit', String(limit));
  const url = ticker
    ? `/api/stocks/${ticker.toUpperCase()}/filings?${qs.toString()}`
    : null;

  return useSWR<FilingsResponse>(url, fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });
}

export function useNews(ticker: string | null, limit = 10) {
  const url = ticker
    ? `/api/stocks/${ticker.toUpperCase()}/news?limit=${limit}`
    : null;

  return useSWR<NewsResponse>(url, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });
}

