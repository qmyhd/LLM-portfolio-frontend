/** Pure helpers for the SWR provider: per-user cache key and auth failures. */

const BASE_KEY = "app-swr-cache-v2";

/** Old, shared key (pre per-user). Removed on load so nothing lingers. */
export const LEGACY_CACHE_KEY = "app-swr-cache-v1";

/** localStorage key for one user's cache. No user id means no persistence. */
export function cacheStorageKey(userId: string | null | undefined): string | null {
  return userId ? `${BASE_KEY}:${userId}` : null;
}

/** Admin responses are never written to localStorage. */
const NEVER_PERSIST = /\/api\/(users|connections)(?=$|[/?#])/;

export function shouldPersistKey(key: unknown): boolean {
  if (typeof key !== "string") return false;
  return !NEVER_PERSIST.test(key);
}

const WAITING_TEXT = "This account is waiting for approval";
const SIGN_IN_TEXT = "Please sign in again";

/**
 * Where to send the browser when a request shows access was revoked or the
 * session is stale. Fetchers differ in what they keep of the response, so the
 * server's exact error text is matched (and the status too, when one is kept).
 */
export function authFailureTarget(error: unknown): "/pending" | "/login" | null {
  if (!error || typeof error !== "object") return null;
  const { message, status } = error as { message?: unknown; status?: unknown };
  if (typeof message !== "string") return null;
  if (message.includes(WAITING_TEXT) && (status === undefined || status === 403)) {
    return "/pending";
  }
  if (message.includes(SIGN_IN_TEXT) && (status === undefined || status === 401)) {
    return "/login";
  }
  return null;
}

/** True for any localStorage key this cache has ever used (all users, old key). */
export function isCacheStorageKey(key: string): boolean {
  return key === LEGACY_CACHE_KEY || key.startsWith(`${BASE_KEY}:`);
}
