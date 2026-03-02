'use client';

import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useMovers } from '@/hooks';
import type { MoverItem } from '@/types/ideas';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { formatNumber } from '@/lib/format';

/**
 * Get the display change percentage for a mover item.
 * Uses dayChangePct when source is 'intraday', openPnlPct otherwise.
 */
function getChangePct(item: MoverItem, source: 'intraday' | 'unrealized'): number {
  if (source === 'intraday') {
    return item.dayChangePct ?? item.openPnlPct;
  }
  return item.openPnlPct;
}

/** Label shown in header to indicate which metric is used for ranking. */
function sourceLabel(source: 'intraday' | 'unrealized'): string {
  return source === 'intraday' ? 'by day change' : 'by P/L %';
}

export function TopMovers() {
  const { data, error, isLoading, refresh } = useMovers({ limit: 3 });

  if (isLoading) {
    return (
      <CardSpotlight className="card animate-pulse">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-5 w-24 bg-background-hover rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-background-hover rounded" />
          ))}
        </div>
      </CardSpotlight>
    );
  }

  if (error) {
    return (
      <CardSpotlight className="card p-5">
        <p className="text-loss text-sm mb-2">Failed to load movers</p>
        <p className="text-foreground-muted text-xs mb-3">{error.message}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Retry
        </button>
      </CardSpotlight>
    );
  }

  const gainers = data?.topGainers ?? [];
  const losers = data?.topLosers ?? [];
  const source = data?.source ?? 'unrealized';
  const hasData = gainers.length > 0 || losers.length > 0;

  if (!hasData) {
    return (
      <CardSpotlight className="card p-5 text-center">
        <p className="text-foreground-muted text-sm">No positions data available</p>
      </CardSpotlight>
    );
  }

  return (
    <CardSpotlight className="card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          Top Movers
          <span className="ml-2 text-xs font-normal text-foreground-muted">
            ({sourceLabel(source)})
          </span>
        </h2>
      </div>

      {/* Gainers */}
      {gainers.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowTrendingUpIcon className="w-4 h-4 text-profit" />
            <span className="text-sm font-medium text-profit">Gainers</span>
          </div>
          <div className="space-y-2 stagger-fade-in">
            {gainers.map((item) => (
              <Link
                key={item.symbol}
                href={`/stock/${item.symbol}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-background-hover transition-colors"
              >
                <span className="font-mono font-semibold">{item.symbol}</span>
                <div className="text-right">
                  <div className="text-sm font-mono text-profit">
                    +{formatNumber(getChangePct(item, source))}%
                  </div>
                  <div className="text-xs text-foreground-muted font-mono">
                    ${formatNumber(item.currentPrice)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {gainers.length > 0 && losers.length > 0 && (
        <div className="border-t border-border" />
      )}

      {/* Losers */}
      {losers.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowTrendingDownIcon className="w-4 h-4 text-loss" />
            <span className="text-sm font-medium text-loss">Losers</span>
          </div>
          <div className="space-y-2 stagger-fade-in">
            {losers.map((item) => (
              <Link
                key={item.symbol}
                href={`/stock/${item.symbol}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-background-hover transition-colors"
              >
                <span className="font-mono font-semibold">{item.symbol}</span>
                <div className="text-right">
                  <div className="text-sm font-mono text-loss">
                    {formatNumber(getChangePct(item, source))}%
                  </div>
                  <div className="text-xs text-foreground-muted font-mono">
                    ${formatNumber(item.currentPrice)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </CardSpotlight>
  );
}
