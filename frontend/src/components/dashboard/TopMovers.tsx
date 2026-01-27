'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

// Mock data for top movers
const moversData = {
  gainers: [
    { symbol: 'NVDA', change: 8.45, price: 875.43 },
    { symbol: 'META', change: 5.23, price: 585.42 },
    { symbol: 'TSLA', change: 4.87, price: 248.75 },
  ],
  losers: [
    { symbol: 'PLTR', change: -3.25, price: 25.43 },
    { symbol: 'SOFI', change: -2.18, price: 8.52 },
    { symbol: 'NIO', change: -1.95, price: 5.43 },
  ],
};

export function TopMovers() {
  return (
    <div className="card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Top Movers</h2>
      </div>

      {/* Gainers */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowTrendingUpIcon className="w-4 h-4 text-profit" />
          <span className="text-sm font-medium text-profit">Gainers</span>
        </div>
        <div className="space-y-2">
          {moversData.gainers.map((stock) => (
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

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Losers */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowTrendingDownIcon className="w-4 h-4 text-loss" />
          <span className="text-sm font-medium text-loss">Losers</span>
        </div>
        <div className="space-y-2">
          {moversData.losers.map((stock) => (
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
    </div>
  );
}
