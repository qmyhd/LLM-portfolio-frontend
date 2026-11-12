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

const cache = new Map<string, { role: AppRole; at: number }>();

/**
 * Current role of an `app_users.id`. An id the backend doesn't know (404) or
 * a role string we don't recognise is `pending`.
 *
 * @throws RoleLookupError when the backend can't be reached or answers 5xx.
 */
export async function freshRole(appUserId: string): Promise<AppRole> {
  const hit = cache.get(appUserId);
  if (hit && Date.now() - hit.at <= CACHE_MS) return hit.role;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        "X-App-User": appUserId,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
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
    let body: { role?: unknown };
    try {
      body = await res.json();
    } catch {
      throw new RoleLookupError("Role lookup failed: unreadable response");
    }
    role =
      typeof body.role === "string" && KNOWN_ROLES.includes(body.role)
        ? (body.role as AppRole)
        : "pending";
  }

  cache.set(appUserId, { role, at: Date.now() });
  return role;
}

/** Drop one user's cached role, or all of them when no id is given. */
export function forgetRole(appUserId?: string): void {
  if (appUserId === undefined) cache.clear();
  else cache.delete(appUserId);
}
