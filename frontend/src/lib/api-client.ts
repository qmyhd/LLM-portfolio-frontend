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
 * Helper to verify session and return 401 if not authenticated.
 * Use at the start of protected API routes.
 *
 * @returns Session if authenticated, or throws Response with 401
 */
export async function authGuard() {
  const session = await requireAuth();

  if (!session) {
    throw errorResponse("Unauthorized - please sign in", 401);
  }

  return session;
}
