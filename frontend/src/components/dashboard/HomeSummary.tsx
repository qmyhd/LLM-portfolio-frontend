'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InboxStackIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { formatPercent } from '@/lib/format';
import { pnlTextColor } from '@/lib/colors';
import { usePrivacy } from '@/hooks/usePrivacy';
import type { ReturnSeriesResponse } from '@/types/api';
import type { ParsedIdeasListResponse, MoversResponse } from '@/types/ideas';

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

/**
 * Personalized "today" strip for the research home page.
 *
 * Percentage-first and size-free by construction, so it's identical for
 * viewers and owners — the only difference is the curation card ("awaiting
 * review"), which is hidden from read-only viewers who can't act on it.
 */
export function HomeSummary() {
  const { hideSizes, isViewer } = usePrivacy();

  const { data: series } = useSWR<ReturnSeriesResponse>(
    '/api/portfolio/return-series?period=ALL',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );
  const { data: movers } = useSWR<MoversResponse>(
    '/api/portfolio/movers?limit=1',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  );
  // Only owners/editors can curate, so only they need the review count.
  const { data: review } = useSWR<ParsedIdeasListResponse>(
    hideSizes ? null : '/api/parsed-ideas?review_status=unreviewed&limit=1',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  );

  const allTimeReturn = series?.periodReturnPct ?? null;
  const topMover =
    (movers?.topGainers?.[0] ?? movers?.topLosers?.[0]) || null;
  const topMoverPct = topMover?.dayChangePct ?? topMover?.openPnlPct ?? null;
  const awaiting = review?.total ?? 0;

  return (
    <section
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      aria-label="Today at a glance"
    >
      {/* Portfolio performance — percentage only, shown to everyone */}
      <Link
        href="/portfolio"
        className="card p-3 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-foreground-muted mb-1">
          {(allTimeReturn ?? 0) >= 0 ? (
            <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
          ) : (
            <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
          )}
          <span className="text-[11px] uppercase tracking-wider">Portfolio · all-time</span>
        </div>
        <p className={clsx('text-xl font-bold font-mono tabular-nums', pnlTextColor(allTimeReturn ?? 0))}>
          {allTimeReturn != null ? formatPercent(allTimeReturn, 1, { showSign: true }) : '—'}
        </p>
        <p className="text-[11px] text-foreground-subtle mt-0.5">Return on current holdings</p>
      </Link>

      {/* Top mover today — percentage move, shown to everyone */}
      <Link
        href={topMover ? `/stock/${topMover.symbol}` : '/portfolio'}
        className="card p-3 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-foreground-muted mb-1">
          <FireIcon className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider">Top mover</span>
        </div>
        {topMover ? (
          <>
            <p className="text-xl font-bold font-mono tabular-nums">
              <span className="mr-1.5">{topMover.symbol}</span>
              <span className={pnlTextColor(topMoverPct ?? 0)}>
                {topMoverPct != null ? formatPercent(topMoverPct, 1, { showSign: true }) : '—'}
              </span>
            </p>
            <p className="text-[11px] text-foreground-subtle mt-0.5">Biggest daily move</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold font-mono tabular-nums text-foreground-muted">—</p>
            <p className="text-[11px] text-foreground-subtle mt-0.5">No intraday data</p>
          </>
        )}
      </Link>

      {/* Research awaiting review — owner/editor only (viewers can't curate) */}
      {!isViewer && (
        <Link
          href="/timeline"
          className="card p-3 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-foreground-muted mb-1">
            <InboxStackIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Awaiting review</span>
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-foreground">{awaiting}</p>
          <p className="text-[11px] text-foreground-subtle mt-0.5">Unreviewed parsed ideas</p>
        </Link>
      )}

      {/* Ideas capture / research shortcut */}
      <Link
        href="/ideas"
        className="card p-3 hover:border-primary/30 transition-colors flex flex-col justify-center"
      >
        <span className="text-[11px] uppercase tracking-wider text-foreground-muted">Capture</span>
        <p className="text-sm font-semibold text-foreground mt-0.5">Log a new thesis</p>
        <p className="text-[11px] text-foreground-subtle mt-0.5">Add research to the journal</p>
      </Link>
    </section>
  );
}
