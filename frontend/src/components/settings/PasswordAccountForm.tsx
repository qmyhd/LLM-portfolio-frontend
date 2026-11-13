'use client';

import { useState } from 'react';
import {
  normaliseUsername,
  PASSWORD_RULE,
  USERNAME_RULE,
  validateNewAccount,
  type NewAccountRole,
} from '@/lib/users-admin';
import { createAccount } from './usersApi';
import { PasswordField } from './PasswordField';
import { btnPrimary, errorText, fieldInput, fieldLabel } from './styles';

export function PasswordAccountForm({ onCreated }: { onCreated: () => Promise<unknown> | void }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<NewAccountRole>('guest');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const normalised = normaliseUsername(username);
  const showNormalised = username !== '' && normalised !== username;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);
    const message = validateNewAccount({ username, password, confirm, role });
    setProblem(message);
    if (message) return;
    setBusy(true);
    try {
      await createAccount({ username: normalised, password, role });
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
      return;
    }
    // Created. Clear the secrets and say so, even if the list refresh fails.
    setUsername('');
    setPassword('');
    setConfirm('');
    setRole('guest');
    setProblem(null);
    setDone(true);
    try {
      await onCreated();
    } catch {
      // The list shows its own refresh banner; the account exists.
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-4" noValidate>
      <div>
        <label htmlFor="new-username" className={fieldLabel}>
          Username
        </label>
        <input
          id="new-username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          disabled={busy}
          aria-describedby="new-username-hint"
          onChange={(e) => setUsername(e.target.value)}
          className={fieldInput}
        />
        <p id="new-username-hint" className="mt-1 text-xs text-foreground-muted">
          {showNormalised ? (
            <>
              Will be saved as{' '}
              <span className="font-medium text-foreground break-all">{normalised}</span>.{' '}
            </>
          ) : null}
          {USERNAME_RULE}
        </p>
      </div>

      <div>
        <label htmlFor="new-role" className={fieldLabel}>
          Role
        </label>
        <select
          id="new-role"
          value={role}
          disabled={busy}
          onChange={(e) => setRole(e.target.value as NewAccountRole)}
          className={fieldInput}
        >
          <option value="guest">Guest</option>
          <option value="family">Family</option>
          <option value="owner">Owner</option>
        </select>
      </div>

      <div className="space-y-1">
        <PasswordField
          id="new-password"
          label="Password"
          value={password}
          onChange={setPassword}
          disabled={busy}
          describedBy="new-password-hint"
        />
        <p id="new-password-hint" className="text-xs text-foreground-muted">
          {PASSWORD_RULE}
        </p>
      </div>
      <PasswordField
        id="new-password-confirm"
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        disabled={busy}
      />

      <div aria-live="polite">
        {problem && <p className={errorText}>{problem}</p>}
        {done && !problem && (
          <p className="text-sm text-gain">
            Account created. Share the username and password with them yourself; the password
            can&apos;t be shown again.
          </p>
        )}
      </div>

      <button type="submit" disabled={busy} className={`${btnPrimary} w-full sm:w-auto`}>
        {busy ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}
