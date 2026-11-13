/** Pure helpers for the login form. */

const MESSAGES: Record<string, string> = {
  locked: "Too many wrong passwords. Try again in 15 minutes.",
  rate_limited: "Too many sign-in attempts. Wait a minute and try again.",
  unavailable: "Can't reach the server right now. Try again in a moment.",
};

export const INVALID_MESSAGE = "Invalid username or password";

/** Sentence for the `code` that signIn(..., { redirect: false }) returns. */
export function loginErrorMessage(code: string | null | undefined): string {
  if (code && Object.prototype.hasOwnProperty.call(MESSAGES, code)) return MESSAGES[code];
  return INVALID_MESSAGE;
}

/**
 * Credentials sent to signIn. The username is trimmed (the backend lower-cases
 * it too); the password is NEVER altered, because the backend hashes the exact
 * string the person typed.
 */
export function buildCredentials(username: string, password: string) {
  return { username: username.trim(), password };
}
