'use client';

import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { formatMoney, formatSignedMoney, formatSignedPct } from '@/lib/format';
import { trendDirection } from '@/lib/colors';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changePct?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, changePct, icon: Icon, trend }: MetricCardProps) {
  return (
    <CardSpotlight className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="metric-label">{title}</p>
          <p className="metric-value mt-0.5">{value}</p>
          {(change !== undefined || changePct !== undefined) && (
            <div className="flex items-center gap-1.5 mt-1">
              {trend === 'up' && <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-profit" />}
              {trend === 'down' && <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-loss" />}
              <span
                className={clsx(
                  'text-sm font-mono font-medium',
                  trend === 'up' && 'text-profit',
                  trend === 'down' && 'text-loss',
                  trend === 'neutral' && 'text-foreground-muted'
                )}
              >
                {change !== undefined && (
                  <span>{formatSignedMoney(change)}</span>
                )}
                {changePct !== undefined && (
                  <span className="ml-1">({formatSignedPct(changePct)})</span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className={clsx(
          'p-2 rounded-lg flex-shrink-0',
          trend === 'up' && 'bg-profit/5',
          trend === 'down' && 'bg-loss/5',
          (!trend || trend === 'neutral') && 'bg-primary/5'
        )}>
          <Icon className={clsx(
            'w-5 h-5',
            trend === 'up' && 'text-profit',
            trend === 'down' && 'text-loss',
            (!trend || trend === 'neutral') && 'text-primary'
          )} />
        </div>
      </div>
    </CardSpotlight>
  );
}

function MetricCardSkeleton() {
  return (
    <CardSpotlight className="card p-4 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-background-hover rounded" />
          <div className="h-6 w-32 bg-background-hover rounded" />
          <div className="h-3.5 w-24 bg-background-hover rounded" />
        </div>
        <div className="p-2 rounded-lg bg-background-hover">
          <div className="w-5 h-5" />
        </div>
      </div>
    </CardSpotlight>
  );
}

export function PortfolioSummary() {
  const { data, error, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load portfolio</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </CardSpotlight>
    );
  }

  if (!data?.summary) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-foreground-muted">No portfolio data available</p>
      </CardSpotlight>
    );
  }

  const { summary } = data;

  const dailyTrend = trendDirection(summary.dayChange);
  const totalTrend = trendDirection(summary.unrealizedPL);

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin snap-x snap-mandatory">
      <div className="snap-start min-w-[160px] flex-1">
        <MetricCard
          title="Market Value"
          value={formatMoney(summary.totalEquity)}
          change={summary.dayChange}
          changePct={summary.dayChangePercent}
          icon={ChartBarIcon}
          trend={dailyTrend}
        />
      </div>
      <div className="snap-start min-w-[140px] flex-1">
        <MetricCard
          title={summary.cashBalance < 0 ? 'Cash (Margin)' : 'Cash'}
          value={formatMoney(summary.cashBalance)}
          icon={BanknotesIcon}
          trend={summary.cashBalance < 0 ? 'down' : 'neutral'}
        />
      </div>
      {summary.buyingPower != null && (
        <div className="snap-start min-w-[140px] flex-1">
          <MetricCard
            title="Buying Power"
            value={formatMoney(summary.buyingPower)}
            icon={BanknotesIcon}
            trend="neutral"
          />
        </div>
      )}
      <div className="snap-start min-w-[160px] flex-1">
        <MetricCard
          title="Day Change"
          value={formatSignedMoney(summary.dayChange)}
          changePct={summary.dayChangePercent}
          icon={dailyTrend === 'down' ? ArrowTrendingDownIcon : ArrowTrendingUpIcon}
          trend={dailyTrend}
        />
      </div>
      <div className="snap-start min-w-[160px] flex-1">
        <MetricCard
          title="Total P/L"
          value={formatSignedMoney(summary.unrealizedPL)}
          changePct={summary.unrealizedPLPercent}
          icon={totalTrend === 'down' ? ArrowTrendingDownIcon : ArrowTrendingUpIcon}
          trend={totalTrend}
        />
      </div>
    </div>
  );
}
