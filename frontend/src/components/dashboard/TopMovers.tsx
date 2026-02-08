'use client';

import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import type { Position } from '@/types/api';
import { CardSpotlight } from '@/components/ui/CardSpotlight';

/** Derive top gainers/losers from portfolio positions using dayChangePercent. */
function deriveMovers(positions: Position[]) {
  const withChange = positions.filter(
    (p) => p.dayChangePercent !== null && p.dayChangePercent !== undefined
  );

  const sorted = [...withChange].sort(
    (a, b) => (b.dayChangePercent ?? 0) - (a.dayChangePercent ?? 0)
  );

  const gainers = sorted
    .filter((p) => (p.dayChangePercent ?? 0) > 0)
    .slice(0, 3)
    .map((p) => ({
      symbol: p.symbol,
      change: p.dayChangePercent ?? 0,
      price: p.currentPrice,
    }));

  const losers = sorted
    .filter((p) => (p.dayChangePercent ?? 0) < 0)
    .reverse()
    .slice(0, 3)
    .map((p) => ({
      symbol: p.symbol,
      change: p.dayChangePercent ?? 0,
      price: p.currentPrice,
    }));

  return { gainers, losers };
}

export function TopMovers() {
  const { data, error, isLoading } = usePortfolio();

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
      <CardSpotlight className="card p-5 text-center">
        <p className="text-loss text-sm">Failed to load movers</p>
      </CardSpotlight>
    );
  }

  const positions = data?.positions ?? [];
  const { gainers, losers } = deriveMovers(positions);
  const hasData = gainers.length > 0 || losers.length > 0;

  if (!hasData) {
    return (
      <CardSpotlight className="card p-5 text-center">
        <p className="text-foreground-muted text-sm">No day-change data available</p>
      </CardSpotlight>
    );
  }

  return (
    <CardSpotlight className="card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Top Movers</h2>
      </div>

      {/* Gainers */}
      {gainers.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowTrendingUpIcon className="w-4 h-4 text-profit" />
            <span className="text-sm font-medium text-profit">Gainers</span>
          </div>
          <div className="space-y-2">
            {gainers.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-background-hover transition-colors"
              >
                <span className="font-mono font-semibold">{stock.symbol}</span>
                <div className="text-right">
                  <div className="text-sm font-mono text-profit">
                    +{stock.change.toFixed(2)}%
                  </div>
                  <div className="text-xs text-foreground-muted font-mono">
                    ${stock.price.toFixed(2)}
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
          <div className="space-y-2">
            {losers.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-background-hover transition-colors"
              >
                <span className="font-mono font-semibold">{stock.symbol}</span>
                <div className="text-right">
                  <div className="text-sm font-mono text-loss">
                    {stock.change.toFixed(2)}%
                  </div>
                  <div className="text-xs text-foreground-muted font-mono">
                    ${stock.price.toFixed(2)}
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
