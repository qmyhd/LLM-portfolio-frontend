'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';
import type { Position } from '@/types/api';
import { formatMoney, formatSignedPct } from '@/lib/format';
import { pnlTextColor, pnlBgColor } from '@/lib/colors';
import { COMPANY_NAMES } from '@/lib/mappers';
import { CardSpotlight } from '@/components/ui/CardSpotlight';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type SortMode = '1D' | '1W';

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Absolute day-change % for sorting — biggest movers first regardless of direction. */
function absDayChange(pos: Position): number {
  return Math.abs(pos.dayChangePercent ?? 0);
}

/** Absolute week-change % for sorting. */
function absWeekChange(pos: Position): number {
  return Math.abs(pos.weekChangePct ?? 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DailyMoversTable() {
  const { data, error, isLoading, refresh } = usePortfolio();
  const [sortMode, setSortMode] = useState<SortMode>('1D');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const bucket = useBucket();

  // Sort all positions by absolute change % (descending)
  const sortedPositions = useMemo(() => {
    const positions = data?.positions ?? [];
    const sorted = [...positions].sort((a, b) => {
      if (sortMode === '1W') {
        return absWeekChange(b) - absWeekChange(a);
      }
      return absDayChange(b) - absDayChange(a);
    });
    return sorted;
  }, [data?.positions, sortMode]);

  // Paginate
  const visiblePositions = sortedPositions.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPositions.length;

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <CardSpotlight className="card animate-pulse">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-5 w-40 bg-background-hover rounded" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 px-4 py-3">
              <div className="h-4 w-full bg-background-hover rounded" />
            </div>
          ))}
        </div>
      </CardSpotlight>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <CardSpotlight className="card p-5">
        <p className="text-loss text-sm mb-2">Failed to load movers</p>
        <p className="text-foreground-muted text-xs mb-3">{error.message}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Retry
        </button>
      </CardSpotlight>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  if (!sortedPositions.length) {
    return (
      <CardSpotlight className="card p-5 text-center">
        <p className="text-foreground-muted text-sm">No positions data</p>
      </CardSpotlight>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <CardSpotlight className="card overflow-hidden">
      {/* Header: title + sort toggle */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">
            Daily Movers
            <span className="ml-1.5 text-xs font-normal text-foreground-muted">
              ({sortedPositions.length})
            </span>
          </h2>
          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setSortMode(opt.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  sortMode === opt.value
                    ? 'bg-primary text-white'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-muted"
              >
                Symbol
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-foreground-muted"
              >
                Price
              </th>
              <th
                scope="col"
                className={clsx(
                  'px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider',
                  sortMode === '1D'
                    ? 'text-primary bg-primary/5'
                    : 'text-foreground-muted',
                )}
              >
                Day %
              </th>
              <th
                scope="col"
                className={clsx(
                  'hidden sm:table-cell px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider',
                  sortMode === '1W'
                    ? 'text-primary bg-primary/5'
                    : 'text-foreground-muted',
                )}
              >
                Week %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border stagger-fade-in">
            {visiblePositions.map(position => {
              const companyName =
                position.companyName || COMPANY_NAMES[position.symbol] || '';
              const dayPct = position.dayChangePercent ?? null;
              const weekPct = position.weekChangePct ?? null;

              return (
                <tr
                  key={position.symbol}
                  className="hover:bg-background-hover transition-colors"
                >
                  {/* Symbol + company name */}
                  <td className="px-3 py-2.5">
                    <Link
                      href={stockHref(position.symbol, bucket)}
                      className="hover:text-primary transition-colors"
                    >
                      <span className="font-mono font-semibold text-sm">
                        {position.symbol}
                      </span>
                      {companyName && (
                        <p className="text-[11px] text-foreground-muted truncate max-w-[120px]">
                          {companyName}
                        </p>
                      )}
                    </Link>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">
                    {formatMoney(position.currentPrice)}
                  </td>

                  {/* Day % */}
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-mono tabular-nums font-medium',
                        pnlTextColor(dayPct),
                        pnlBgColor(dayPct),
                      )}
                    >
                      {formatSignedPct(dayPct)}
                    </span>
                  </td>

                  {/* Week % — hidden on small screens */}
                  <td className="hidden sm:table-cell px-3 py-2.5 text-right">
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-mono tabular-nums font-medium',
                        pnlTextColor(weekPct),
                        pnlBgColor(weekPct),
                      )}
                    >
                      {formatSignedPct(weekPct)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: count + show more */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
        <p className="text-xs text-foreground-muted">
          {visiblePositions.length} of {sortedPositions.length}
        </p>
        {hasMore && (
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Show more
          </button>
        )}
      </div>
    </CardSpotlight>
  );
}
