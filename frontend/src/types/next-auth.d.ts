/**
 * NextAuth module augmentation — adds the app role to User, Session, and JWT.
 *
 * Roles come from the backend `app_users` table (source of truth) and gate
 * access in src/middleware.ts:
 *   - owner:   everything, including account and connection management
 *   - family:  sees the app and may use chat; no writes
 *   - guest:   sees the percentage-only view and may use chat; no writes
 *   - pending: signed in but not yet approved; sees nothing
 */
import type { DefaultSession } from "next-auth";

export type AppRole = "owner" | "family" | "guest" | "pending";

declare module "next-auth" {
  interface Session {
    user: {
      /** `app_users.id` */
      id?: string;
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
    appUserId?: string;
  }
}
