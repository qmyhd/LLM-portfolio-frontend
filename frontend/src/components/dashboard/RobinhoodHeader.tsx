'use client';

import useSWR from 'swr';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import { useTimeRange, type TimeRange } from '@/hooks/useTimeRange';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { formatMoney, formatSignedMoney, formatPercent } from '@/lib/format';
import { pnlTextColor, trendDirection } from '@/lib/colors';
import { TimeRangeTabs } from '@/components/ui/TimeRangeTabs';

const RANGES: TimeRange[] = ['1W', '1M', '3M', 'YTD', '1Y', 'ALL'];

interface EquityPoint {
  date: string;
  equity: number;
}

interface EquityCurveResponse {
  points: EquityPoint[];
  bucket: string;
  days: number;
}

const equityFetcher = async (url: string): Promise<EquityCurveResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`equity-curve ${res.status}`);
  return res.json();
};

/** Map a UI range tab to the number of days to fetch from the curve. */
function rangeToDays(range: TimeRange): number {
  switch (range) {
    case '1W':
      return 7;
    case '1M':
      return 30;
    case '3M':
      return 90;
    case 'YTD': {
      // Calendar days since Jan 1 of the current year, plus a small buffer
      // so partial weekends round to the right point.
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return Math.max(7, Math.ceil((now.getTime() - start.getTime()) / 86_400_000));
    }
    case '1Y':
      return 365;
    case 'ALL':
      return 730;
  }
}

const RANGE_LABEL: Record<TimeRange, string> = {
  '1W': '1W',
  '1M': '1M',
  '3M': '3M',
  YTD: 'YTD',
  '1Y': '1Y',
  ALL: 'All time',
};

/**
 * Compute change for the selected range by reading the equity-curve
 * series. Falls back to the summary's dayChange (1W) or unrealizedPL
 * (everything else) if the curve isn't populated yet.
 */
function getChangeForRange(
  summary: {
    dayChange: number;
    dayChangePercent: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    totalValue: number;
  },
  range: TimeRange,
  curve: EquityPoint[] | undefined,
): { change: number; changePct: number; label: string } {
  const label = RANGE_LABEL[range];

  // No curve data → fall back to coarse approximations from summary.
  if (!curve || curve.length < 2) {
    if (range === '1W') {
      return {
        change: summary.dayChange,
        changePct: summary.dayChangePercent,
        label: 'Today',
      };
    }
    return {
      change: summary.unrealizedPL,
      changePct: summary.unrealizedPLPercent,
      label: range === 'ALL' ? 'All time' : 'Total return',
    };
  }

  // Curve is sorted ASC; first ≈ start, last ≈ now. Use end value as the
  // anchor (live total) and first value as the baseline for the period.
  const start = curve[0].equity;
  const end = curve[curve.length - 1].equity;
  const change = end - start;
  const changePct = start > 0 ? (change / start) * 100 : 0;
  return { change, changePct, label };
}

export function RobinhoodHeader() {
  const { data, error, isLoading } = usePortfolio();
  const { range, setRange } = useTimeRange();
  const bucket = useBucket();

  // Pull the equity curve for the active range so the headline change
  // reflects the selected period (not just dayChange / unrealizedPL).
  const days = rangeToDays(range);
  const { data: curve } = useSWR<EquityCurveResponse>(
    withBucket(`/api/portfolio/equity-curve?days=${days}`, bucket),
    equityFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

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
  const { change, changePct, label } = getChangeForRange(
    summary,
    range,
    curve?.points,
  );
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
