'use client';

import useSWR from 'swr';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  BanknotesIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { formatNumber, formatCompact, formatMoney, formatSignedMoney, formatSignedPct } from '@/lib/format';
import { pnlTextColor, trendDirection } from '@/lib/colors';
import { COMPANY_NAMES } from '@/lib/mappers';
import type { StockProfileCurrent } from '@/types/api';

interface StockMetricsProps {
  ticker: string;
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
  return r.json();
});

function MetricRow({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' | null }) {
  const colorClass = trend ? pnlTextColor(trend === 'up' ? 1 : trend === 'down' ? -1 : 0) : '';
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className={`text-sm font-mono font-medium ${colorClass}`}>
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 py-3 border-b border-border">
      <Icon className="w-4 h-4 text-foreground-muted" />
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        {title}
      </span>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-2 animate-pulse">
      <div className="pb-4 border-b border-border">
        <div className="h-7 w-20 bg-background-hover rounded" />
        <div className="h-4 w-32 bg-background-hover rounded mt-2" />
        <div className="h-9 w-36 bg-background-hover rounded mt-4" />
        <div className="h-4 w-28 bg-background-hover rounded mt-2" />
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex justify-between py-2">
          <div className="h-4 w-20 bg-background-hover rounded" />
          <div className="h-4 w-16 bg-background-hover rounded" />
        </div>
      ))}
    </div>
  );
}

export function StockMetrics({ ticker }: StockMetricsProps) {
  const { data, isLoading, error } = useSWR<StockProfileCurrent>(
    `/api/stocks/${ticker}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  if (isLoading) return <MetricsSkeleton />;

  if (error || !data) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-foreground-muted">
          {error ? 'Failed to load stock data' : 'No data available'}
        </p>
      </div>
    );
  }

  const dailyChange = data.latestClosePrice && data.previousClosePrice
    ? data.latestClosePrice - data.previousClosePrice
    : 0;
  const dailyTrend = trendDirection(dailyChange);

  function fmtReturn(val: number | null): { value: string; trend: 'up' | 'down' | 'neutral' | null } {
    if (val == null) return { value: '—', trend: null };
    return {
      value: formatSignedPct(val),
      trend: trendDirection(val),
    };
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-2">
      {/* Header with price */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold">{data.ticker}</h1>
        <p className="text-sm text-foreground-muted">
          {data.companyName || COMPANY_NAMES[data.ticker] || data.ticker}
        </p>

        <div className="mt-4">
          <div className="text-3xl font-bold font-mono">
            {data.latestClosePrice != null ? formatMoney(data.latestClosePrice) : '—'}
          </div>
          {data.dailyChangePct != null && (
            <div className={`flex items-center gap-1 mt-1 ${pnlTextColor(dailyChange)}`}>
              {dailyTrend === 'down' ? (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              )}
              <span className="font-mono font-medium">
                {formatSignedMoney(dailyChange)} ({formatSignedPct(data.dailyChangePct)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Price Metrics */}
      <div>
        <SectionHeader title="Price" icon={ChartBarIcon} />
        <MetricRow label="1W Return" {...fmtReturn(data.return1wPct)} />
        <MetricRow label="1M Return" {...fmtReturn(data.return1mPct)} />
        <MetricRow label="3M Return" {...fmtReturn(data.return3mPct)} />
        <MetricRow label="1Y Return" {...fmtReturn(data.return1yPct)} />
        <MetricRow
          label="30D Volatility"
          value={data.volatility30d != null ? `${formatNumber(data.volatility30d, 1)}%` : '—'}
        />
        <MetricRow
          label="52W High"
          value={data.yearHigh != null ? `$${formatNumber(data.yearHigh)}` : '—'}
        />
        <MetricRow
          label="52W Low"
          value={data.yearLow != null ? `$${formatNumber(data.yearLow)}` : '—'}
        />
        <MetricRow
          label="Avg Volume"
          value={data.avgVolume30d != null ? formatCompact(data.avgVolume30d) : '—'}
        />
      </div>

      {/* Position Metrics */}
      {data.currentPositionQty != null && data.currentPositionQty > 0 && (
        <div>
          <SectionHeader title="Your Position" icon={BanknotesIcon} />
          <MetricRow label="Shares" value={data.currentPositionQty.toString()} />
          <MetricRow
            label="Value"
            value={data.currentPositionValue != null ? formatMoney(data.currentPositionValue) : '—'}
          />
          <MetricRow
            label="Avg Cost"
            value={data.avgBuyPrice != null ? formatMoney(data.avgBuyPrice) : '—'}
          />
          <MetricRow
            label="Unrealized P/L"
            value={data.unrealizedPnl != null ? formatSignedMoney(data.unrealizedPnl) : '—'}
            trend={data.unrealizedPnl != null ? trendDirection(data.unrealizedPnl) : null}
          />
          <MetricRow
            label="P/L %"
            {...fmtReturn(data.unrealizedPnlPct)}
          />
        </div>
      )}

      {/* Sentiment Metrics */}
      {data.totalMentionCount > 0 && (
        <div>
          <SectionHeader title="Sentiment" icon={ChatBubbleLeftIcon} />
          <MetricRow label="Total Mentions" value={data.totalMentionCount.toString()} />
          <MetricRow label="Last 30 Days" value={data.mentionCount30d.toString()} />

          {/* Sentiment bar */}
          {(data.bullishMentionPct != null || data.bearishMentionPct != null) && (
            <div className="mt-3">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="bg-profit" style={{ width: `${data.bullishMentionPct ?? 0}%` }} />
                <div className="bg-sentiment-neutral" style={{ width: `${data.neutralMentionPct ?? 0}%` }} />
                <div className="bg-loss" style={{ width: `${data.bearishMentionPct ?? 0}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-2xs text-foreground-muted">
                <span className="text-profit">{data.bullishMentionPct ?? 0}% Bull</span>
                <span className="text-loss">{data.bearishMentionPct ?? 0}% Bear</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
