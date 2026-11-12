/**
 * App roles and their ordering, shared by middleware.ts (edge) and the API
 * route guards in api-client.ts. No server-only imports here.
 *
 * Any role not in ROLE_RANK (the retired "viewer" and "editor", a typo, a
 * missing role) ranks 0 and is denied everything, read access included.
 * Unknown never means "allowed".
 */

import type { AppRole } from "@/types/next-auth";

export const ROLE_RANK: Record<AppRole, number> = {
  pending: 0,
  guest: 1,
  family: 1,
  owner: 3,
};

/** Rank of a session role. A missing or unknown role ranks 0. */
export function roleRank(role: string | null | undefined): number {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_RANK, role)) return 0;
  return ROLE_RANK[role as AppRole];
}

/** True when `role` meets or exceeds `min`. */
export function hasRole(role: string | null | undefined, min: AppRole): boolean {
  return roleRank(role) >= ROLE_RANK[min];
}

/** Chat is open to owner, family and guest; never while the session is loading. */
export function canChatFor(role: string | null | undefined, loading: boolean): boolean {
  if (loading) return false;
  return role === "owner" || role === "family" || role === "guest";
}
