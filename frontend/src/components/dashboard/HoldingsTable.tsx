'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio, useSparklines } from '@/hooks';
import type { Position } from '@/types/api';
import { formatMoney, formatPercent, formatSignedMoney, formatQuantity } from '@/lib/format';
import { pnlTextColor, pnlBgColor } from '@/lib/colors';
import { COMPANY_NAMES } from '@/lib/mappers';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { MiniSparkline } from '@/components/ui/MiniSparkline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'symbol' | 'equity' | 'currentPrice' | 'quantity' | 'averageBuyPrice' | 'openPnlPercent' | 'dayChange';
type SortDir = 'asc' | 'desc';
type AssetFilter = 'all' | 'equity' | 'etf';

const PAGE_SIZE = 10;
const LS_SORT_KEY = 'holdings-sort-key';
const LS_SORT_DIR = 'holdings-sort-dir';
const LS_FILTER = 'holdings-filter';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: SortKey;
  label: string;
  shortLabel?: string;
  align: 'left' | 'right';
  /** Tailwind classes to hide on smaller breakpoints */
  hideClass?: string;
  sortable: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'symbol', label: 'Symbol', align: 'left', sortable: true },
  { key: 'equity', label: 'Market Value', shortLabel: 'Value', align: 'right', sortable: true },
  { key: 'openPnlPercent', label: 'P/L %', align: 'right', sortable: true },
  { key: 'quantity', label: 'Qty', align: 'right', hideClass: 'hidden sm:table-cell', sortable: true },
  { key: 'averageBuyPrice', label: 'Avg Cost', align: 'right', hideClass: 'hidden md:table-cell', sortable: true },
  { key: 'currentPrice', label: 'Price', align: 'right', hideClass: 'hidden md:table-cell', sortable: true },
  { key: 'dayChange', label: "Today", align: 'right', hideClass: 'hidden lg:table-cell', sortable: true },
];

// ---------------------------------------------------------------------------
// Sort icon
// ---------------------------------------------------------------------------

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return null;
  return sortDir === 'asc' ? (
    <ChevronUpIcon className="w-3.5 h-3.5 inline ml-0.5" />
  ) : (
    <ChevronDownIcon className="w-3.5 h-3.5 inline ml-0.5" />
  );
}

// ---------------------------------------------------------------------------
// Filter pills
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { value: AssetFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'equity', label: 'Stocks' },
  { value: 'etf', label: 'ETFs' },
];

// ---------------------------------------------------------------------------
// Sorting helper
// ---------------------------------------------------------------------------

