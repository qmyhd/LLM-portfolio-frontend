'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { formatRelativeTime, formatNumber } from '@/lib/format';
import { directionTextColor } from '@/lib/colors';
import { stockHref } from '@/lib/bucket';

interface FeedLevel {
  kind: string | null;
  value: number | null;
  low: number | null;
  high: number | null;
  qualifier: string | null;
}

interface FeedItem {
  id: string;
  source: 'parsed' | 'raw' | string;
  messageId: string;
  ticker: string | null;
  tickers: string[];
  direction: 'bullish' | 'bearish' | 'neutral' | 'mixed' | string;
  ideaText: string;
  author: string;
  channel: string;
  channelType: string | null;
  createdAt: string | null;
  labels: string[];
  confidence: number | null;
  sentimentScore: number | null;
  action: string | null;
  instrument: string | null;
  levels: FeedLevel[];
}

interface FeedResponse {
  items: FeedItem[];
  trendingTickers: string[];
  parsedCount: number;
  rawCount: number;
}

type ChannelFilter = 'all' | 'trading' | 'market';
type SourceFilter = 'all' | 'parsed' | 'raw';

const fetcher = async (url: string): Promise<FeedResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed fetch failed (${res.status})`);
  return res.json();
};

const DIRECTION_BG: Record<string, string> = {
  bullish: 'bg-profit/15',
  bearish: 'bg-loss/15',
  neutral: 'bg-foreground-muted/15',
  mixed: 'bg-amber-500/15',
};

const LABEL_COLOR: Record<string, string> = {
  TRADE_PLAN: 'bg-primary/15 text-primary',
  TRADE_EXECUTION: 'bg-profit/15 text-profit',
  TECHNICAL_ANALYSIS: 'bg-purple-500/15 text-purple-400',
  CATALYST_NEWS: 'bg-blue-500/15 text-blue-400',
  EARNINGS: 'bg-orange-500/15 text-orange-400',
  OPTIONS: 'bg-amber-500/15 text-amber-400',
};

const ACTION_COLOR: Record<string, string> = {
  buy: 'bg-profit/20 text-profit',
  add: 'bg-profit/20 text-profit',
  sell: 'bg-loss/20 text-loss',
  trim: 'bg-loss/20 text-loss',
  hold: 'bg-foreground-muted/15 text-foreground-muted',
  watch: 'bg-blue-500/15 text-blue-400',
};

function levelLabel(level: FeedLevel): string {
  // "entry $182.50", "target $195-$210", "stop ~$170"
  const kind = (level.kind || 'level').toLowerCase();
  if (level.value != null) {
    const prefix = level.qualifier ? `${level.qualifier} ` : '';
    return `${kind} ${prefix}$${formatNumber(level.value)}`;
  }
  if (level.low != null && level.high != null) {
    return `${kind} $${formatNumber(level.low)}–$${formatNumber(level.high)}`;
  }
  if (level.low != null) return `${kind} ≥ $${formatNumber(level.low)}`;
  if (level.high != null) return `${kind} ≤ $${formatNumber(level.high)}`;
  return kind;
}

function FeedCard({ item }: { item: FeedItem }) {
  const directionColor = directionTextColor(item.direction);
  const directionBg = DIRECTION_BG[item.direction] || DIRECTION_BG.neutral;
  const created = formatRelativeTime(item.createdAt);
  const isParsed = item.source === 'parsed';

  const labels = (item.labels || []).slice(0, 3);
  const levels = (item.levels || []).slice(0, 4);
  const action = item.action?.toLowerCase() || null;

  const inner = (
    <article
      className={clsx(
        'card p-4 border-l-2 transition-colors hover:bg-background-hover',
        item.direction === 'bullish' && 'border-l-profit',
        item.direction === 'bearish' && 'border-l-loss',
        item.direction === 'neutral' && 'border-l-foreground-muted/40',
        item.direction === 'mixed' && 'border-l-amber-500/60',
      )}
    >
      {/* Top row: ticker + direction chip + action chip + source pill + time */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {item.ticker && (
          <span className="font-mono font-semibold text-base text-foreground">
            {item.ticker}
          </span>
        )}
        {/* Secondary tickers shown faintly when the item mentions multiple */}
        {item.tickers
          .filter((t) => t !== item.ticker)
          .slice(0, 3)
          .map((t) => (
            <span
              key={t}
              className="font-mono text-xs text-foreground-muted"
            >
              {t}
            </span>
          ))}
        <span
          className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider',
            directionBg,
            directionColor,
          )}
        >
          {item.direction}
        </span>
        {action && (
          <span
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
              ACTION_COLOR[action] || 'bg-background-tertiary text-foreground-muted',
            )}
          >
            {action}
          </span>
        )}
        {labels.map((label) => (
          <span
            key={label}
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
              LABEL_COLOR[label] || 'bg-background-tertiary text-foreground-muted',
            )}
            title={label}
          >
            {label.replace(/_/g, ' ').toLowerCase()}
          </span>
        ))}
        {/* Source pill: makes it obvious which items were NLP-parsed */}
        <span
          className={clsx(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
            isParsed
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-background-tertiary text-foreground-muted',
          )}
          title={isParsed ? 'NLP-parsed idea' : 'Raw Discord message'}
        >
          {isParsed ? 'parsed' : 'raw'}
        </span>
        <span className="ml-auto text-xs text-foreground-muted">{created}</span>
      </div>

      {/* Idea / message text */}
      <p
        className={clsx(
          'text-sm leading-relaxed',
          isParsed ? 'text-foreground line-clamp-3' : 'text-foreground/90 line-clamp-4 whitespace-pre-wrap',
        )}
      >
        {item.ideaText}
      </p>

      {/* Levels strip (parsed only) */}
      {levels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {levels.map((lvl, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-background-tertiary text-[11px] font-mono text-foreground-muted"
            >
              {levelLabel(lvl)}
            </span>
          ))}
        </div>
      )}

      {/* Footer: author + channel + sentiment numeric (raw) */}
      <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
        <span>{item.author}</span>
        {item.channel && (
          <>
            <span className="opacity-40">·</span>
            <span>#{item.channel}</span>
          </>
        )}
        {!isParsed && item.sentimentScore != null && Math.abs(item.sentimentScore) > 0.05 && (
          <>
            <span className="opacity-40">·</span>
            <span
              className={clsx(
                'font-mono',
                item.sentimentScore > 0.2
                  ? 'text-profit'
                  : item.sentimentScore < -0.2
                    ? 'text-loss'
                    : 'text-foreground-muted',
              )}
              title="VADER compound sentiment score"
            >
              {item.sentimentScore > 0 ? '+' : ''}
              {item.sentimentScore.toFixed(2)}
            </span>
          </>
        )}
        {isParsed && item.confidence != null && (
          <>
            <span className="opacity-40">·</span>
            <span className="font-mono" title="Parser confidence">
              conf {Math.round(item.confidence * 100)}%
            </span>
          </>
        )}
      </div>
    </article>
  );

  if (item.ticker) {
    return <Link href={stockHref(item.ticker, null)}>{inner}</Link>;
  }
  return inner;
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse space-y-2">
          <div className="flex gap-2">
            <div className="h-4 w-12 bg-background-hover rounded" />
            <div className="h-4 w-16 bg-background-hover rounded" />
          </div>
          <div className="h-4 w-full bg-background-hover rounded" />
          <div className="h-4 w-3/4 bg-background-hover rounded" />
        </div>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-primary/15 text-primary border border-primary/40'
          : 'bg-background-secondary text-foreground-muted border border-border hover:text-foreground hover:bg-background-hover',
      )}
    >
      <span>{label}</span>
      {count != null && (
        <span className="text-[10px] opacity-70 font-mono">{count}</span>
      )}
    </button>
  );
}

interface ResearchFeedProps {
  /** How many ideas to load at most. Default 30. */
  limit?: number;
  /** How far back to look. Default 30 days. */
  days?: number;
}

/**
 * Home-page research feed. Surfaces recent Discord activity — both
 * NLP-parsed ideas and raw messages with auto-extracted tickers + VADER
 * sentiment — so a stuck NLP batch doesn't leave the page empty.
 *
 * Filters by channel type (trading picks vs market news) and by source
 * (parsed vs raw), each as a single-select chip row. Filter state is
 * local component state — not URL-synced — since this widget is embedded
 * on `/` and we don't want it polluting the URL with sub-page filters.
 */
export function ResearchFeed({ limit = 30, days = 30 }: ResearchFeedProps) {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('days', String(days));
  if (channelFilter !== 'all') params.set('channel_type', channelFilter);
  if (sourceFilter !== 'all') params.set('source', sourceFilter);

  const { data, error, isLoading } = useSWR<FeedResponse>(
    `/api/sentiment/feed?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000, keepPreviousData: true },
  );

  return (
    <section className="space-y-4" aria-label="Recent ideas">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Ideas
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Discord activity from the last {days} days
            {data && ` · ${data.parsedCount} parsed · ${data.rawCount} raw`}
          </p>
        </div>
        <Link
          href="/ideas"
          className="text-xs text-primary hover:underline"
        >
          Add idea →
        </Link>
      </div>

      {/* Filter chips: channel + source */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-foreground-muted font-semibold mr-1">
            Channel
          </span>
          <FilterChip
            active={channelFilter === 'all'}
            label="All"
            onClick={() => setChannelFilter('all')}
          />
          <FilterChip
            active={channelFilter === 'trading'}
            label="Trading picks"
            onClick={() => setChannelFilter('trading')}
          />
          <FilterChip
            active={channelFilter === 'market'}
            label="Market news"
            onClick={() => setChannelFilter('market')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-foreground-muted font-semibold mr-1">
            Source
          </span>
          <FilterChip
            active={sourceFilter === 'all'}
            label="All"
            count={data ? data.parsedCount + data.rawCount : undefined}
            onClick={() => setSourceFilter('all')}
          />
          <FilterChip
            active={sourceFilter === 'parsed'}
            label="Parsed"
            count={data?.parsedCount}
            onClick={() => setSourceFilter('parsed')}
          />
          <FilterChip
            active={sourceFilter === 'raw'}
            label="Raw"
            count={data?.rawCount}
            onClick={() => setSourceFilter('raw')}
          />
        </div>
      </div>

      {/* Trending tickers strip */}
      {data?.trendingTickers && data.trendingTickers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.trendingTickers.map((ticker) => (
            <Link
              key={ticker}
              href={stockHref(ticker, null)}
              className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-background-secondary border border-border text-foreground hover:bg-background-hover hover:border-primary/40 transition-colors"
            >
              {ticker}
            </Link>
          ))}
        </div>
      )}

      {/* Feed */}
      {isLoading && !data && <FeedSkeleton />}
      {error && (
        <div className="card p-6 text-center">
          <p className="text-sm text-loss">Couldn&apos;t load the feed.</p>
          <p className="text-xs text-foreground-muted mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}
      {!isLoading && !error && (data?.items?.length ?? 0) === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No Discord activity matches these filters in the last {days} days.
          </p>
          <p className="text-xs text-foreground-subtle mt-1">
            Try widening the filters, or send a message in Discord and it&apos;ll show up here.
          </p>
        </div>
      )}
      {!error && (data?.items?.length ?? 0) > 0 && (
        <div className="space-y-3">
          {data!.items.map((item) => (
            <FeedCard key={`${item.source}:${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
