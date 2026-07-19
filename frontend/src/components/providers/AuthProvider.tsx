'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Client-side NextAuth session context so components can read the signed-in
 * user's role (owner / editor / viewer) via useSession() / usePrivacy().
 *
 * refetchOnWindowFocus is off: the role only changes on re-login, so there's
 * no reason to re-hit /api/auth/session every time the tab regains focus.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}
