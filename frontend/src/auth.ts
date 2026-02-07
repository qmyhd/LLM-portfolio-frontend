/**
 * NextAuth.js v5 Configuration
 *
 * Implements Google Sign-In with email allowlist for single-user dashboard.
 * 
 * Required Environment Variables:
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - NEXTAUTH_SECRET: Secret for JWT signing (generate with: openssl rand -base64 32)
 * - ALLOWED_EMAILS: Comma-separated list of allowed email addresses
 * - API_SECRET_KEY: Backend API key for FastAPI authentication
 * - NEXT_PUBLIC_API_URL: Backend API URL (e.g., https://api.yourdomain.com)
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Parse allowed emails from environment variable
const getAllowedEmails = (): string[] => {
  const emails = process.env.ALLOWED_EMAILS || "";
  return emails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
};

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Verify email is in allowlist before allowing sign in
    async signIn({ user }) {
      const allowedEmails = getAllowedEmails();

      // If no allowlist configured, deny all (fail-safe)
      if (allowedEmails.length === 0) {
        console.error("ALLOWED_EMAILS not configured - denying sign in");
        return false;
      }

      const userEmail = user.email?.toLowerCase() || "";

      if (!allowedEmails.includes(userEmail)) {
        console.warn(`Sign-in denied for ${userEmail} - not in allowlist`);
        return false;
      }

      console.log(`Sign-in allowed for ${userEmail}`);
      return true;
    },

    // Include email in JWT token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },

    // Include email in session
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
