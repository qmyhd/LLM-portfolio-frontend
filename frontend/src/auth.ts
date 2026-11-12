/**
 * NextAuth.js v5 Configuration
 *
 * Both sign-in methods go through the FastAPI backend, which owns the user
 * table (`app_users`) and their roles:
 * - Credentials: `POST /auth/password` checks the username and password
 *   (hashing, lockout and rate limits live there).
 * - Google: `POST /auth/google` verifies the ID token and upserts the user.
 *
 * The JWT carries `appUserId` (`app_users.id`) and a role that is only a
 * hint for the UI. API routes ask the backend for the current role on every
 * call (see `requireRole` in src/lib/api-client.ts).
 *
 * Required Environment Variables:
 * - NEXTAUTH_SECRET: Secret for JWT signing (generate with: openssl rand -base64 32)
 * - API_SECRET_KEY: Backend API key for FastAPI authentication
 * - NEXT_PUBLIC_API_URL: Backend API URL (e.g., https://api.yourdomain.com)
 *
 * Optional (for Google OAuth):
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - OWNER_EMAILS: Emails promoted to 'owner'. Also the fallback owner grant
 *   when the backend is unreachable during sign-in (mirror the backend value).
 *   That owner has no user id until they sign in again, and API calls answer
 *   503 until then.
 *
 * A new Google account is created as 'pending' and waits for the owner's
 * approval.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { AppRole } from "@/types/next-auth";
import { refreshRole } from "@/lib/session-role";

const APP_ROLES: readonly string[] = ["owner", "family", "guest", "pending"];

const isAppRole = (value: unknown): value is AppRole =>
  typeof value === "string" && APP_ROLES.includes(value);

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const backendHeaders = (): Record<string, string> => {
  const apiKey = process.env.API_SECRET_KEY || "";
  return {
    "Content-Type": "application/json",
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
  };
};

// Parse a comma-separated email list from an env var
const parseEmailList = (raw: string | undefined): string[] =>
  (raw || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

/**
 * Report the Google sign-in to the FastAPI backend, which verifies the ID
 * token against GOOGLE_CLIENT_ID and upserts the user into app_users.
 * Returns the user's id and role, or null when the backend is
 * unavailable/misconfigured (callers fall back to OWNER_EMAILS / pending).
 */
async function syncGoogleUserWithBackend(
  idToken: string
): Promise<{ id: string; role: AppRole } | null> {
  try {
    const res = await fetch(`${apiBase()}/auth/google`, {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`Backend /auth/google returned ${res.status}`);
      return null;
    }

    const user = (await res.json()) as { id?: unknown; role?: unknown };
    if (typeof user.id !== "string" || !user.id || !isAppRole(user.role)) {
      return null;
    }
    return { id: user.id, role: user.role };
  } catch (error) {
    console.error("Backend /auth/google sync failed:", error);
    return null;
  }
}

// Build providers list dynamically
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const username = ((credentials?.username as string) || "")
        .trim()
        .toLowerCase();
      const password = (credentials?.password as string) || "";

      if (!username || !password) return null;

      try {
        const res = await fetch(`${apiBase()}/auth/password`, {
          method: "POST",
          headers: backendHeaders(),
          body: JSON.stringify({ username, password }),
          signal: AbortSignal.timeout(5000),
        });
        // 401 wrong credentials, 423 locked, 429 rate limited, 5xx: no session.
        if (res.status !== 200) return null;

        const user = (await res.json()) as {
          id?: unknown;
          email?: unknown;
          role?: unknown;
        };
        if (typeof user.id !== "string" || !user.id || !isAppRole(user.role)) {
          return null;
        }

        return {
          id: user.id,
          name: username,
          email: typeof user.email === "string" ? user.email : undefined,
          role: user.role,
        };
      } catch (error) {
        console.error("Backend /auth/password failed:", error);
        return null;
      }
    },
  }),
];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const authConfig: NextAuthConfig = {
  providers,

  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase() || "";

      // Credentials users are already validated by the backend in authorize()
      if (account?.provider === "credentials") return true;

      // Any Google account with a verified email may sign in. New users are
      // created in app_users as 'pending' by the backend /auth/google sync
      // and wait for the owner's approval. Owner promotion is gated solely
      // by OWNER_EMAILS on the backend.
      if (account?.provider === "google") {
        const emailVerified = (profile as { email_verified?: boolean } | undefined)
          ?.email_verified;
        // Google always sends email_verified for real accounts; deny only
        // when it is explicitly false (unverified) or the email is missing.
        if (!email || emailVerified === false) {
          console.warn(`Google sign-in denied for '${email}': email not verified`);
          return false;
        }
        return true;
      }

      return true;
    },

    // Runs at sign-in (when `user` and `account` are present) and on session
    // update(). The role in the token is only a UI hint; API routes ask the
    // backend for the current role on every call.
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        if (user.role) token.role = user.role;
        if (account?.provider === "credentials" && user.id) {
          token.appUserId = user.id;
        }
      }

      if (account?.provider === "google") {
        let synced: { id: string; role: AppRole } | null = null;

        if (account.id_token) {
          synced = await syncGoogleUserWithBackend(account.id_token);
        } else {
          console.error("Google sign-in without id_token - cannot sync backend");
        }

        if (synced) {
          token.appUserId = synced.id;
          token.role = synced.role;
        } else {
          // Backend unreachable/misconfigured: fall back to the frontend's
          // OWNER_EMAILS mirror so the owner isn't locked out, else pending.
          // With no appUserId, requireRole answers 503 for this owner (and
          // 403 for anyone else) until they sign in again.
          const owners = parseEmailList(process.env.OWNER_EMAILS);
          const email = (token.email || "").toLowerCase();
          delete token.appUserId;
          token.role = owners.includes(email) ? "owner" : "pending";
          console.warn(`Using fallback role '${token.role}' for ${email}`);
        }
      }

      const appUserId = token.appUserId as string | undefined;
      if (trigger === "update" && appUserId) {
        try {
          token.role = await refreshRole(appUserId);
        } catch {
          // Backend unavailable: keep the role we have.
        }
      }

      return token;
    },

    // Include email + role + app user id in session
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        session.user.role = token.role as AppRole | undefined;
        if (token.appUserId) session.user.id = token.appUserId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
