import type { AppUserRole, AppUserRow, UsersResponse } from '@/types/api';
import type { NewAccountRole } from '@/lib/users-admin';

export const USERS_KEY = '/api/users';

/** Throws an Error whose message is the backend's sentence, as returned. */
async function failure(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  return new Error(typeof body?.error === 'string' && body.error ? body.error : fallback);
}

async function send(path: string, method: string, body: unknown, fallback: string) {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw await failure(res, fallback);
  return res;
}

export async function fetchUsers(path: string): Promise<UsersResponse> {
  const res = await fetch(path);
  if (!res.ok) throw await failure(res, "Couldn't load users.");
  return res.json();
}

export async function changeRole(id: string, role: AppUserRole): Promise<AppUserRow> {
  const res = await send(`${USERS_KEY}/${encodeURIComponent(id)}`, 'PATCH', { role }, "Couldn't change the role.");
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  await send(`${USERS_KEY}/${encodeURIComponent(id)}`, 'DELETE', undefined, "Couldn't delete the user.");
}

export async function setPassword(id: string, password: string): Promise<void> {
  await send(
    `${USERS_KEY}/${encodeURIComponent(id)}/password`,
    'POST',
    { password },
    "Couldn't change the password.",
  );
}

export async function createAccount(input: {
  username: string;
  password: string;
  role: NewAccountRole;
}): Promise<AppUserRow> {
  const res = await send(USERS_KEY, 'POST', input, "Couldn't create the account.");
  return res.json();
}
