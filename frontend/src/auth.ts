/**
 * NextAuth.js v5 Configuration
 *
 * Implements Credentials login (username/password) and Google OAuth.
 *
 * Required Environment Variables:
 * - NEXTAUTH_SECRET: Secret for JWT signing (generate with: openssl rand -base64 32)
 * - AUTH_USERS: Comma-separated username:password pairs (e.g., admin:pass,friend1:pass2)
 * - API_SECRET_KEY: Backend API key for FastAPI authentication
 * - NEXT_PUBLIC_API_URL: Backend API URL (e.g., https://api.yourdomain.com)
 *
 * Optional (for Google OAuth):
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - ALLOWED_EMAILS: Comma-separated list of allowed Google email addresses
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Parse credentials from AUTH_USERS env var
// Format: "user1:pass1,user2:pass2"
const getAuthUsers = (): Map<string, string> => {
  const raw = process.env.AUTH_USERS || "";
  const users = new Map<string, string>();
  raw.split(",").forEach((pair) => {
    const colonIdx = pair.indexOf(":");
    if (colonIdx === -1) return;
    const username = pair.slice(0, colonIdx).trim().toLowerCase();
    const password = pair.slice(colonIdx + 1).trim();
    if (username && password) {
      users.set(username, password);
    }
  });
  return users;
};

// Parse allowed emails from environment variable (for Google OAuth)
const getAllowedEmails = (): string[] => {
  const emails = process.env.ALLOWED_EMAILS || "";
  return emails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
};

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
      const storedPassword = users.get(username);

      if (!storedPassword || storedPassword !== password) {
        return null;
      }

      return {
        id: username,
        name: username,
        email: `${username}@local`,
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
    async signIn({ user }) {
      const email = user.email?.toLowerCase() || "";

      // Credentials users are already validated in authorize()
      if (email.endsWith("@local")) return true;

      // Google OAuth users: check email allowlist
      const allowedEmails = getAllowedEmails();

      if (allowedEmails.length === 0) {
        console.error("ALLOWED_EMAILS not configured - denying Google sign in");
        return false;
      }

      if (!allowedEmails.includes(email)) {
        console.warn(`Sign-in denied for ${email} - not in allowlist`);
        return false;
      }

      console.log(`Sign-in allowed for ${email}`);
      return true;
    },

    // Include email in JWT token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    // Include email in session
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
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
