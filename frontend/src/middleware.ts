/**
 * Next.js Middleware for Authentication + Role Enforcement
 *
 * Protects all routes except:
 * - /login (auth page)
 * - /api/auth/* (NextAuth endpoints)
 * - /_next/* (Next.js internals)
 * - /favicon.ico, /robots.txt, etc.
 *
 * Unauthenticated users are redirected to /login.
 *
 * Role enforcement (role comes from the session JWT, set at sign-in):
 * - viewer: read-only — mutating /api requests return 403
 * - editor: all writes except connection/account management
 * - owner:  everything, including /api/connections mutations
 * Sessions created before roles existed carry no role and are treated as
 * viewer — sign out and back in to pick up a role.
 */

import { auth } from "@/auth";
import { hasRole } from "@/lib/roles";
import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Routes that don't require authentication
const publicRoutes = ["/login"];

// Paths that skip auth entirely. Next.js internals and NextAuth's own
// endpoints only.
const excludePatterns = [
  /^\/_next\//,         // Next.js internals
  /^\/api\/auth(\/|$)/, // NextAuth endpoints
  /^\/favicon\.ico$/,   // Favicon
  /^\/robots\.txt$/,    // Robots.txt
  /^\/sitemap\.xml$/,   // Sitemap
];

// Static files by extension. This rule NEVER applies under /api/: a route
// param can end in ".png" (e.g. /api/people/x.png), and skipping the role
// check there was part of the role-bypass chain found in the 11/2026 review.
const STATIC_FILE = /\.(png|jpe?g|gif|svg|ico|webp|avif|css|js|map|txt|xml|woff2?|ttf|otf|webmanifest)$/i;

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Check if path should be excluded from auth
  if (excludePatterns.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }
  if (!pathname.startsWith("/api/") && STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    // If already authenticated, redirect to home
    if (req.auth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Protected route - check authentication
  if (!req.auth) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role enforcement for mutating API calls (NextAuth's own /api/auth/*
  // endpoints were already excluded above).
  const role = req.auth.user?.role;

  // A role the app doesn't know (rank 0) gets no API access at all.
  if (pathname.startsWith("/api/") && !hasRole(role, "viewer")) {
    return NextResponse.json(
      { error: "This account has no access yet - ask the owner" },
      { status: 403 }
    );
  }

  if (pathname.startsWith("/api/") && MUTATING_METHODS.has(req.method)) {
    if (!hasRole(role, "editor")) {
      return NextResponse.json(
        { error: "Read-only account - ask the owner for editor access" },
        { status: 403 }
      );
    }

    // Brokerage connection management (SnapTrade portal, bucket
    // reassignment) is owner-only.
    if (pathname.startsWith("/api/connections") && !hasRole(role, "owner")) {
      return NextResponse.json(
        { error: "Connection management requires the owner role" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next's build output. The old matcher also
  // skipped ANY path containing a dot, so /api/stocks/BRK.B/... and crafted
  // dotted paths never reached the role checks above. Static files by
  // extension are now let through inside the middleware instead (never
  // under /api/).
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
