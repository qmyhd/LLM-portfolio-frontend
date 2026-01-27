'use client';

import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// Mock data - will be replaced with API calls
const portfolioData = {
  totalValue: 125847.32,
  dailyChange: 2341.56,
  dailyChangePct: 1.89,
  totalPnL: 18432.15,
  totalPnLPct: 17.15,
  positionsCount: 24,
  cashBalance: 8432.50,
};

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

export function PortfolioSummary() {
  const dailyTrend = portfolioData.dailyChange >= 0 ? 'up' : 'down';
  const totalTrend = portfolioData.totalPnL >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Portfolio Value"
        value={`$${portfolioData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        change={portfolioData.dailyChange}
        changePct={portfolioData.dailyChangePct}
        icon={ChartBarIcon}
        trend={dailyTrend}
      />
      <MetricCard
        title="Total P/L"
        value={`${portfolioData.totalPnL >= 0 ? '+' : ''}$${Math.abs(portfolioData.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        changePct={portfolioData.totalPnLPct}
        icon={portfolioData.totalPnL >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
        trend={totalTrend}
      />
      <MetricCard
        title="Positions"
        value={portfolioData.positionsCount.toString()}
        icon={ChartBarIcon}
        trend="neutral"
      />
      <MetricCard
        title="Cash Balance"
        value={`$${portfolioData.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        icon={BanknotesIcon}
        trend="neutral"
      />
    </div>
  );
}
