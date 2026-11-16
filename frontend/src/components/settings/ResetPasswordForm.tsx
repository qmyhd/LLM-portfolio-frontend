'use client';

import { useEffect, useRef, useState } from 'react';
import { validatePassword } from '@/lib/users-admin';
import type { UserView } from '@/lib/users-admin';
import { PasswordField } from './PasswordField';
import { btnPrimary, btnSecondary, errorText } from './styles';

/** Inline "new password" form for one password account. */
export function ResetPasswordForm({
  user,
  busy,
  onSave,
  onCancel,
}: {
  user: UserView;
  busy: boolean;
  /** Resolves true when the password was changed. */
  onSave: (password: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const first = useRef<HTMLDivElement>(null);
  const id = `reset-${user.id}`;

  useEffect(() => {
    first.current?.querySelector('input')?.focus();
  }, []);

  const cancel = () => {
    setPassword('');
    setConfirm('');
    onCancel();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = user.role === 'owner' ? 'owner' : 'guest';
    const message = validatePassword(password, confirm, role);
    setProblem(message);
    if (message) return;
    const ok = await onSave(password);
    if (ok) {
      setPassword('');
      setConfirm('');
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-border pt-3" noValidate>
      <div ref={first}>
        <PasswordField
          id={`${id}-new`}
          label="New password"
          value={password}
          onChange={setPassword}
          disabled={busy}
          describedBy={`${id}-hint`}
        />
      </div>
      <PasswordField
        id={`${id}-confirm`}
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        disabled={busy}
      />
      <p id={`${id}-hint`} className="text-xs text-foreground-muted">
        10+ characters; 14+ for an owner.
      </p>
      <div aria-live="polite">{problem && <p className={errorText}>{problem}</p>}</div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <button type="button" onClick={cancel} disabled={busy} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </div>
    </form>
  );
}
