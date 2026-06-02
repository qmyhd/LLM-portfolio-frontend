'use client';

import useSWR from 'swr';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import { useTimeRange, type TimeRange } from '@/hooks/useTimeRange';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { formatPercent } from '@/lib/format';
import { pnlTextColor, trendDirection } from '@/lib/colors';
import { TimeRangeTabs } from '@/components/ui/TimeRangeTabs';
import type { ReturnSeriesResponse } from '@/types/api';

const RANGES: TimeRange[] = ['1W', '1M', '3M', 'YTD', '1Y', 'ALL'];

const RANGE_LABEL: Record<TimeRange, string> = {
  '1W': '1W',
  '1M': '1M',
  '3M': '3M',
  YTD: 'YTD',
  '1Y': '1Y',
  ALL: 'All time',
};

const CLARITY_NOTE =
  'Performance of the stocks you currently hold, repriced over this period — not your actual account history.';

const returnFetcher = async (url: string): Promise<ReturnSeriesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`return-series ${res.status}`);
  return res.json();
};

export function RobinhoodHeader() {
  const { data, error, isLoading } = usePortfolio();
  const { range, setRange } = useTimeRange();
  const bucket = useBucket();

  // Flow-free current-holdings return for the selected period drives the hero.
  const { data: series } = useSWR<ReturnSeriesResponse>(
    withBucket(`/api/portfolio/return-series?period=${range}`, bucket),
    returnFetcher,
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
  const periodPct = series?.periodReturnPct ?? 0;
  const trend = trendDirection(periodPct);
  const TrendIcon = trend === 'down' ? ArrowTrendingDownIcon : ArrowTrendingUpIcon;

  return (
    <div className="mb-6">
      {/* Section label */}
      <p className="text-sm text-foreground-muted font-medium mb-1">Stocks &amp; ETFs</p>

      {/* Hero: selected-period return % */}
      <div className="flex items-center gap-2">
        <h1 className={`text-4xl font-bold font-mono tracking-tight ${pnlTextColor(periodPct)}`}>
          {formatPercent(periodPct, 2, { showSign: true })}
        </h1>
        <span className="text-foreground-subtle" title={CLARITY_NOTE} aria-label={CLARITY_NOTE}>
          <InformationCircleIcon className="w-4 h-4" />
        </span>
        <span className="text-sm text-foreground-muted">{RANGE_LABEL[range]}</span>
      </div>

      {/* Context subline: all-time + today */}
      <div className="flex items-center gap-1.5 mt-1">
        <TrendIcon className={`w-4 h-4 ${pnlTextColor(periodPct)}`} />
        <span className="text-xs text-foreground-muted">
          all-time {formatPercent(summary.unrealizedPLPercent, 2, { showSign: true })}
          {' · '}today {formatPercent(summary.dayChangePercent, 2, { showSign: true })}
        </span>
        <span className="text-border">|</span>
        <span className="text-xs text-foreground-muted">{summary.positionsCount} positions</span>
      </div>

      {/* Clarity caption */}
      <p className="text-[11px] text-foreground-subtle mt-1 max-w-md">{CLARITY_NOTE}</p>

      {/* Time range tabs */}
      <TimeRangeTabs ranges={RANGES} value={range} onChange={setRange} className="mt-4" />
    </div>
  );
}
