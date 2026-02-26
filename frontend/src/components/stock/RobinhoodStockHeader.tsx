'use client';

import { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { StockProfileCurrent } from '@/types/api';
import { formatMoney, formatSignedMoney, formatPercent } from '@/lib/format';
import { pnlTextColor, trendDirection, FAVORITE_COLOR } from '@/lib/colors';
import { COMPANY_NAMES } from '@/lib/mappers';
import { TimeRangeTabs } from '@/components/ui/TimeRangeTabs';

type StockTimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
const RANGES: readonly StockTimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

function getReturnForRange(
  profile: StockProfileCurrent,
  range: StockTimeRange,
): { pct: number | null; label: string } {
  switch (range) {
    case '1D':
      return { pct: profile.dailyChangePct, label: 'Today' };
    case '1W':
      return { pct: profile.return1wPct, label: 'Past week' };
    case '1M':
      return { pct: profile.return1mPct, label: 'Past month' };
    case '3M':
      return { pct: profile.return3mPct, label: 'Past 3 months' };
    case '1Y':
      return { pct: profile.return1yPct, label: 'Past year' };
    case 'ALL':
      return { pct: profile.return1yPct, label: 'Past year' }; // Best we have
  }
}

interface RobinhoodStockHeaderProps {
  ticker: string;
  profile: StockProfileCurrent;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function RobinhoodStockHeader({
  ticker,
  profile,
  isFavorite,
  onToggleFavorite,
}: RobinhoodStockHeaderProps) {
  const [range, setRange] = useState<StockTimeRange>('1D');
  const companyName = profile.companyName || COMPANY_NAMES[ticker] || ticker;
  const price = profile.latestClosePrice;
  const { pct, label } = getReturnForRange(profile, range);

  // Compute dollar change for the selected range
  const dollarChange =
    price && pct != null ? (price * pct) / (100 + pct) : null;

  const trend = trendDirection(pct);
  const colorClass = pnlTextColor(pct);
  const TrendIcon = trend === 'down' ? ArrowTrendingDownIcon : ArrowTrendingUpIcon;

  return (
    <div className="px-4 py-4 border-b border-border bg-background-secondary">
      <div className="flex items-start justify-between">
        <div>
          {/* Small ticker */}
          <p className="text-sm text-foreground-muted font-medium">{ticker}</p>

          {/* Big company name */}
          <h1 className="text-2xl font-bold mt-0.5">{companyName}</h1>

          {/* Big price */}
          <p className="text-4xl font-bold font-mono tracking-tight mt-1">
            {formatMoney(price)}
          </p>

          {/* Change line */}
          {pct != null && (
            <div className="flex items-center gap-1.5 mt-1">
              <TrendIcon className={`w-4 h-4 ${colorClass}`} />
              <span className={`text-sm font-medium ${colorClass}`}>
                {dollarChange != null && formatSignedMoney(dollarChange)}{' '}
                ({formatPercent(pct, 2, { showSign: true })})
              </span>
              <span className="text-sm text-foreground-muted">{label}</span>
            </div>
          )}

          {/* Time range tabs */}
          <TimeRangeTabs ranges={RANGES} value={range} onChange={setRange} className="mt-3" />
        </div>

        {/* Favorite button */}
        <button
          onClick={onToggleFavorite}
          className="p-1.5 rounded-lg hover:bg-background-tertiary transition-colors"
          title={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {isFavorite ? (
            <StarIconSolid className={`h-5 w-5 ${FAVORITE_COLOR}`} />
          ) : (
            <StarIcon className="h-5 w-5 text-foreground-muted" />
          )}
        </button>
      </div>
    </div>
  );
}
