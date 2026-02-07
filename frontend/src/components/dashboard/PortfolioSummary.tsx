'use client';

import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';

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
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{title}</p>
          <p className="metric-value mt-1">{value}</p>
          {(change !== undefined || changePct !== undefined) && (
            <div className="flex items-center gap-2 mt-2">
              {trend === 'up' && <ArrowTrendingUpIcon className="w-4 h-4 text-profit" />}
              {trend === 'down' && <ArrowTrendingDownIcon className="w-4 h-4 text-loss" />}
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
                    ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className={clsx(
          'p-3 rounded-lg',
          trend === 'up' && 'bg-profit/10',
          trend === 'down' && 'bg-loss/10',
          (!trend || trend === 'neutral') && 'bg-primary/10'
        )}>
          <Icon className={clsx(
            'w-6 h-6',
            trend === 'up' && 'text-profit',
            trend === 'down' && 'text-loss',
            (!trend || trend === 'neutral') && 'text-primary'
          )} />
        </div>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-background-hover rounded" />
          <div className="h-6 w-32 bg-background-hover rounded" />
          <div className="h-4 w-24 bg-background-hover rounded mt-1" />
        </div>
        <div className="p-3 rounded-lg bg-background-hover">
          <div className="w-6 h-6" />
        </div>
      </div>
    </div>
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
      <div className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load portfolio</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.summary) {
    return (
      <div className="card p-6 text-center">
        <p className="text-foreground-muted">No portfolio data available</p>
      </div>
    );
  }

  const { summary } = data;
  const dailyTrend = summary.dayChange >= 0 ? 'up' : 'down';
  const totalTrend = summary.unrealizedPL >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Portfolio Value"
        value={`$${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        change={summary.dayChange}
        changePct={summary.dayChangePercent}
        icon={ChartBarIcon}
        trend={dailyTrend}
      />
      <MetricCard
        title="Total P/L"
        value={`${summary.unrealizedPL >= 0 ? '+' : ''}$${Math.abs(summary.unrealizedPL).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
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
        value={`$${summary.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        icon={BanknotesIcon}
        trend="neutral"
      />
    </div>
  );
}
