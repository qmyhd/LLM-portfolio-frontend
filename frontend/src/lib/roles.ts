/**
 * App roles and their ordering, shared by middleware.ts (edge) and the API
 * route guards in api-client.ts. No server-only imports here.
 *
 * Any role not in ROLE_RANK (for example a future "pending" role, or a
 * typo in AUTH_USERS) ranks 0 and is denied everything, read access
 * included. Unknown never means "allowed".
 */

import type { AppRole } from "@/types/next-auth";

export const ROLE_RANK: Record<AppRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

/** Rank of a session role. A missing role is treated as viewer (legacy sessions). */
export function roleRank(role: string | null | undefined): number {
  const r = (role ?? "viewer") as AppRole;
  return ROLE_RANK[r] ?? 0;
}

/** True when `role` meets or exceeds `min`. */
export function hasRole(role: string | null | undefined, min: AppRole): boolean {
  return roleRank(role) >= ROLE_RANK[min];
}
