/**
 * Middleware decisions as a pure function (testable without Next).
 *
 * The role comes from the session cookie and can be up to a day stale, so this
 * is a first, deny-only layer: it never grants more than the cookie's role
 * allows. Real access is decided per request by requireRole in each API route,
 * which confirms the role with the backend.
 */

import { hasRole } from "@/lib/roles";

export type Decision =
  | { action: "next" }
  | { action: "redirect"; to: string }
  | { action: "deny"; status: 401 | 403; error: string };

export interface DecideInput {
  pathname: string;
  method: string;
  signedIn: boolean;
  /** The session carries an app user id. Older cookies do not. */
  hasUserId: boolean;
  role: string | null | undefined;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// "/_next/" also covers "/_next/data/", which is safe only while the app has
// no pages router (no getServerSideProps data to protect).
// Paths that skip auth entirely: Next.js internals and NextAuth's endpoints.
const EXCLUDED = [
  /^\/_next\//,
  /^\/api\/auth(\/|$)/,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
];

// Static files by extension. NEVER applies under /api/: a route param can end
// in ".png" (e.g. /api/people/x.png), and skipping the role check there was
// part of the role-bypass chain found in the 11/2026 review.
const STATIC_FILE =
  /\.(png|jpe?g|gif|svg|ico|webp|avif|css|js|map|txt|xml|woff2?|ttf|otf|webmanifest)$/i;

// The one mutation a guest may make: POST chat about a single ticker. "%" is
// excluded so an encoded slash cannot smuggle in a second segment.
const CHAT_PATH = /^\/api\/stocks\/[^/%]+\/chat$/;

const onPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

const NEEDS_OWNER: Decision = {
  action: "deny",
  status: 403,
  error: "This action needs the owner",
};

export function decide({
  pathname,
  method,
  signedIn: hasSession,
  hasUserId,
  role,
}: DecideInput): Decision {
  if (EXCLUDED.some((p) => p.test(pathname))) return { action: "next" };
  if (!pathname.startsWith("/api/") && STATIC_FILE.test(pathname)) {
    return { action: "next" };
  }

  // A session without a user id (cookie from before ids existed, or a sign-in
  // while the backend sync failed) can never be checked against the backend.
  // Treat it as signed out for pages; API calls are told to sign in again.
  const signedIn = hasSession && hasUserId;
  if (hasSession && !hasUserId && pathname.startsWith("/api/")) {
    return { action: "deny", status: 401, error: "Please sign in again" };
  }

  if (pathname === "/login") {
    return signedIn ? { action: "redirect", to: "/" } : { action: "next" };
  }

  if (!signedIn) {
    return {
      action: "redirect",
      to: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
    };
  }

  const isApi = pathname.startsWith("/api/");

  // Rank 0: pending, missing or unknown role.
  if (!hasRole(role, "guest")) {
    if (isApi) {
      return {
        action: "deny",
        status: 403,
        error: "This account is waiting for approval",
      };
    }
    return pathname === "/pending"
      ? { action: "next" }
      : { action: "redirect", to: "/pending" };
  }

  if (pathname === "/pending") return { action: "redirect", to: "/" };

  const isOwner = hasRole(role, "owner");

  if (isApi) {
    if (isOwner) return { action: "next" };
    if (onPath(pathname, "/api/connections") || onPath(pathname, "/api/users")) {
      return NEEDS_OWNER;
    }
    if (MUTATING_METHODS.has(method.toUpperCase()) &&
      !(method.toUpperCase() === "POST" && CHAT_PATH.test(pathname))) {
      return NEEDS_OWNER;
    }
    return { action: "next" };
  }

  if (onPath(pathname, "/settings/users") && !isOwner) {
    return { action: "redirect", to: "/settings" };
  }

  return { action: "next" };
}
