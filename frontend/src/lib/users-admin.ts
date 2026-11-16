/**
 * Pure helpers for the owner's "Users and access" page: username and password
 * checks (the backend stays the authority), and the shaping of the user list.
 * Passwords are never trimmed, lower-cased or otherwise altered here.
 */

import type { AppUserRole, AppUserRow } from '@/types/api';

export type NewAccountRole = 'guest' | 'family' | 'owner';

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const PASSWORD_MIN = 10;
export const PASSWORD_MIN_OWNER = 14;
export const PASSWORD_MAX = 128;

export const USERNAME_RULE =
  '3 to 32 characters: letters, numbers, dot, dash or underscore, starting with a letter or number. Saved in lower case.';
export const PASSWORD_RULE = '10+ characters; 14+ for an owner.';

export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns a message, or null when the (normalised) username is acceptable. */
export function validateUsername(raw: string): string | null {
  const name = normaliseUsername(raw);
  if (!name) return 'Enter a username.';
  if (!USERNAME_PATTERN.test(name)) return `Username: ${USERNAME_RULE}`;
  return null;
}

/** Returns a message, or null. The password is checked exactly as typed. */
export function validatePassword(
  password: string,
  confirm: string,
  role: NewAccountRole,
): string | null {
  const length = [...password].length;
  if (password.trim() === '') return 'Enter a password.';
  const min = role === 'owner' ? PASSWORD_MIN_OWNER : PASSWORD_MIN;
  if (length < min) {
    return role === 'owner'
      ? `An owner password needs at least ${PASSWORD_MIN_OWNER} characters.`
      : `The password needs at least ${PASSWORD_MIN} characters.`;
  }
  if (length > PASSWORD_MAX) return `The password can be at most ${PASSWORD_MAX} characters.`;
  if (password !== confirm) return "The passwords don't match.";
  return null;
}

export function validateNewAccount(input: {
  username: string;
  password: string;
  confirm: string;
  role: NewAccountRole;
}): string | null {
  return (
    validateUsername(input.username) ??
    validatePassword(input.password, input.confirm, input.role)
  );
}

/** Full name, then username, then email. */
export function displayName(u: Pick<AppUserRow, 'fullName' | 'username' | 'email'>): string {
  return u.fullName?.trim() || u.username?.trim() || u.email;
}

export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0][0];
  return letters.toUpperCase();
}

export interface UserView extends AppUserRow {
  name: string;
  /** Email, or the username for a password account without one. */
  secondary: string;
  providerLabel: 'Google' | 'Password';
  isYou: boolean;
}

export const ROLE_LABELS: Record<AppUserRole, string> = {
  pending: 'Waiting',
  guest: 'Guest',
  family: 'Family',
  owner: 'Owner',
};

function toView(u: AppUserRow): UserView {
  return {
    ...u,
    name: displayName(u),
    secondary: u.email || u.username || '',
    providerLabel: u.provider === 'password' ? 'Password' : 'Google',
    isYou: u.isSelf,
  };
}

/** Pending users in one list, everyone else in the other; order is kept. */
export function splitUsers(users: AppUserRow[]): { waiting: UserView[]; withAccess: UserView[] } {
  const waiting: UserView[] = [];
  const withAccess: UserView[] = [];
  for (const u of users) (u.role === 'pending' ? waiting : withAccess).push(toView(u));
  return { waiting, withAccess };
}
