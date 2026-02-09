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
import { formatNumber, formatMoney, formatSignedMoney } from '@/lib/format';

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
                  'text-sm font-medium',
                  trend === 'up' && 'text-profit',
                  trend === 'down' && 'text-loss',
                  trend === 'neutral' && 'text-foreground-muted'
                )}
              >
                {change !== undefined && (
                  <span>
                    {change >= 0 ? '+' : ''}${Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
                {changePct !== undefined && (
                  <span className="ml-1">
                    ({changePct >= 0 ? '+' : ''}{formatNumber(changePct)}%)
                  </span>
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
  const dailyTrend = summary.dayChange >= 0 ? 'up' : 'down';
  const totalTrend = summary.unrealizedPL >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Portfolio Value"
        value={formatMoney(summary.totalValue)}
        change={summary.dayChange}
        changePct={summary.dayChangePercent}
        icon={ChartBarIcon}
        trend={dailyTrend}
      />
      <MetricCard
        title="Total P/L"
        value={formatSignedMoney(summary.unrealizedPL)}
        changePct={summary.unrealizedPLPercent}
        icon={summary.unrealizedPL >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
        trend={totalTrend}
      />
      <MetricCard
        title="Positions"
        value={summary.positionsCount.toString()}
        icon={ChartBarIcon}
        trend="neutral"
      />
      <MetricCard
        title="Cash Balance"
        value={formatMoney(summary.cashBalance)}
        icon={BanknotesIcon}
        trend="neutral"
      />
    </div>
  );
}
