'use client';

/**
 * Global SWR configuration mounted at the app root.
 *
 * - `keepPreviousData: true` — when a key changes (e.g. switching bucket),
 *   SWR keeps the previously-loaded data on screen while the new key loads,
 *   so views never flash to an empty/skeleton state mid-session.
 * - localStorage persistence, per signed-in user — the cache is hydrated from
 *   a key that includes the user's id and written back on unload, so a hard
 *   refresh shows the last-known data, then revalidates. With no user id
 *   nothing is persisted. Responses for /api/users and /api/connections are
 *   never written. When the session becomes unauthenticated, or a different
 *   user signs in, the in-memory cache is emptied and every stored cache is
 *   removed, so a shared browser never shows the previous person's data.
 * - Global onError — a 403 "waiting for approval" or a 401 "sign in again"
 *   from any request sends the browser to /pending or /login (full navigation,
 *   once).
 *
 * Stale data is clearly marked as "updating" by consumers via `isValidating`
 * (see RefreshingIndicator).
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import type { Cache } from 'swr';
import { useSession } from 'next-auth/react';
import {
  LEGACY_CACHE_KEY,
  authFailureTarget,
  cacheStorageKey,
  isCacheStorageKey,
  shouldPersistKey,
} from '@/lib/swr-cache';

function removeAllStoredCaches() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && isCacheStorageKey(k)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

export function SWRProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;

  // One in-memory cache for the life of the page. Persistence is attached to
  // it below, per user.
  const mapRef = useRef<Map<string, unknown>>(new Map());
  const loadedFor = useRef<string | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;
    const map = mapRef.current;

    // The old, shared cache key can hold someone else's data.
    try {
      window.localStorage.removeItem(LEGACY_CACHE_KEY);
    } catch {
      /* storage unavailable */
    }

    // Signed out, or a different user than the one the cache belongs to.
    if (!userId || (loadedFor.current && loadedFor.current !== userId)) {
      map.clear();
      removeAllStoredCaches();
      loadedFor.current = null;
    }
    if (!userId) return;

    const storageKey = cacheStorageKey(userId);
    if (!storageKey) return;

    if (loadedFor.current !== userId) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        const entries = raw ? (JSON.parse(raw) as [string, unknown][]) : [];
        for (const [k, v] of entries) {
          if (shouldPersistKey(k) && !map.has(k)) map.set(k, v);
        }
      } catch {
        /* unreadable cache — start empty */
      }
      loadedFor.current = userId;
    }

    // Persist on unload so the next load renders instantly.
    const persist = () => {
      try {
        const entries = Array.from(map.entries()).filter(([k]) => shouldPersistKey(k));
        window.localStorage.setItem(storageKey, JSON.stringify(entries));
      } catch {
        /* quota exceeded or non-serializable entry — skip persistence */
      }
    };
    window.addEventListener('beforeunload', persist);
    return () => window.removeEventListener('beforeunload', persist);
  }, [userId, status]);

  return (
    <SWRConfig
      value={{
        keepPreviousData: true,
        provider: () => mapRef.current as unknown as Cache,
        onError: (error) => {
          const target = authFailureTarget(error);
          if (!target || redirected.current) return;
          if (window.location.pathname === target) return;
          redirected.current = true;
          window.location.assign(target);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
