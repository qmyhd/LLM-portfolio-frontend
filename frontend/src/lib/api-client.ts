/**
 * Backend API Client Utility
 *
 * Provides authenticated fetch wrapper for calling FastAPI backend.
 * All requests include the API_SECRET_KEY as Bearer token.
 *
 * Usage:
 *   import { backendFetch, getAuthHeaders } from '@/lib/api-client';
 *   
 *   // In API route handlers
 *   const response = await backendFetch('/portfolio');
 */

import { auth } from "@/auth";
import { hasRole } from "@/lib/roles";
import type { AppRole } from "@/types/next-auth";

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_SECRET_KEY = process.env.API_SECRET_KEY || "";

/**
 * Get authorization headers for backend API calls.
 * Includes Bearer token from API_SECRET_KEY.
 */
export function getAuthHeaders(): Record<string, string> {
  if (!API_SECRET_KEY) {
    console.warn("API_SECRET_KEY not configured - backend calls may fail");
  }

  return {
    "Content-Type": "application/json",
    ...(API_SECRET_KEY && { Authorization: `Bearer ${API_SECRET_KEY}` }),
  };
}

/**
 * Authenticated fetch wrapper for backend API calls.
 *
 * @param path - API path (e.g., '/portfolio')
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  assertSafeBackendPath(path);
  const url = `${API_URL}${path}`;

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Check if the current request is authenticated via NextAuth session.
 * Use in API routes to verify user is logged in before proxying to backend.
 *
 * @returns Session object if authenticated, null otherwise
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  return session;
}

/**
 * Helper to create error response with consistent format.
 */
export function errorResponse(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}

/**
 * Verify the session AND its role. Call first thing in every API route
 * handler. Middleware checks roles too; this is the second, independent
 * check, so a middleware gap (like the old dotted-path skip) can't open a
 * route on its own.
 *
 * Convention (scripts/check-route-guards.mjs enforces it at build time):
 * - GET handlers:                      requireRole("viewer")
 * - POST/PUT/PATCH/DELETE handlers:    requireRole("editor") or stricter
 * - /api/connections mutations:        requireRole("owner")
 *
 * @throws Response 401 when signed out, 403 when the role is too low.
 */
export async function requireRole(min: AppRole) {
  const session = await requireAuth();

  if (!session) {
    throw errorResponse("Unauthorized - please sign in", 401);
  }

  if (!hasRole(session.user?.role, min)) {
    throw errorResponse(
      min === "viewer"
        ? "This account has no access yet - ask the owner"
        : `This action requires the ${min} role`,
      403
    );
  }

  return session;
}

/**
 * @deprecated Use requireRole("viewer" | "editor" | "owner"). Kept so any
 * stray caller still gets at least a viewer-level check.
 */
export async function authGuard() {
  return requireRole("viewer");
}

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------

// One path segment from a route param: a ticker (BRK.B, BTC-USD, ^GSPC), a
// UUID, a numeric id or a Discord snowflake. It must start with a letter,
// digit or ^, so "." and ".." can never pass.
const SAFE_SEGMENT = /^[A-Za-z0-9^][A-Za-z0-9._:^=~+-]{0,127}$/;

/**
 * Validate and encode a route param before it goes into a backend path.
 *
 *   backendFetch(`/people/${seg(id)}`)
 *
 * Next.js decodes %2F in dynamic params, so without this a param like
 * "..%2Fconnections%2Fx%2Fbucket" would climb out to another backend
 * endpoint carrying the master API key.
 *
 * @throws Response 400 when the value isn't a plain identifier.
 */
export function seg(value: string): string {
  if (typeof value !== "string" || !SAFE_SEGMENT.test(value)) {
    throw errorResponse("Invalid path parameter", 400);
  }
  return encodeURIComponent(value);
}

/**
 * Last line of defence inside backendFetch: refuse any backend path whose
 * path part contains a "." / ".." segment (raw or percent-encoded), an
 * encoded slash or backslash, a fragment, or control characters. Covers any
 * future route that forgets seg().
 */
function assertSafeBackendPath(path: string): void {
  const bad = () => errorResponse("Invalid backend path", 400);

  if (!path.startsWith("/") || path.startsWith("//")) throw bad();
  if (/[\\#\u0000-\u001f\u007f]/.test(path)) throw bad();

  const pathname = path.split("?", 1)[0];
  for (const raw of pathname.split("/")) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      throw bad();
    }
    if (
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\")
    ) {
      throw bad();
    }
  }
}
