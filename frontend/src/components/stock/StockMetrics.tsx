'use client';

import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  BanknotesIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { formatNumber, formatCompact } from '@/lib/format';

interface StockMetricsProps {
  ticker: string;
}

// Mock data - will be replaced with API calls
const getMockData = (ticker: string) => ({
  ticker,
  name: getCompanyName(ticker),
  latestClose: 178.52,
  previousClose: 175.23,
  dailyChange: 3.29,
  dailyChangePct: 1.88,
  return1w: 2.45,
  return1m: 5.67,
  return3m: 12.34,
  return1y: 28.90,
  volatility30d: 24.5,
  yearHigh: 198.45,
  yearLow: 142.30,
  avgVolume: 52340000,
  // Position metrics
  hasPosition: true,
  positionQty: 100,
  positionValue: 17852.00,
  avgBuyPrice: 145.30,
  unrealizedPnl: 3322.00,
  unrealizedPnlPct: 22.86,
  // Sentiment metrics
  totalMentions: 45,
  mentions30d: 12,
  avgSentiment: 0.72,
  bullishPct: 68,
  bearishPct: 18,
  neutralPct: 14,
});

function getCompanyName(ticker: string): string {
  const names: Record<string, string> = {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft Corp.',
    GOOGL: 'Alphabet Inc.',
    NVDA: 'NVIDIA Corp.',
    TSLA: 'Tesla Inc.',
    META: 'Meta Platforms',
    AMD: 'AMD Inc.',
    PLTR: 'Palantir',
  };
  return names[ticker] || ticker;
}

function MetricRow({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className={clsx(
        'text-sm font-mono font-medium',
        trend === 'up' && 'text-profit',
        trend === 'down' && 'text-loss',
      )}>
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

export function StockMetrics({ ticker }: StockMetricsProps) {
  const data = getMockData(ticker);
  const dailyTrend = data.dailyChange >= 0 ? 'up' : 'down';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-2">
      {/* Header with price */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold">{data.ticker}</h1>
        <p className="text-sm text-foreground-muted">{data.name}</p>
        
        <div className="mt-4">
          <div className="text-3xl font-bold font-mono">
            ${formatNumber(data.latestClose)}
          </div>
          <div className={clsx(
            'flex items-center gap-1 mt-1',
            dailyTrend === 'up' ? 'text-profit' : 'text-loss'
          )}>
            {dailyTrend === 'up' ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            )}
            <span className="font-mono font-medium">
              {data.dailyChange >= 0 ? '+' : ''}{formatNumber(data.dailyChange)} ({formatNumber(data.dailyChangePct)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Price Metrics */}
      <div>
        <SectionHeader title="Price" icon={ChartBarIcon} />
        <MetricRow label="1W Return" value={`${data.return1w >= 0 ? '+' : ''}${formatNumber(data.return1w)}%`} trend={data.return1w >= 0 ? 'up' : 'down'} />
        <MetricRow label="1M Return" value={`${data.return1m >= 0 ? '+' : ''}${formatNumber(data.return1m)}%`} trend={data.return1m >= 0 ? 'up' : 'down'} />
        <MetricRow label="3M Return" value={`${data.return3m >= 0 ? '+' : ''}${formatNumber(data.return3m)}%`} trend={data.return3m >= 0 ? 'up' : 'down'} />
        <MetricRow label="1Y Return" value={`${data.return1y >= 0 ? '+' : ''}${formatNumber(data.return1y)}%`} trend={data.return1y >= 0 ? 'up' : 'down'} />
        <MetricRow label="30D Volatility" value={`${formatNumber(data.volatility30d, 1)}%`} />
        <MetricRow label="52W High" value={`$${formatNumber(data.yearHigh)}`} />
        <MetricRow label="52W Low" value={`$${formatNumber(data.yearLow)}`} />
        <MetricRow label="Avg Volume" value={formatCompact(data.avgVolume)} />
      </div>

      {/* Position Metrics */}
      {data.hasPosition && (
        <div>
          <SectionHeader title="Your Position" icon={BanknotesIcon} />
          <MetricRow label="Shares" value={data.positionQty.toString()} />
          <MetricRow label="Value" value={`$${data.positionValue.toLocaleString()}`} />
          <MetricRow label="Avg Cost" value={`$${formatNumber(data.avgBuyPrice)}`} />
          <MetricRow 
            label="Unrealized P/L" 
            value={`${data.unrealizedPnl >= 0 ? '+' : ''}$${Math.abs(data.unrealizedPnl).toLocaleString()}`} 
            trend={data.unrealizedPnl >= 0 ? 'up' : 'down'}
          />
          <MetricRow 
            label="P/L %" 
            value={`${data.unrealizedPnlPct >= 0 ? '+' : ''}${formatNumber(data.unrealizedPnlPct)}%`} 
            trend={data.unrealizedPnlPct >= 0 ? 'up' : 'down'}
          />
        </div>
      )}

      {/* Sentiment Metrics */}
      <div>
        <SectionHeader title="Sentiment" icon={ChatBubbleLeftIcon} />
        <MetricRow label="Total Mentions" value={data.totalMentions.toString()} />
        <MetricRow label="Last 30 Days" value={data.mentions30d.toString()} />
        <MetricRow 
          label="Avg Score" 
          value={formatNumber(data.avgSentiment)} 
          trend={data.avgSentiment >= 0.5 ? 'up' : 'down'}
        />
        
        {/* Sentiment bar */}
        <div className="mt-3">
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="bg-profit" style={{ width: `${data.bullishPct}%` }} />
            <div className="bg-sentiment-neutral" style={{ width: `${data.neutralPct}%` }} />
            <div className="bg-loss" style={{ width: `${data.bearishPct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-2xs text-foreground-muted">
            <span className="text-profit">{data.bullishPct}% Bull</span>
            <span className="text-loss">{data.bearishPct}% Bear</span>
          </div>
        </div>
      </div>
    </div>
  );
}
