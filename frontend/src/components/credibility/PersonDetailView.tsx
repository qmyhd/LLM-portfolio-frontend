'use client';

import { clsx } from 'clsx';
import { usePerson, usePersonRevisions } from '@/hooks/useCredibility';
import { Skeleton } from '@/components/ui/Skeleton';

const MATCH_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-profit/20 text-profit',
  suggested: 'bg-background-tertiary text-foreground-muted',
  unmatched: 'bg-status-warning/20 text-status-warning',
  conflict: 'bg-loss/20 text-loss',
  _default: 'bg-background-tertiary text-foreground-muted',
};

function matchBadge(status: string): string {
  return MATCH_STATUS_COLORS[status] ?? MATCH_STATUS_COLORS._default;
}

interface PersonDetailViewProps {
  personId: number | null;
  onEdit?: () => void;
  onClose?: () => void;
}

export function PersonDetailView({ personId, onEdit, onClose }: PersonDetailViewProps) {
  const { person, error, isLoading } = usePerson(personId);
  const { revisions, isLoading: revLoading } = usePersonRevisions(personId);

  if (personId == null) {
    return (
      <div className="p-4">
        <p className="text-sm text-foreground-muted">Select a person to view details.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton.Line className="h-5 w-40" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-3/4" />
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-sm text-loss">{error.message}</p>;
  }

  if (!person) {
    return <p className="p-4 text-sm text-foreground-muted">Person not found.</p>;
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{person.fullName}</h2>
          {person.role && <p className="text-sm text-foreground-muted">{person.role}</p>}
          {person.displayName && person.displayName !== person.fullName && (
            <p className="text-xs text-foreground-subtle">aka {person.displayName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded bg-background-tertiary text-foreground-muted uppercase tracking-wider">
            {person.status}
          </span>
          {onEdit && (
            <button onClick={onEdit} className="text-xs text-primary hover:underline">
              Edit
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-xs text-foreground-muted hover:text-foreground">
              Close
            </button>
          )}
        </div>
      </div>

      {person.bio && (
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-1">Bio</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{person.bio}</p>
        </div>
      )}

      {person.notes && (
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-1">Notes</p>
          <p className="text-sm text-foreground-muted whitespace-pre-wrap">{person.notes}</p>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-foreground-muted mb-1">Tiers</p>
        {person.tiers.length === 0 ? (
          <p className="text-xs text-foreground-subtle">No tiers assigned.</p>
        ) : (
          <ul className="space-y-1">
            {person.tiers.map((t, i) => (
              <li key={`${t.categorySlug}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="font-mono font-semibold w-6">{t.tier}</span>
                <span className="text-foreground-muted">{t.categorySlug}</span>
                {t.muted && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary text-foreground-muted">
                    muted
                  </span>
                )}
                {t.rationale && (
                  <span className="text-xs text-foreground-subtle truncate">— {t.rationale}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-foreground-muted mb-1">Identities</p>
        {person.identities.length === 0 ? (
          <p className="text-xs text-foreground-subtle">No linked identities.</p>
        ) : (
          <ul className="space-y-1">
            {person.identities.map((id) => (
              <li key={id.id} className="flex items-center gap-2 text-sm">
                <span className="text-foreground-muted">{id.platform}</span>
                <span className="font-mono text-foreground">{id.handle ?? id.platformUserId}</span>
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', matchBadge(id.matchStatus))}>
                  {id.matchStatus}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-foreground-muted mb-1">Revision history</p>
        {revLoading ? (
          <Skeleton.Line className="h-3 w-full" />
        ) : revisions.length === 0 ? (
          <p className="text-xs text-foreground-subtle">No revisions yet.</p>
        ) : (
          <ul className="space-y-1">
            {revisions.map((r, i) => (
              <li key={i} className="text-[11px] text-foreground-muted">
                {r.createdAt ? r.createdAt.slice(0, 19).replace('T', ' ') : 'unknown date'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
