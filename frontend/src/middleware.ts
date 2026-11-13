/**
 * Next.js Middleware for Authentication + Role Enforcement
 *
 * The rules live in src/lib/middleware-rules.ts (pure, unit-tested); this file
 * only applies the decision to the request.
 *
 * The role is read from the session cookie (JWT) and can be up to a day stale.
 * That makes this a first, deny-only layer: API routes still confirm the role
 * with the backend on every call (requireRole in src/lib/api-client.ts).
 */

import { auth } from "@/auth";
import { decide } from "@/lib/middleware-rules";
import { NextResponse } from "next/server";

export default auth((req) => {
  const decision = decide({
    pathname: req.nextUrl.pathname,
    method: req.method,
    signedIn: Boolean(req.auth),
    hasUserId: Boolean(req.auth?.user?.id),
    role: req.auth?.user?.role,
  });

  switch (decision.action) {
    case "redirect":
      return NextResponse.redirect(new URL(decision.to, req.url));
    case "deny":
      return NextResponse.json({ error: decision.error }, { status: decision.status });
    default:
      return NextResponse.next();
  }
});

export const config = {
  // Run on everything except Next's build output. The old matcher also
  // skipped ANY path containing a dot, so /api/stocks/BRK.B/... and crafted
  // dotted paths never reached the role checks. Static files by extension
  // are now let through inside decide() instead (never under /api/).
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
