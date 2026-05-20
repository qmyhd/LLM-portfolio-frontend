'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { BucketName } from '@/lib/bucket';

interface BucketContextValue {
  /** Active bucket filter, or null for portfolio-wide. */
  bucket: BucketName | null;
}

const BucketContext = createContext<BucketContextValue>({ bucket: null });

interface BucketProviderProps {
  bucket: BucketName | null;
  children: ReactNode;
}

/**
 * Provides the active bucket filter to descendant components.
 *
 * Wrap the Portfolio section in this provider with the bucket resolved
 * from the URL. Components that read live data (hooks under
 * `src/hooks/`) consume the bucket via `useBucket()` and append it to
 * their fetch URLs + SWR cache keys, so changing the bucket changes
 * what they see without a manual refetch.
 */
export function BucketProvider({ bucket, children }: BucketProviderProps) {
  return (
    <BucketContext.Provider value={{ bucket }}>{children}</BucketContext.Provider>
  );
}

/**
 * Read the active bucket filter. Returns null when no provider is in
 * scope (e.g., on the Research side of the app) — equivalent to
 * "portfolio-wide, no filter".
 */
export function useBucket(): BucketName | null {
  return useContext(BucketContext).bucket;
}

/**
 * Helper for hooks: appends `?bucket=...` to a fetch URL when a bucket
 * is active, preserving existing query strings.
 */
export function withBucket(url: string, bucket: BucketName | null): string {
  if (!bucket) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}bucket=${encodeURIComponent(bucket)}`;
}
