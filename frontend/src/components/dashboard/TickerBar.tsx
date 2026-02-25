'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/hooks';
import { formatNumber } from '@/lib/format';
import type { Position } from '@/types/api';

interface TickerItem {
  symbol: string;
  price: number;
  changePct: number;
}

/**
 * Derive ticker items from portfolio positions.
 * Uses dayChangePercent if available, falls back to openPnlPercent.
 */
function deriveTickerItems(positions: Position[]): TickerItem[] {
  return positions
    .filter((p) => p.currentPrice > 0)
    .map((p) => ({
      symbol: p.symbol,
      price: p.currentPrice,
      changePct: p.dayChangePercent ?? p.openPnlPercent ?? 0,
    }))
    .sort((a, b) => b.changePct - a.changePct);
}

export function TickerBar() {
  const { data, isLoading } = usePortfolio();
  const [isPaused, setIsPaused] = useState(false);

  if (isLoading || !data?.positions || data.positions.length === 0) {
    return null;
  }

  const items = deriveTickerItems(data.positions);
  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const allItems = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden bg-background-secondary border-b border-border"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="marquee"
      aria-label="Portfolio positions ticker"
    >
      <div
        className={`ticker-bar-track flex gap-8 whitespace-nowrap py-2 px-4 ${
          isPaused ? 'paused' : ''
        }`}
      >
        {allItems.map((item, i) => (
          <Link
            key={`${item.symbol}-${i}`}
            href={`/stock/${item.symbol}`}
            className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <span className="font-mono font-semibold">{item.symbol}</span>
            <span className="text-foreground-muted font-mono">
              ${formatNumber(item.price)}
            </span>
            <span
              className={`font-mono ${
                item.changePct > 0
                  ? 'text-profit'
                  : item.changePct < 0
                  ? 'text-loss'
                  : 'text-foreground-muted'
              }`}
            >
              {item.changePct === 0
                ? '\u2014'
                : `${item.changePct >= 0 ? '+' : ''}${formatNumber(item.changePct)}%`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
