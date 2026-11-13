'use client';

import { useCallback, useMemo, useState } from 'react';
import { splitUsers } from '@/lib/users-admin';
import type { AppUserRole, AppUserRow } from '@/types/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { changeRole, deleteUser, setPassword } from './usersApi';
import { UserRowCard, type RowOutcome } from './UserRowCard';
import { btnSecondary } from './styles';

interface RowState {
  busy: boolean;
  error?: string;
  notice?: string;
}

export function UsersTable({
  users,
  isLoading,
  error,
  onRetry,
  onChanged,
}: {
  users: AppUserRow[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  /** Called after every successful change; the page revalidates /api/users. */
  onChanged: () => Promise<unknown> | void;
}) {
  const [rows, setRows] = useState<Record<string, RowState>>({});

  const track = useCallback(
    async (id: string, task: () => Promise<unknown>, notice?: string): Promise<boolean> => {
      setRows((s) => ({ ...s, [id]: { busy: true } }));
      try {
        await task();
        await onChanged();
        setRows((s) => ({ ...s, [id]: { busy: false, notice } }));
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong. Try again.';
        setRows((s) => ({ ...s, [id]: { busy: false, error: message } }));
        return false;
      }
    },
    [onChanged],
  );

  const { waiting, withAccess } = useMemo(() => splitUsers(users ?? []), [users]);

  /** After a row leaves or moves, put focus on the heading it went to. */
  const focusHeading = (outcome: RowOutcome, fromWaiting: boolean) => {
    const target =
      outcome === 'revoke' || (outcome === 'decline' && fromWaiting)
        ? 'waiting-heading'
        : 'access-heading';
    requestAnimationFrame(() => {
      (document.getElementById(target) ?? document.getElementById('access-heading'))?.focus();
    });
  };

  if (isLoading && !users) {
    return (
      <div className="space-y-2" aria-label="Loading users" role="status">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-4">
            <Skeleton.ListItem />
          </div>
        ))}
      </div>
    );
  }

  if (!users) {
    return (
      <div
        role="alert"
        className="card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-loss">Couldn&apos;t load users. Try again.</p>
        <button type="button" onClick={onRetry} className={btnSecondary}>
          Try again
        </button>
      </div>
    );
  }

  const actionsFor = (id: string) => ({
    onRole: (role: AppUserRole) => track(id, () => changeRole(id, role)),
    onDelete: () => track(id, () => deleteUser(id)),
    onResetPassword: (password: string) =>
      track(id, () => setPassword(id, password), 'Password changed. Share it with them yourself.'),
  });

  return (
    <div className="space-y-8">
      {error ? (
        <div
          role="alert"
          className="card p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-status-warning">Couldn&apos;t refresh. Showing the last list.</p>
          <button type="button" onClick={onRetry} className={btnSecondary}>
            Try again
          </button>
        </div>
      ) : null}
      {waiting.length > 0 && (
        <section aria-labelledby="waiting-heading">
          <h2 id="waiting-heading" tabIndex={-1} className="outline-none text-lg font-semibold text-foreground mb-4">
            Waiting for approval ({waiting.length})
          </h2>
          <ul className="space-y-3">
            {waiting.map((u) => (
              <UserRowCard
                key={u.id}
                user={u}
                variant="waiting"
                busy={!!rows[u.id]?.busy}
                error={rows[u.id]?.error}
                notice={rows[u.id]?.notice}
                actions={actionsFor(u.id)}
                onLeft={(o) => focusHeading(o, true)}
              />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="access-heading">
        <h2 id="access-heading" tabIndex={-1} className="outline-none text-lg font-semibold text-foreground mb-4">
          People with access
        </h2>
        <ul className="space-y-2">
          {withAccess.map((u) => (
            <UserRowCard
              key={u.id}
              user={u}
              variant="access"
              busy={!!rows[u.id]?.busy}
              error={rows[u.id]?.error}
              notice={rows[u.id]?.notice}
              actions={actionsFor(u.id)}
              onLeft={(o) => focusHeading(o, false)}
            />
          ))}
        </ul>
        {withAccess.every((u) => u.isYou) && (
          <p className="mt-3 text-sm text-foreground-muted">No one else has access yet.</p>
        )}
      </section>
    </div>
  );
}
