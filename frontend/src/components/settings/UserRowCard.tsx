'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatExactDateTime, formatTimeAgo } from '@/lib/format';
import { initialsFor, type UserView } from '@/lib/users-admin';
import type { AppUserRole } from '@/types/api';
import { ResetPasswordForm } from './ResetPasswordForm';
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  errorText,
  tagMuted,
  tagOwner,
  tagWarning,
  tagYou,
} from './styles';

type Confirm = 'decline' | 'delete' | 'revoke';

export interface UserRowActions {
  /** Each resolves true on success. The parent shows any error beside the row. */
  onRole: (role: AppUserRole) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onResetPassword: (password: string) => Promise<boolean>;
}

function Avatar({ user }: { user: UserView }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-full bg-background-hover object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary"
    >
      {initialsFor(user.name)}
    </span>
  );
}

function When({ label, iso }: { label: string; iso: string }) {
  return (
    <p className="text-xs text-foreground-muted mt-0.5">
      {label}{' '}
      <time dateTime={iso} title={formatExactDateTime(iso)}>
        {formatTimeAgo(iso)}
      </time>
    </p>
  );
}

export function UserRowCard({
  user,
  variant,
  busy,
  error,
  notice,
  actions,
}: {
  user: UserView;
  variant: 'waiting' | 'access';
  busy: boolean;
  error?: string;
  notice?: string;
  actions: UserRowActions;
}) {
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [resetting, setResetting] = useState(false);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const who = user.email || user.username || user.name;

  useEffect(() => {
    if (confirm) confirmButton.current?.focus();
  }, [confirm]);

  const ask = (kind: Confirm) => {
    opener.current = document.activeElement as HTMLElement | null;
    setConfirm(kind);
  };
  const cancel = () => {
    setConfirm(null);
    opener.current?.focus();
  };
  const run = async (task: () => Promise<boolean>) => {
    const ok = await task();
    if (!ok) {
      setConfirm(null);
      opener.current?.focus();
    }
  };

  const confirmText: Record<Confirm, string> = {
    decline: `Remove ${who}? They can sign in again and will be back in this list.`,
    delete: `Delete ${who}? This can't be undone.`,
    revoke: `Revoke access for ${who}? They'll go back to waiting for approval.`,
  };
  const confirmLabel: Record<Confirm, string> = {
    decline: 'Decline',
    delete: 'Delete',
    revoke: 'Revoke access',
  };
  const confirmTask: Record<Confirm, () => Promise<boolean>> = {
    decline: actions.onDelete,
    delete: actions.onDelete,
    revoke: () => actions.onRole('pending'),
  };

  return (
    <li
      className={`card p-4 ${variant === 'waiting' ? 'border-status-warning/40' : ''}`}
      aria-busy={busy}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar user={user} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-medium text-foreground break-words">{user.name}</p>
              {user.isYou && <span className={tagYou}>You</span>}
              {variant === 'access' && <span className={tagMuted}>{user.providerLabel}</span>}
              {variant === 'access' && user.role === 'owner' && <span className={tagOwner}>Owner</span>}
              {variant === 'waiting' && <span className={tagWarning}>Waiting</span>}
            </div>
            {user.secondary && (
              <p className="text-sm text-foreground-muted break-all">{user.secondary}</p>
            )}
            <When
              label={variant === 'waiting' ? 'Signed in' : 'Last seen'}
              iso={user.lastSeenAt}
            />
          </div>
        </div>

        {variant === 'access' && !user.isYou && user.role !== 'owner' && (
          <label className="flex items-center gap-2 text-xs text-foreground-muted sm:shrink-0">
            Role
            <select
              value={user.role}
              disabled={busy}
              aria-label={`Role for ${user.name}`}
              onChange={(e) => void actions.onRole(e.target.value as AppUserRole)}
              className="input min-h-[44px] sm:min-h-[40px] w-auto flex-1 sm:flex-none text-sm disabled:opacity-60"
            >
              <option value="guest">Guest</option>
              <option value="family">Family</option>
            </select>
          </label>
        )}
      </div>

      {confirm ? (
        <div
          role="group"
          aria-label="Confirm"
          className="mt-3 rounded-lg border border-border bg-background px-3 py-3"
        >
          <p className="text-sm text-foreground break-words">{confirmText[confirm]}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button type="button" onClick={cancel} disabled={busy} className={btnSecondary}>
              Cancel
            </button>
            <button
              ref={confirmButton}
              type="button"
              disabled={busy}
              onClick={() => void run(confirmTask[confirm])}
              className={btnDanger}
            >
              {confirmLabel[confirm]}
            </button>
          </div>
        </div>
      ) : variant === 'waiting' ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() => void actions.onRole('guest')}
            className={btnPrimary}
          >
            Approve as guest
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void actions.onRole('family')}
            className={btnPrimary}
          >
            Approve as family
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => ask('decline')}
            className={`${btnDanger} col-span-2 sm:col-span-1`}
          >
            Decline
          </button>
        </div>
      ) : (
        !user.isYou &&
        !resetting && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" disabled={busy} onClick={() => ask('revoke')} className={btnSecondary}>
              Revoke access
            </button>
            {user.provider === 'password' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setResetting(true)}
                className={btnSecondary}
              >
                Reset password
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => ask('delete')} className={btnDanger}>
              Delete
            </button>
          </div>
        )
      )}

      {resetting && !confirm && (
        <ResetPasswordForm
          user={user}
          busy={busy}
          onCancel={() => setResetting(false)}
          onSave={async (password) => {
            const ok = await actions.onResetPassword(password);
            if (ok) setResetting(false);
            return ok;
          }}
        />
      )}

      <div aria-live="polite">
        {busy && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Saving…
          </p>
        )}
        {!busy && error && <p className={errorText}>{error}</p>}
        {!busy && !error && notice && <p className="mt-2 text-xs text-gain">{notice}</p>}
      </div>
    </li>
  );
}