function getSortValue(position: Position, key: SortKey): number | string {
  switch (key) {
    case 'symbol': return position.symbol;
    case 'equity': return position.equity;
    case 'currentPrice': return position.currentPrice;
    case 'quantity': return position.quantity;
    case 'averageBuyPrice': return position.averageBuyPrice ?? 0;
    case 'openPnlPercent': return position.openPnlPercent;
    case 'dayChange': return position.dayChange ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HoldingsTable() {
  const { data, error, isLoading, refresh } = usePortfolio();
  const { sparklinesMap } = useSparklines('1M');

  // Persisted sort state
  const [sortKey, setSortKey] = useState<SortKey>('equity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState<AssetFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const sk = localStorage.getItem(LS_SORT_KEY) as SortKey | null;
      const sd = localStorage.getItem(LS_SORT_DIR) as SortDir | null;
      const f = localStorage.getItem(LS_FILTER) as AssetFilter | null;
      if (sk) setSortKey(sk);
      if (sd) setSortDir(sd);
      if (f) setFilter(f);
    } catch { /* SSR / private browsing */ }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_SORT_KEY, sortKey);
      localStorage.setItem(LS_SORT_DIR, sortDir);
      localStorage.setItem(LS_FILTER, filter);
    } catch { /* ignore */ }
  }, [sortKey, sortDir, filter]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'symbol' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  // Filter out crypto (always separate), then apply asset filter
  const filteredPositions = useMemo(() => {
    const positions = data?.positions ?? [];
    return positions.filter(p => {
      const at = (p.assetType ?? '').toLowerCase();
      // Always exclude crypto — shown in dedicated CryptoSection
      if (at === 'crypto' || at === 'cryptocurrency') return false;
      if (filter === 'all') return true;
      if (filter === 'equity') return at === 'equity' || at === 'adr' || !p.assetType;
      if (filter === 'etf') return at === 'etf';
      return true;
    });
  }, [data?.positions, filter]);

  // Sort
  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [filteredPositions, sortKey, sortDir]);

  // Paginate
  const visiblePositions = sortedPositions.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPositions.length;

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <CardSpotlight className="card animate-pulse">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-5 w-32 bg-background-hover rounded" />
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

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <CardSpotlight className="card p-5">
        <p className="text-loss text-sm mb-2">Failed to load positions</p>
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

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  if (!filteredPositions.length && filter === 'all') {
    return (
      <CardSpotlight className="card p-5 text-center">
        <p className="text-foreground-muted text-sm">No positions</p>
      </CardSpotlight>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <CardSpotlight className="card overflow-hidden">
      {/* Header: title + filter pills */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">
            Holdings
            <span className="ml-1.5 text-xs font-normal text-foreground-muted">
              ({sortedPositions.length})
            </span>
          </h2>
          <div className="flex items-center gap-1">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  filter === opt.value
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
              {/* Sparkline column header — hidden on mobile */}
              <th className="hidden sm:table-cell w-[72px]" />
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={clsx(
                    'px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider whitespace-nowrap',
                    col.align === 'left' ? 'text-left' : 'text-right',
                    col.hideClass,
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    sortKey === col.key
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground-muted',
                  )}
                >
                  {col.shortLabel ?? col.label}
                  {col.sortable && (
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border stagger-fade-in">
            {visiblePositions.map(position => {
              const companyName = position.companyName || COMPANY_NAMES[position.symbol] || '';
              return (
                <tr
                  key={position.symbol}
                  className="hover:bg-background-hover transition-colors"
                >
                  {/* Sparkline */}
                  <td className="hidden sm:table-cell px-2 py-2.5">
                    <MiniSparkline
                      data={sparklinesMap[position.symbol] ?? []}
                      width={56}
                      height={20}
                    />
                  </td>

                  {/* Symbol + company */}
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/stock/${position.symbol}`}
                      className="hover:text-primary transition-colors"
                    >
                      <span className="font-mono font-semibold text-sm">{position.symbol}</span>
                      {companyName && (
                        <p className="text-[11px] text-foreground-muted truncate max-w-[120px]">
                          {companyName}
                        </p>
                      )}
                    </Link>
                  </td>

                  {/* Market Value */}
                  <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums">
                    {formatMoney(position.equity)}
                  </td>

                  {/* P/L % + avg cost */}
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-mono font-medium tabular-nums',
                        pnlTextColor(position.openPnlPercent),
                        pnlBgColor(position.openPnlPercent),
                      )}
                    >
                      {formatPercent(position.openPnlPercent, 2, { showSign: true })}
                    </span>
                    {position.averageBuyPrice != null && (
                      <div className="text-[10px] text-foreground-muted font-mono tabular-nums mt-0.5">
                        {formatMoney(position.averageBuyPrice)}
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="hidden sm:table-cell px-3 py-2.5 text-right font-mono text-sm tabular-nums text-foreground-muted">
                    {formatQuantity(position.quantity)}
                  </td>

                  {/* Avg Cost */}
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono text-sm tabular-nums text-foreground-muted">
                    {position.averageBuyPrice != null
                      ? formatMoney(position.averageBuyPrice)
                      : '\u2014'}
                  </td>

                  {/* Price */}
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono text-sm tabular-nums">
                    {formatMoney(position.currentPrice)}
                  </td>

                  {/* Today's Change */}
                  <td className={clsx(
                    'hidden lg:table-cell px-3 py-2.5 text-right font-mono text-sm tabular-nums',
                    pnlTextColor(position.dayChange),
                  )}>
                    {formatSignedMoney(position.dayChange)}
                  </td>
                </tr>
              );
            })}

            {/* Empty filter state */}
            {visiblePositions.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-sm text-foreground-muted">
                  No {filter === 'etf' ? 'ETF' : filter} positions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Show more + count */}
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
