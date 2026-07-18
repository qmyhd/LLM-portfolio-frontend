'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { useUserIdeas } from '@/hooks/useUserIdeas';
import {
  curateParsedIdea,
  updateIdeaCuration,
  useParsedIdeasReview,
} from '@/hooks/useTimeline';
import { Skeleton } from '@/components/ui/Skeleton';
import { AttributionBadge, ReviewStatusChip, SourceBadge } from './badges';
import { CurationDrawer, type CurationTarget } from './CurationDrawer';
import type { ReviewStatus } from '@/types/ideas';

const FIELD = 'bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm';

type QueueKind = 'parsed' | 'imported';
type QueueFilter = 'unreviewed' | 'needs_review' | 'reviewed';

const KIND_TABS: { key: QueueKind; label: string }[] = [
  { key: 'parsed', label: 'Discord parses' },
  { key: 'imported', label: 'Imported ideas' },
];

const STATUS_TABS: { key: QueueFilter; label: string }[] = [
  { key: 'unreviewed', label: 'Unreviewed' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'reviewed', label: 'Reviewed' },
];

/**
 * Curation work queue. Two sources of truth:
 * - "Discord parses": raw NLP output (discord_parsed_ideas) — fix labels,
 *   symbols, and 13F attribution without re-running the model.
 * - "Imported ideas": iMessage/X/journal rows (user_ideas).
 *
 * Quick actions flip review status in one click; "Curate" opens the full
 * drawer. Items marked reviewed are frozen against NLP reparses.
 */
export function ReviewQueue() {
  const [kind, setKind] = useState<QueueKind>('parsed');
  const [status, setStatus] = useState<QueueFilter>('unreviewed');
  const [symbol, setSymbol] = useState('');
  const [target, setTarget] = useState<CurationTarget | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const parsed = useParsedIdeasReview(
    kind === 'parsed'
      ? { review_status: status, symbol: symbol.trim() || undefined, limit: 50 }
      : { limit: 1 }, // keep the hook mounted cheaply while inactive
  );
  const imported = useUserIdeas(
    kind === 'imported'
      ? { review_status: status, symbol: symbol.trim() || undefined, limit: 50 }
      : { limit: 1 },
  );

  const isLoading = kind === 'parsed' ? parsed.isLoading : imported.isLoading;
  const error = kind === 'parsed' ? parsed.error : imported.error;
  const total = kind === 'parsed' ? parsed.total : (imported.data?.total ?? 0);
  const refresh = () => {
    parsed.refresh();
    imported.refresh();
  };

  const quickSetStatus = async (
    itemKind: QueueKind,
    id: string,
    reviewStatus: ReviewStatus,
  ) => {
    setBusyId(id);
    setActionError('');
    try {
      if (itemKind === 'parsed') {
        await curateParsedIdea(id, { reviewStatus });
      } else {
        await updateIdeaCuration(id, { reviewStatus });
      }
      refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const QuickActions = ({ itemKind, id, current }: { itemKind: QueueKind; id: string; current: ReviewStatus }) => (
    <span className="flex items-center gap-2 ml-auto flex-shrink-0">
      {current !== 'reviewed' && (
        <button
          type="button"
          disabled={busyId === id}
          onClick={() => quickSetStatus(itemKind, id, 'reviewed')}
          className="text-2xs text-gain hover:underline disabled:opacity-50"
        >
          Mark reviewed
        </button>
      )}
      {current !== 'needs_review' && (
        <button
          type="button"
          disabled={busyId === id}
          onClick={() => quickSetStatus(itemKind, id, 'needs_review')}
          className="text-2xs text-status-warning hover:underline disabled:opacity-50"
        >
          Flag
        </button>
      )}
      {current !== 'unreviewed' && (
        <button
          type="button"
          disabled={busyId === id}
          onClick={() => quickSetStatus(itemKind, id, 'unreviewed')}
          className="text-2xs text-foreground-muted hover:underline disabled:opacity-50"
        >
          Re-open
        </button>
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Kind + status filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border overflow-hidden">
          {KIND_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setKind(t.key)}
              className={clsx(
                'px-3 py-1.5 text-sm transition-colors',
                kind === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-border overflow-hidden">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={clsx(
                'px-3 py-1.5 text-sm transition-colors',
                status === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Ticker"
          className={`${FIELD} w-24 font-mono`}
        />
        <span className="text-xs text-foreground-muted ml-auto">
          {total} item{total === 1 ? '' : 's'}
        </span>
      </div>

      {actionError && <p className="text-sm text-loss">{actionError}</p>}
      {error && <p className="text-sm text-loss">Couldn&apos;t load the queue: {error.message}</p>}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton.Line key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !error && kind === 'parsed' && parsed.items.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground-muted">Nothing in this queue.</p>
        </div>
      )}
      {!isLoading && !error && kind === 'imported' && (imported.data?.ideas?.length ?? 0) === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground-muted">Nothing in this queue.</p>
        </div>
      )}

      {/* Parsed Discord ideas */}
      {kind === 'parsed' && (
        <div className="space-y-2">
          {parsed.items.map((item) => (
            <article key={item.id} className="card p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <SourceBadge source="discord" />
                <ReviewStatusChip status={item.reviewStatus} />
                <AttributionBadge kind={item.attributionKind} />
                {item.primarySymbol && (
                  <span className="text-2xs font-mono text-primary">${item.primarySymbol}</span>
                )}
                {item.messageAuthor && (
                  <span className="text-xs text-foreground-muted">{item.messageAuthor}</span>
                )}
                <QuickActions itemKind="parsed" id={item.id} current={item.reviewStatus} />
                <button
                  type="button"
                  onClick={() => setTarget({ kind: 'parsed', item })}
                  className="text-2xs text-primary hover:underline flex-shrink-0"
                >
                  Curate
                </button>
              </div>
              <p className="text-sm text-foreground mt-1.5 line-clamp-2">
                {item.ideaSummary || item.ideaText || '—'}
              </p>
              {item.messageContent && item.messageContent !== item.ideaText && (
                <p className="text-xs text-foreground-subtle mt-1 line-clamp-2 whitespace-pre-wrap">
                  {item.messageContent}
                </p>
              )}
              {item.labels.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {item.labels.map((l) => (
                    <span key={l} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-2xs">
                      {l}
                    </span>
                  ))}
                  {item.thesisBucket && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-2xs">
                      {item.thesisBucket}
                    </span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Imported / journal ideas */}
      {kind === 'imported' && (
        <div className="space-y-2">
          {(imported.data?.ideas ?? []).map((idea) => (
            <article key={idea.id} className="card p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <SourceBadge source={idea.source} />
                <ReviewStatusChip status={idea.reviewStatus} />
                <AttributionBadge kind={idea.attributionKind} />
                {idea.author && <span className="text-xs text-foreground-muted">{idea.author}</span>}
                <QuickActions itemKind="imported" id={idea.id} current={idea.reviewStatus} />
                <button
                  type="button"
                  onClick={() => setTarget({ kind: 'idea', item: idea })}
                  className="text-2xs text-primary hover:underline flex-shrink-0"
                >
                  Curate
                </button>
              </div>
              <p className="text-sm text-foreground-muted mt-1.5 line-clamp-3 whitespace-pre-wrap">
                {idea.content}
              </p>
            </article>
          ))}
        </div>
      )}

      {target && (
        <CurationDrawer
          target={target}
          onClose={() => setTarget(null)}
          onSaved={() => {
            setTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
