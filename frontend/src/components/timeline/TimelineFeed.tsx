'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTimeline } from '@/hooks/useTimeline';
import { Skeleton } from '@/components/ui/Skeleton';
import { AttributionBadge, ReviewStatusChip, SourceBadge } from './badges';
import { CurationDrawer, type CurationTarget } from './CurationDrawer';
import type { IdeaSource, UserIdea } from '@/types/ideas';

const FIELD = 'bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm';

const SOURCE_FILTERS: { value: IdeaSource | ''; label: string }[] = [
  { value: '', label: 'All sources' },
  { value: 'imessage', label: 'iMessage' },
  { value: 'x', label: 'X / Twitter' },
  { value: 'discord', label: 'Discord' },
  { value: 'manual', label: 'Manual' },
  { value: 'transcribe', label: 'Voice' },
];

function dayKey(idea: UserIdea): string {
  const raw = idea.sourceCreatedAt ?? idea.createdAt;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function timeOf(idea: UserIdea): string {
  const raw = idea.sourceCreatedAt ?? idea.createdAt;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Chronological story view of imported (iMessage/X) and journal ideas,
 * grouped by day. Every card opens the curation drawer for corrections.
 */
export function TimelineFeed() {
  const [source, setSource] = useState<IdeaSource | ''>('');
  const [threadKey, setThreadKey] = useState('');
  const [author, setAuthor] = useState('');
  const [symbol, setSymbol] = useState('');
  const [target, setTarget] = useState<CurationTarget | null>(null);

  const { ideas, total, error, isLoading, refresh } = useTimeline({
    source,
    thread_key: threadKey.trim() || undefined,
    author: author.trim() || undefined,
    symbol: symbol.trim() || undefined,
    limit: 200,
  });

  const groups = useMemo(() => {
    const map = new Map<string, UserIdea[]>();
    for (const idea of ideas) {
      const key = dayKey(idea);
      const list = map.get(key) ?? [];
      list.push(idea);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [ideas]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={source} onChange={(e) => setSource(e.target.value as IdeaSource | '')} className={FIELD}>
          {SOURCE_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input value={threadKey} onChange={(e) => setThreadKey(e.target.value)} placeholder="Thread" className={FIELD} />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className={FIELD} />
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Ticker"
          className={`${FIELD} w-24 font-mono`}
        />
        <span className="text-xs text-foreground-muted ml-auto">{total} item{total === 1 ? '' : 's'}</span>
      </div>

      {error && <p className="text-sm text-loss">Couldn&apos;t load the timeline: {error.message}</p>}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton.Line key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !error && ideas.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground-muted">No timeline content yet.</p>
          <p className="text-xs text-foreground-subtle mt-1">
            Import iMessage/X exports with scripts/import_imazing_messages.py, or capture
            ideas manually on the Ideas page.
          </p>
        </div>
      )}

      {/* Day-grouped feed */}
      {groups.map(([day, dayIdeas]) => (
        <section key={day}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle sticky top-0 bg-background py-1.5 z-10">
            {day}
          </h3>
          <div className="space-y-2 mt-1">
            {dayIdeas.map((idea) => (
              <article key={idea.id} className="card p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <SourceBadge source={idea.source} />
                  <ReviewStatusChip status={idea.reviewStatus} />
                  <AttributionBadge kind={idea.attributionKind} />
                  {idea.author && (
                    <span className="text-xs text-foreground-muted">{idea.author}</span>
                  )}
                  {idea.threadKey && (
                    <span className="text-2xs text-foreground-subtle">#{idea.threadKey}</span>
                  )}
                  <span className="text-2xs text-foreground-subtle ml-auto tabular-nums">
                    {timeOf(idea)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTarget({ kind: 'idea', item: idea })}
                    className="text-2xs text-primary hover:underline"
                  >
                    Curate
                  </button>
                </div>
                {idea.title && (
                  <p className="text-sm font-medium text-foreground mt-1.5">{idea.title}</p>
                )}
                <p className="text-sm text-foreground-muted mt-1 line-clamp-3 whitespace-pre-wrap">
                  {idea.content}
                </p>
                {(idea.symbols.length > 0 || idea.tags.length > 0) && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {idea.symbols.map((s) => (
                      <Link
                        key={s}
                        href={`/stock/${s}`}
                        className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-2xs font-mono hover:bg-primary/20"
                      >
                        ${s}
                      </Link>
                    ))}
                    {idea.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-foreground-muted/10 text-foreground-muted text-2xs">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

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
