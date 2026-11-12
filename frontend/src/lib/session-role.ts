/**
 * Fresh role lookup. The role in the sign-in cookie can be up to 24 hours
 * old, so every guarded request asks the backend (`GET /auth/me`) for the
 * current role. Answers are cached in memory for 30 seconds per user.
 *
 * Must not import from "@/auth": auth.ts imports this module.
 */

import type { AppRole } from "@/types/next-auth";

const CACHE_MS = 30_000;
const TIMEOUT_MS = 5_000;
const KNOWN_ROLES: readonly string[] = ["owner", "family", "guest", "pending"];

export class RoleLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoleLookupError";
  }
}

const MAX_ENTRIES = 5_000;
const REFRESH_MIN_AGE_MS = 5_000;

const cache = new Map<string, { role: AppRole; at: number }>();
const inFlight = new Map<string, Promise<AppRole>>();

function remember(appUserId: string, role: AppRole): void {
  const now = Date.now();
  for (const [id, entry] of cache) {
    if (now - entry.at > CACHE_MS) cache.delete(id);
  }
  if (cache.size > MAX_ENTRIES) cache.clear();
  cache.set(appUserId, { role, at: now });
}

async function lookup(appUserId: string): Promise<AppRole> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
          "X-App-User": appUserId,
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      throw new RoleLookupError("Role lookup failed: backend unreachable");
    }

    let role: AppRole;
    if (res.status === 404) {
      role = "pending";
    } else if (!res.ok) {
      throw new RoleLookupError(`Role lookup failed: backend returned ${res.status}`);
    } else {
      let body: { id?: unknown; role?: unknown };
      try {
        body = await res.json();
      } catch {
        throw new RoleLookupError("Role lookup failed: unreadable response");
      }
      if (
        typeof body.id !== "string" ||
        body.id.toLowerCase() !== appUserId.toLowerCase()
      ) {
        throw new RoleLookupError("Role lookup failed: response is for another user");
      }
      role =
        typeof body.role === "string" && KNOWN_ROLES.includes(body.role)
          ? (body.role as AppRole)
          : "pending";
    }

    remember(appUserId, role);
    return role;
  } finally {
    clearTimeout(timer);
  }
}

/** One backend request per id at a time; concurrent callers share it. */
function shared(appUserId: string): Promise<AppRole> {
  let pending = inFlight.get(appUserId);
  if (!pending) {
    pending = lookup(appUserId).finally(() => inFlight.delete(appUserId));
    inFlight.set(appUserId, pending);
  }
  return pending;
}

/**
 * Current role of an `app_users.id`. An id the backend doesn't know (404) or
 * a role string we don't recognise is `pending`.
 *
 * @throws RoleLookupError when the backend can't be reached, answers 5xx, or
 *   answers for a different user.
 */
export async function freshRole(appUserId: string): Promise<AppRole> {
  const hit = cache.get(appUserId);
  if (hit && Date.now() - hit.at <= CACHE_MS) return hit.role;
  return shared(appUserId);
}

/**
 * Like freshRole, but for an explicit refresh request: skips the cache only
 * when the cached answer is older than 5 seconds, so a client calling
 * update() in a loop can't hit the backend on every call.
 */
export async function refreshRole(appUserId: string): Promise<AppRole> {
  const hit = cache.get(appUserId);
  if (hit && Date.now() - hit.at <= REFRESH_MIN_AGE_MS) return hit.role;
  return shared(appUserId);
}

/** Drop one user's cached role, or all of them when no id is given. */
export function forgetRole(appUserId?: string): void {
  if (appUserId === undefined) cache.clear();
  else cache.delete(appUserId);
}
