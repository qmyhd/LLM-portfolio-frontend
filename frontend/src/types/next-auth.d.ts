/**
 * NextAuth module augmentation — adds the app role to User, Session, and JWT.
 *
 * Roles come from the backend `app_users` table for Google users (source of
 * truth), from the AUTH_USERS entry for credentials users, and gate write
 * access in src/middleware.ts:
 *   - owner:  everything, including /api/connections management
 *   - editor: all writes except connection/account management
 *   - viewer: read-only (GET)
 */
import type { DefaultSession } from "next-auth";

export type AppRole = "owner" | "editor" | "viewer";

declare module "next-auth" {
  interface Session {
    user: {
      role?: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
  }
}
