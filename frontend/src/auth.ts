/**
 * NextAuth.js v5 Configuration
 *
 * Implements Credentials login (username/password) and Google OAuth, and
 * syncs Google sign-ins to the FastAPI backend (`POST /auth/google`) which
 * verifies the Google ID token and upserts the user into `app_users`. The
 * backend's `app_users.role` is the source of truth for Google users' roles;
 * credentials users get their role from the AUTH_USERS entry.
 *
 * Required Environment Variables:
 * - NEXTAUTH_SECRET: Secret for JWT signing (generate with: openssl rand -base64 32)
 * - AUTH_USERS: Comma-separated username:password[:role] triples
 *   (e.g., admin:pass,friend1:pass2:viewer — role defaults to owner)
 * - API_SECRET_KEY: Backend API key for FastAPI authentication
 * - NEXT_PUBLIC_API_URL: Backend API URL (e.g., https://api.yourdomain.com)
 *
 * Optional (for Google OAuth):
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - OWNER_EMAILS: Emails promoted to 'owner'. Also the fallback owner grant
 *   when the backend is unreachable during sign-in (mirror the backend value).
 *
 * Signup is OPEN: any Google account with a verified email may sign in and is
 * created as a 'viewer'. There is no ALLOWED_EMAILS gate anymore.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { AppRole } from "@/types/next-auth";

const APP_ROLES: readonly string[] = ["owner", "editor", "viewer"];

interface AuthUser {
  password: string;
  role: AppRole;
}

// Parse credentials from AUTH_USERS env var.
// Format: "user1:pass1,user2:pass2:viewer". The trailing segment is treated
// as a role only when it is exactly owner/editor/viewer; otherwise it stays
// part of the password. Credentials users default to 'owner' (they are
// defined by the deployer) — give friend accounts an explicit :viewer/:editor.
const getAuthUsers = (): Map<string, AuthUser> => {
  const raw = process.env.AUTH_USERS || "";
  const users = new Map<string, AuthUser>();
  raw.split(",").forEach((pair) => {
    const parts = pair.split(":");
    if (parts.length < 2) return;
    const username = parts[0].trim().toLowerCase();

    let role: AppRole = "owner";
    let passwordParts = parts.slice(1);
    const last = parts[parts.length - 1].trim().toLowerCase();
    if (parts.length >= 3 && APP_ROLES.includes(last)) {
      role = last as AppRole;
      passwordParts = parts.slice(1, -1);
    }

    const password = passwordParts.join(":").trim();
    if (username && password) {
      users.set(username, { password, role });
    }
  });
  return users;
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
 * Returns the backend-assigned role, or null when the backend is
 * unavailable/misconfigured (callers fall back to OWNER_EMAILS / viewer).
 */
async function syncGoogleUserWithBackend(idToken: string): Promise<AppRole | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`Backend /auth/google returned ${res.status}`);
      return null;
    }

    const user = (await res.json()) as { role?: string };
    return APP_ROLES.includes(user.role || "") ? (user.role as AppRole) : null;
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
      const password = ((credentials?.password as string) || "").trim();

      if (!username || !password) return null;

      const users = getAuthUsers();
      const entry = users.get(username);

      if (!entry || entry.password !== password) {
        return null;
      }

      return {
        id: username,
        name: username,
        email: `${username}@local`,
        role: entry.role,
      };
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

      // Credentials users are already validated in authorize()
      if (email.endsWith("@local")) return true;

      // Open Google signup: any Google account with a verified email may
      // sign in. New users are created in app_users as 'viewer' by the
      // backend /auth/google sync — never elevated automatically. Owner
      // promotion is gated solely by OWNER_EMAILS on the backend.
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

    // Include email + role in JWT token. Runs once at sign-in (when `user`
    // and `account` are present) — the role is then carried by the JWT for
    // the session's 24h lifetime; role changes apply on next sign-in.
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        if (user.role) token.role = user.role;
      }

      if (account?.provider === "google") {
        let role: AppRole | null = null;

        if (account.id_token) {
          role = await syncGoogleUserWithBackend(account.id_token);
        } else {
          console.error("Google sign-in without id_token - cannot sync backend");
        }

        if (!role) {
          // Backend unreachable/misconfigured: fall back to the frontend's
          // OWNER_EMAILS mirror so the owner isn't locked out, else viewer.
          const owners = parseEmailList(process.env.OWNER_EMAILS);
          const email = (token.email || "").toLowerCase();
          role = owners.includes(email) ? "owner" : "viewer";
          console.warn(`Using fallback role '${role}' for ${email}`);
        }

        token.role = role;
      }

      return token;
    },

    // Include email + role in session
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        session.user.role = token.role as AppRole | undefined;
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
