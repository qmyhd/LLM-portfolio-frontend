'use client';

import Link from 'next/link';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { useRecentTrades } from '@/hooks/useEnrichedTrades';
import { BlossomTradeCard } from '@/components/trade/BlossomTradeCard';

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function TradeRecapSkeleton() {
  return (
    <CardSpotlight className="card overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-border flex justify-between">
        <div className="h-5 w-28 bg-background-hover rounded" />
        <div className="h-5 w-16 bg-background-hover rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-1 rounded-full bg-background-hover" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-background-hover rounded" />
              <div className="h-3 w-48 bg-background-hover rounded" />
            </div>
            <div className="h-3 w-14 bg-background-hover rounded self-start" />
          </div>
        ))}
      </div>
    </CardSpotlight>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TradeRecap() {
  const { data, error, isLoading } = useRecentTrades(10);

  if (isLoading) {
    return <TradeRecapSkeleton />;
  }

  if (error) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load trades</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </CardSpotlight>
    );
  }

  const trades = data?.trades ?? [];

  if (trades.length === 0) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-foreground-muted">No recent trades</p>
      </CardSpotlight>
    );
  }

  return (
    <CardSpotlight className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Recent Trades</h2>
        <Link
          href="/activity"
          className="text-sm text-primary hover:text-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Trade list */}
      <div className="p-4 space-y-2 stagger-fade-in">
        {trades.map((trade) => (
          <BlossomTradeCard key={trade.id} trade={trade} compact showSymbol />
        ))}
      </div>
    </CardSpotlight>
  );
}
