'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Client-side NextAuth session context so components can read the signed-in
 * user's role (owner / family / guest / pending) via useSession() / usePrivacy().
 *
 * refetchOnWindowFocus is off: the role in the session is only a hint. It is
 * refreshed on sign-in and when the /pending page calls update() ("Check
 * again"), so there is no need to re-hit /api/auth/session on every focus.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}
