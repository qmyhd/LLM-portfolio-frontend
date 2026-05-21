'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { formatRelativeTime } from '@/lib/format';
import { directionTextColor } from '@/lib/colors';
import { stockHref } from '@/lib/bucket';

interface FeedItem {
  id: number;
  messageId: string;
  ticker: string | null;
  direction: 'bullish' | 'bearish' | 'neutral' | string;
  ideaText: string;
  author: string;
  channel: string;
  createdAt: string | null;
  labels: string[];
  confidence: number | null;
}

interface FeedResponse {
  items: FeedItem[];
  trendingTickers: string[];
}

const fetcher = async (url: string): Promise<FeedResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed fetch failed (${res.status})`);
  return res.json();
};

const DIRECTION_BG: Record<string, string> = {
  bullish: 'bg-profit/15',
  bearish: 'bg-loss/15',
  neutral: 'bg-foreground-muted/15',
};

const LABEL_COLOR: Record<string, string> = {
  TRADE_PLAN: 'bg-primary/15 text-primary',
  TRADE_EXECUTION: 'bg-profit/15 text-profit',
  TECHNICAL_ANALYSIS: 'bg-purple-500/15 text-purple-400',
  CATALYST_NEWS: 'bg-blue-500/15 text-blue-400',
  EARNINGS: 'bg-orange-500/15 text-orange-400',
  OPTIONS: 'bg-amber-500/15 text-amber-400',
};

function FeedCard({ item }: { item: FeedItem }) {
  const directionColor = directionTextColor(item.direction);
  const directionBg = DIRECTION_BG[item.direction] || DIRECTION_BG.neutral;
  const created = formatRelativeTime(item.createdAt);

  const labels = (item.labels || []).slice(0, 3);

  // Wrap the card in a Link only when we have a ticker to navigate to.
  const inner = (
    <article
      className={clsx(
        'card p-4 border-l-2 transition-colors hover:bg-background-hover',
        item.direction === 'bullish' && 'border-l-profit',
        item.direction === 'bearish' && 'border-l-loss',
        item.direction === 'neutral' && 'border-l-foreground-muted/40',
      )}
    >
      {/* Top row: ticker + direction chip + time */}
      <div className="flex items-center gap-2 mb-2">
        {item.ticker && (
          <span className="font-mono font-semibold text-base text-foreground">
            {item.ticker}
          </span>
        )}
        <span
          className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider',
            directionBg,
            directionColor,
          )}
        >
          {item.direction}
        </span>
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
        <span className="ml-auto text-xs text-foreground-muted">{created}</span>
      </div>

      {/* Idea text */}
      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
        {item.ideaText}
      </p>

      {/* Footer: author + channel */}
      <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
        <span>{item.author}</span>
        {item.channel && (
          <>
            <span className="opacity-40">·</span>
            <span>#{item.channel}</span>
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

interface ResearchFeedProps {
  /** How many ideas to load at most. Default 30. */
  limit?: number;
  /** How far back to look. Default 30 days. */
  days?: number;
}

/**
 * Home-page idea feed. Surfaces recent parsed Discord ideas across all
 * tickers, ordered newest-first, with a "trending tickers" strip above
 * for quick navigation.
 *
 * Replaces the previous IdeasPageContent embed on `/` — that component
 * is the manual idea-capture form, which lives at `/ideas`. The home
 * page now shows what was *actually said* recently, not the form.
 */
export function ResearchFeed({ limit = 30, days = 30 }: ResearchFeedProps) {
  const { data, error, isLoading } = useSWR<FeedResponse>(
    `/api/sentiment/feed?limit=${limit}&days=${days}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  return (
    <section className="space-y-4" aria-label="Recent ideas">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Ideas
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Latest Discord activity from the last {days} days
          </p>
        </div>
        <Link
          href="/ideas"
          className="text-xs text-primary hover:underline"
        >
          Add idea →
        </Link>
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
      {isLoading && <FeedSkeleton />}
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
            No parsed ideas in the last {days} days.
          </p>
          <p className="text-xs text-foreground-subtle mt-1">
            Send a message in the Discord channel and the parser will surface it here.
          </p>
        </div>
      )}
      {!isLoading && !error && (data?.items?.length ?? 0) > 0 && (
        <div className="space-y-3">
          {data!.items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
