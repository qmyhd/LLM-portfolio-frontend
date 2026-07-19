'use client';

import { useSession } from 'next-auth/react';
import type { AppRole } from '@/types/next-auth';

export interface Privacy {
  role: AppRole | undefined;
  isOwner: boolean;
  isEditor: boolean;
  /** Read-only account — sees the percentage-only "vague report" view. */
  isViewer: boolean;
  /**
   * Hide absolute position sizes: share counts, order notionals, cash
   * balances, and any raw dollar total that would reveal portfolio size.
   * Per-security prices (share price, avg cost, execution price) are always
   * shown — they're public/intrinsic and reveal nothing about size.
   */
  hideSizes: boolean;
}

/**
 * Role-derived privacy posture for the current session.
 *
 * While the session is loading (role unknown) we default to the restricted
 * view so a viewer never briefly sees dollar sizes before the role resolves.
 * Owners and editors are trusted and see everything.
 */
export function usePrivacy(): Privacy {
  const { data, status } = useSession();
  const role = data?.user?.role;

  const isOwner = role === 'owner';
  const isEditor = role === 'editor';
  // Unknown/loading is treated as viewer (safe default).
  const isViewer = !isOwner && !isEditor;

  return {
    role,
    isOwner,
    isEditor,
    isViewer,
    hideSizes: status === 'loading' ? true : isViewer,
  };
}
