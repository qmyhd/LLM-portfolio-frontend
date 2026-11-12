'use client';

import { useSession } from 'next-auth/react';
import { canChatFor } from '@/lib/roles';
import type { AppRole } from '@/types/next-auth';

export interface Privacy {
  role: AppRole | undefined;
  isOwner: boolean;
  /** Anyone who is not the owner: sees the percentage-only "vague report" view. */
  isGuestView: boolean;
  /**
   * Hide absolute position sizes: share counts, order notionals, cash
   * balances, and any raw dollar total that would reveal portfolio size.
   * Per-security prices (share price, avg cost, execution price) are always
   * shown — they're public/intrinsic and reveal nothing about size.
   */
  hideSizes: boolean;
  /**
   * Whether this session may perform writes (capture ideas, notes, curate,
   * edit profiles, manage connections). Owner only. Everyone else gets
   * read-only affordances instead of buttons that would 403 server-side.
   * Defaults to false while the session is loading.
   */
  canWrite: boolean;
  /**
   * Whether this session may use chat: owner, family and guest. Defaults to
   * false while the session is loading.
   */
  canChat: boolean;
}

/**
 * Role-derived privacy posture for the current session.
 *
 * While the session is loading (role unknown) we default to the restricted
 * view so a guest never briefly sees dollar sizes before the role resolves.
 * Only the owner sees everything.
 */
export function usePrivacy(): Privacy {
  const { data, status } = useSession();
  const role = data?.user?.role;
  const loading = status === 'loading';

  const isOwner = role === 'owner';
  const isGuestView = !isOwner;

  return {
    role,
    isOwner,
    isGuestView,
    hideSizes: loading ? true : isGuestView,
    canWrite: loading ? false : isOwner,
    canChat: canChatFor(role, loading),
  };
}
