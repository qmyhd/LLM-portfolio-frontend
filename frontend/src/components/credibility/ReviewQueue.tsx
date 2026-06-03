'use client';

import { useState } from 'react';
import { useUnmatchedIdentities } from '@/hooks/useCredibility';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PersonListItem } from '@/types/credibility';

// matchStatus badge colors (mirrors the convention used elsewhere in the
// credibility UI / AnalysisPanel signal colors).
const MATCH_BADGE: Record<string, string> = {
  confirmed: 'text-green-400 bg-green-500/15',
  suggested: 'text-zinc-400 bg-zinc-500/15',
  unmatched: 'text-yellow-400 bg-yellow-500/15',
  conflict: 'text-red-400 bg-red-500/15',
};

interface ReviewQueueProps {
  people: PersonListItem[];
  onLinked?: () => void;
}

/**
 * Unmatched-identity review queue. Lists flagged source_identities
 * (suggested/unmatched/conflict) plus recent Discord authors with parsed ideas
 * but no confirmed identity, and lets the user link each to an existing person.
 * Renders cleanly when empty (expected before any data exists).
 */
export function ReviewQueue({ people, onLinked }: ReviewQueueProps) {
  const { unmatched, isLoading, refresh } = useUnmatchedIdentities();
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const keyFor = (platform: string, puid: string) => `${platform}:${puid}`;

  const link = async (platform: string, platformUserId: string, handle: string | null) => {
    const k = keyFor(platform, platformUserId);
    const personId = targets[k];
    if (!personId) return;
    setBusyKey(k);
    setErrors((e) => ({ ...e, [k]: '' }));
    try {
      const res = await fetch(`/api/people/${personId}/identities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, platformUserId, handle }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          res.status === 409
            ? data.error || 'Already linked to another person.'
            : data.error || `Link failed (${res.status})`;
        setErrors((e) => ({ ...e, [k]: msg }));
        return;
      }
      await refresh();
      onLinked?.();
    } catch {
      setErrors((e) => ({ ...e, [k]: 'Link failed.' }));
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card p-4">
        <Skeleton.Line className="h-4 w-40" />
      </div>
    );
  }

  if (unmatched.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-foreground-muted">Nothing to review — all sources attributed.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Review queue ({unmatched.length})</h2>
      <ul className="space-y-2">
        {unmatched.map((item, i) => {
          const k = keyFor(item.platform, item.platformUserId);
          return (
            <li
              key={`${k}-${i}`}
              className="flex items-center justify-between gap-3 flex-wrap border-b border-border pb-2 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs px-1.5 py-0.5 rounded bg-background-hover text-foreground-muted">
                  {item.platform}
                </span>
                <span className="font-mono text-sm truncate">{item.handle || item.platformUserId}</span>
                {item.matchStatus ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      MATCH_BADGE[item.matchStatus] || MATCH_BADGE.suggested
                    }`}
                  >
                    {item.matchStatus}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-400">
                    no identity
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={targets[k] ?? ''}
                  onChange={(e) => setTargets((t) => ({ ...t, [k]: e.target.value }))}
                  className="bg-background-secondary border border-border rounded-md px-2 py-1 text-xs"
                >
                  <option value="">Link to…</option>
                  {people.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!targets[k] || busyKey === k}
                  onClick={() => link(item.platform, item.platformUserId, item.handle)}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {busyKey === k ? 'Linking…' : 'Link'}
                </button>
              </div>
              {errors[k] && <p className="w-full text-xs text-loss">{errors[k]}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
