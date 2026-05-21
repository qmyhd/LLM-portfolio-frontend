'use client';

import Link from 'next/link';
import { usePortfolio } from '@/hooks';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';
import { formatNumber, formatSignedPct } from '@/lib/format';
import { pnlTextColor } from '@/lib/colors';
import type { Position } from '@/types/api';

interface TickerItem {
  symbol: string;
  price: number;
  changePct: number;
}

/** How many movers to show in the strip. Picked by |dayChange| desc. */
const STRIP_LIMIT = 10;

function deriveTopMovers(positions: Position[]): TickerItem[] {
  return positions
    .filter((p) => p.currentPrice > 0 && (p.dayChangePercent ?? 0) !== 0)
    .map((p) => ({
      symbol: p.symbol,
      price: p.currentPrice,
      changePct: p.dayChangePercent ?? 0,
    }))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, STRIP_LIMIT);
}

/**
 * Compact movers strip — sits just below the top bar on /portfolio.
 *
 * Previously this scrolled every position (200+ tickers) as a marquee
 * which was visual noise and a CPU sink. Now it shows the top 10 movers
 * by absolute day-change %, sorted to highlight biggest movers regardless
 * of direction. Static (no scroll), one-line, horizontally scrollable on
 * narrow screens. Hides entirely when no positions have non-zero
 * intraday movement (e.g., market closed).
 */
export function TickerBar() {
  const { data, isLoading } = usePortfolio();
  const bucket = useBucket();

  if (isLoading || !data?.positions || data.positions.length === 0) {
    return null;
  }

  const items = deriveTopMovers(data.positions);
  // When all positions are at 0% intraday (e.g., market closed), skip
  // rendering — the strip would just be a row of "—" placeholders.
  if (items.length === 0) return null;

  return (
    <div
      className="bg-background-secondary/60 border-b border-border"
      aria-label="Top movers today"
    >
      <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase tracking-wider text-foreground-muted font-semibold flex-shrink-0">
          Movers
        </span>
        {items.map((item) => (
          <Link
            key={item.symbol}
            href={stockHref(item.symbol, bucket)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-background-hover transition-colors flex-shrink-0 text-xs"
          >
            <span className="font-mono font-semibold text-foreground">
              {item.symbol}
            </span>
            <span className="text-foreground-muted font-mono">
              ${formatNumber(item.price)}
            </span>
            <span className={`font-mono font-medium ${pnlTextColor(item.changePct)}`}>
              {formatSignedPct(item.changePct)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
