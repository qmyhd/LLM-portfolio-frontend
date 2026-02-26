'use client';

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import { useTimeRange, type TimeRange } from '@/hooks/useTimeRange';
import { formatMoney, formatSignedMoney, formatPercent } from '@/lib/format';
import { pnlTextColor, trendDirection } from '@/lib/colors';
import { TimeRangeTabs } from '@/components/ui/TimeRangeTabs';

const RANGES: TimeRange[] = ['1W', '1M', '3M', 'YTD', '1Y', 'ALL'];

/**
 * Get change values for the selected time range.
 * Currently we only have dayChange and totalPnl from the backend.
 * Intermediate ranges (1W, 1M, etc.) will show totalPnl until
 * a portfolio history endpoint is implemented.
 */
function getChangeForRange(
  summary: { dayChange: number; dayChangePercent: number; unrealizedPL: number; unrealizedPLPercent: number },
  range: TimeRange,
): { change: number; changePct: number; label: string } {
  switch (range) {
    case '1W':
      // Approximate: use dayChange as a proxy for 1W (limited data)
      return { change: summary.dayChange, changePct: summary.dayChangePercent, label: 'Today' };
    case 'ALL':
      return { change: summary.unrealizedPL, changePct: summary.unrealizedPLPercent, label: 'All time' };
    default:
      // For 1M, 3M, YTD, 1Y: show total return until we have historical data
      return { change: summary.unrealizedPL, changePct: summary.unrealizedPLPercent, label: 'All time' };
  }
}

export function RobinhoodHeader() {
  const { data, error, isLoading } = usePortfolio();
  const { range, setRange } = useTimeRange();

  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-4 w-32 bg-background-hover rounded mb-2" />
        <div className="h-10 w-48 bg-background-hover rounded mb-2" />
        <div className="h-5 w-40 bg-background-hover rounded mb-4" />
        <div className="h-8 w-80 bg-background-hover rounded" />
      </div>
    );
  }

  if (error || !data?.summary) {
    return (
      <div className="mb-6">
        <p className="text-foreground-muted text-sm">
          {error ? 'Failed to load portfolio' : 'No portfolio data'}
        </p>
      </div>
    );
  }

  const { summary } = data;
  const { change, changePct, label } = getChangeForRange(summary, range);
  const trend = trendDirection(change);
  const TrendIcon = trend === 'down' ? ArrowTrendingDownIcon : ArrowTrendingUpIcon;

  return (
    <div className="mb-6">
      {/* Section label */}
      <p className="text-sm text-foreground-muted font-medium mb-1">Stocks & ETFs</p>

      {/* Big value */}
      <h1 className="text-4xl font-bold font-mono tracking-tight">
        {formatMoney(summary.totalValue)}
      </h1>

      {/* Change line */}
      <div className="flex items-center gap-1.5 mt-1">
        <TrendIcon className={`w-4 h-4 ${pnlTextColor(change)}`} />
        <span className={`text-sm font-medium ${pnlTextColor(change)}`}>
          {formatSignedMoney(change)} ({formatPercent(changePct, 2, { showSign: true })})
        </span>
        <span className="text-sm text-foreground-muted">{label}</span>
      </div>

      {/* Cash / buying power sub-line */}
      <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted">
        <span>
          Cash: {formatMoney(summary.cashBalance)}
          {summary.cashBalance < 0 && ' (margin)'}
        </span>
        {summary.buyingPower != null && (
          <>
            <span className="text-border">|</span>
            <span>Buying power: {formatMoney(summary.buyingPower)}</span>
          </>
        )}
        <span className="text-border">|</span>
        <span>{summary.positionsCount} positions</span>
      </div>

      {/* Time range tabs */}
      <TimeRangeTabs ranges={RANGES} value={range} onChange={setRange} className="mt-4" />
    </div>
  );
}
