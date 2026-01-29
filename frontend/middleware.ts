/**
 * Next.js Middleware for Authentication
 *
 * Protects all routes except:
 * - /login (auth page)
 * - /api/auth/* (NextAuth endpoints)
 * - /_next/* (Next.js internals)
 * - /favicon.ico, /robots.txt, etc.
 *
 * Unauthenticated users are redirected to /login
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login"];

// Patterns for static assets and API routes that should be excluded
const excludePatterns = [
  /^\/_next/,           // Next.js internals
  /^\/api\/auth/,       // NextAuth endpoints
  /^\/favicon\.ico$/,   // Favicon
  /^\/robots\.txt$/,    // Robots.txt
  /^\/sitemap\.xml$/,   // Sitemap
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i,  // Images
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Check if path should be excluded from auth
  if (excludePatterns.some((pattern) => pattern.test(pathname))) {
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

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
