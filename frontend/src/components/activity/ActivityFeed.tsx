'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { BlossomTradeCard } from '@/components/trade/BlossomTradeCard';
import type { EnrichedTrade } from '@/types/api';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Buys', value: 'BUY' },
  { label: 'Sells', value: 'SELL' },
  { label: 'Dividends', value: 'DIVIDEND' },
  { label: 'Fees', value: 'FEE' },
];

interface EnrichedTradesResponse {
  trades: EnrichedTrade[];
  total: number;
}

const fetcher = async (url: string): Promise<EnrichedTradesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Failed to fetch activity (${res.status})`);
  }
  return res.json();
};

/**
 * Activity feed — unified trade history from orders + activities tables.
 *
 * Sources data from /api/trades?types=all, which merges the activities
 * table (dividends, fees, brokerage-recorded buys/sells) with the orders
 * table (executed orders from SnapTrade). This is preferable to the
 * legacy /api/activities call because the activities table is sparsely
 * populated for some account types — orders is the more reliable
 * source.
 */
export function ActivityFeed() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const bucket = useBucket();

  // Pull the unified feed. Server-side `types` filter narrows the
  // activities-table side; client-side filter below handles the rest so
  // the FILTERS chips switch instantly without a refetch round-trip.
  const url = withBucket(
    `/api/trades?limit=100&days=365&types=all`,
    bucket,
  );
  const { data, error, isLoading, mutate } = useSWR<EnrichedTradesResponse>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );

  const trades = data?.trades ?? [];
  const filtered = trades.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (
      search &&
      !(
        t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton.ListItem key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-loss text-sm mb-2">Failed to load activity</p>
        <p className="text-foreground-muted text-xs mb-3">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-background-tertiary p-1 rounded-lg">
          <FunnelIcon className="w-4 h-4 text-foreground-muted mx-1" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                typeFilter === f.value
                  ? 'bg-primary text-white'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <span className="text-xs text-foreground-muted ml-auto">
          {filtered.length} {filtered.length === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={ClockIcon}
            title={trades.length === 0 ? 'No activity yet' : 'No matching activity'}
            description={
              trades.length === 0
                ? 'Trades, dividends, and fees from your brokerage will appear here after the next sync.'
                : 'Try a different filter or search term.'
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => (
            <BlossomTradeCard
              key={trade.id}
              trade={trade}
              showSymbol
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
