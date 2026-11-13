import { hasRole } from "@/lib/roles";

/** What the /pending page does after asking the server to re-read the role. */
export type CheckStep = "enter" | "still-pending" | "failed";

type SessionLike = { user?: { role?: string | null } } | null | undefined;

/** Decide from the refreshed session. No session means the check failed. */
export function nextStepAfterCheck(session: SessionLike): CheckStep {
  if (!session) return "failed";
  return hasRole(session.user?.role, "guest") ? "enter" : "still-pending";
}

/**
 * Ask the server for a fresh role. next-auth's `update()` only sends the POST
 * that triggers the jwt callback's `trigger === "update"` branch when it is
 * given an argument; called bare it is a plain GET and re-reads nothing. So
 * always pass one (`{}`).
 */
export async function checkAgain(
  update: (data: unknown) => Promise<SessionLike>
): Promise<CheckStep> {
  try {
    return nextStepAfterCheck(await update({}));
  } catch {
    return "failed";
  }
}

/** "Signed in as" text: password accounts have a synthetic `name@local` email. */
export function signedInLabel(
  user: { email?: string | null; name?: string | null } | undefined
): string | null {
  const email = user?.email;
  if (email) return email.endsWith("@local") ? email.slice(0, -"@local".length) : email;
  return user?.name || null;
}
