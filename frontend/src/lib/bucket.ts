/**
 * Strategy bucket utilities (frontend side).
 *
 * Mirrors backend `src/bucket.py`. A "bucket" classifies a brokerage
 * account by trading strategy. Used to filter positions, trades, risk,
 * and analysis by strategy.
 */

import type { NextRequest } from 'next/server';

export type BucketName =
  | 'long_term'
  | 'swing'
  | 'day'
  | 'retirement'
  | 'other';

/** Sentinel for "no filter" — accepted alongside missing/empty bucket params. */
export const ALL_BUCKETS = 'all' as const;

export type BucketFilter = BucketName | typeof ALL_BUCKETS | null;

export const BUCKET_NAMES: readonly BucketName[] = [
  'long_term',
  'swing',
  'day',
  'retirement',
  'other',
] as const;

export const BUCKET_LABELS: Record<BucketName, string> = {
  long_term: 'Long-term',
  swing: 'Swing',
  day: 'Day',
  retirement: 'Retirement',
  other: 'Other',
};

/** Validate a string against the bucket enum. Returns null for empty/all. */
export function parseBucket(value: string | null | undefined): BucketName | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized === ALL_BUCKETS) return null;
  if ((BUCKET_NAMES as readonly string[]).includes(normalized)) {
    return normalized as BucketName;
  }
  return null;
}

/**
 * Forward the `bucket` query param from an incoming NextRequest into a
 * URLSearchParams destined for the backend. No-op when missing or 'all'.
 *
 * Call before .toString() on the params you pass to backendFetch:
 *
 *   const params = new URLSearchParams();
 *   forwardBucket(request, params);
 *   const qs = params.toString();
 */
export function forwardBucket(request: NextRequest, params: URLSearchParams): void {
  const bucket = parseBucket(request.nextUrl.searchParams.get('bucket'));
  if (bucket) params.set('bucket', bucket);
}

/**
 * Build a stock-detail href that carries the active bucket forward.
 *
 *   <Link href={stockHref(symbol, bucket)}>{symbol}</Link>
 *
 * When `bucket` is null the result is just `/stock/{symbol}` (no query string),
 * so this is safe to use anywhere — components on the Research side that
 * have no bucket context still produce clean URLs.
 */
export function stockHref(symbol: string, bucket: BucketName | null): string {
  const base = `/stock/${encodeURIComponent(symbol)}`;
  return bucket ? `${base}?bucket=${encodeURIComponent(bucket)}` : base;
}
