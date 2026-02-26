'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useActivities } from '@/hooks';
import { TradeCard } from './TradeCard';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Buys', value: 'BUY' },
  { label: 'Sells', value: 'SELL' },
  { label: 'Dividends', value: 'DIVIDEND' },
  { label: 'Fees', value: 'FEE' },
];

export function ActivityFeed() {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, error, isLoading, refresh } = useActivities({
    activityType: typeFilter || undefined,
    limit: 100,
  });

  const activities = data?.activities ?? [];
  const filtered = search
    ? activities.filter(
        (a) =>
          a.symbol?.toLowerCase().includes(search.toLowerCase()) ||
          a.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : activities;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-background-hover rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-background-hover rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-loss text-sm mb-2">Failed to load activities</p>
        <p className="text-foreground-muted text-xs mb-3">{error.message}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
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
        {/* Type filters */}
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

        {/* Search */}
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

        {/* Count */}
        <span className="text-xs text-foreground-muted ml-auto">
          {filtered.length} activities
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-foreground-muted text-sm">No activities found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((activity) => (
            <TradeCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
