'use client';

/**
 * Global SWR configuration mounted at the app root.
 *
 * - `keepPreviousData: true` — when a key changes (e.g. switching bucket),
 *   SWR keeps the previously-loaded data on screen while the new key loads,
 *   so views never flash to an empty/skeleton state mid-session.
 * - localStorage cache provider — the SWR cache is hydrated from localStorage
 *   on boot and written back on unload, so a hard refresh / first paint shows
 *   the last-known data instantly, then revalidates in the background.
 *
 * Stale data is clearly marked as "updating" by consumers via `isValidating`
 * (see RefreshingIndicator).
 */

import { SWRConfig } from 'swr';
import type { Cache } from 'swr';
import type { ReactNode } from 'react';

const CACHE_KEY = 'app-swr-cache-v1';

function localStorageProvider(): Cache {
  // SSR / no-window: a plain in-memory cache (no persistence).
  if (typeof window === 'undefined') return new Map() as unknown as Cache;

  let map: Map<string, unknown>;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    map = new Map(raw ? (JSON.parse(raw) as [string, unknown][]) : []);
  } catch {
    map = new Map();
  }

  // Persist the whole cache on unload so the next load renders instantly.
  window.addEventListener('beforeunload', () => {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(map.entries())));
    } catch {
      /* quota exceeded or non-serializable entry — skip persistence */
    }
  });

  return map as unknown as Cache;
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ keepPreviousData: true, provider: localStorageProvider }}>
      {children}
    </SWRConfig>
  );
}
