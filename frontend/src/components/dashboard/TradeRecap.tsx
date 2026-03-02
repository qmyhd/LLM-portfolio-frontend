'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import type { Activity } from '@/types/api';
import { formatMoney, formatDate, formatNumber } from '@/lib/format';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { useActivities } from '@/hooks/useActivities';

// ---------------------------------------------------------------------------
// Action badge configuration
// ---------------------------------------------------------------------------

interface BadgeConfig {
  icon: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

function getBadgeConfig(activity: Activity): BadgeConfig {
  const type = activity.activityType?.toUpperCase() ?? '';

  if (type === 'BUY') {
    return {
      icon: '\u25B2',
      label: 'BUY',
      badgeBg: 'bg-indigo-500/20',
      badgeText: 'text-indigo-400',
      borderColor: 'border-l-indigo-500',
    };
  }

  if (type === 'SELL') {
    // Positive amount = profitable sell, negative = losing sell
    const profitable = activity.amount > 0;
    return {
      icon: '\u25BC',
      label: 'SELL',
      badgeBg: profitable ? 'bg-profit/20' : 'bg-loss/20',
      badgeText: profitable ? 'text-profit' : 'text-loss',
      borderColor: profitable ? 'border-l-profit' : 'border-l-loss',
    };
  }

  if (type === 'DIVIDEND') {
    return {
      icon: '\u25CF',
      label: 'DIV',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-400',
      borderColor: 'border-l-blue-500',
    };
  }

  // Fallback for FEE or unknown types
  return {
    icon: '\u25CB',
    label: type || 'OTHER',
    badgeBg: 'bg-background-tertiary',
    badgeText: 'text-foreground-muted',
    borderColor: 'border-l-foreground-muted',
  };
}

// ---------------------------------------------------------------------------
// Detail line builder
// ---------------------------------------------------------------------------

function buildDetailLine(activity: Activity): string {
  const type = activity.activityType?.toUpperCase() ?? '';

  if (type === 'DIVIDEND') {
    return `${formatMoney(Math.abs(activity.amount))} dividend received`;
  }

  const parts: string[] = [];

  if (activity.units != null && activity.units !== 0) {
    const qty = Math.abs(activity.units);
    parts.push(`${formatNumber(qty, qty % 1 === 0 ? 0 : 4)} shares`);
  }

  if (activity.amount !== 0) {
    parts.push(formatMoney(Math.abs(activity.amount)));
  }

  return parts.join(' \u00B7 ') || '\u2014';
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function TradeRecapSkeleton() {
  return (
    <CardSpotlight className="card overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-border flex justify-between">
        <div className="h-5 w-28 bg-background-hover rounded" />
        <div className="h-5 w-16 bg-background-hover rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-1 rounded-full bg-background-hover" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-background-hover rounded" />
              <div className="h-3 w-48 bg-background-hover rounded" />
            </div>
            <div className="h-3 w-14 bg-background-hover rounded self-start" />
          </div>
        ))}
      </div>
    </CardSpotlight>
  );
}

// ---------------------------------------------------------------------------
// Activity card row
// ---------------------------------------------------------------------------

function ActivityRow({ activity }: { activity: Activity }) {
  const config = getBadgeConfig(activity);
  const date = activity.tradeDate ?? activity.settlementDate ?? '';

  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-lg border-l-[3px] px-3 py-2.5',
        'hover:bg-background-hover transition-colors',
        config.borderColor,
      )}
    >
      {/* Left: badge + content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Action badge */}
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold',
              config.badgeBg,
              config.badgeText,
            )}
          >
            {config.icon} {config.label}
          </span>

          {/* Ticker link */}
          {activity.symbol ? (
            <Link
              href={`/stock/${activity.symbol}`}
              className="font-mono font-semibold text-sm hover:text-primary transition-colors"
            >
              {activity.symbol}
            </Link>
          ) : (
            <span className="font-mono text-sm text-foreground-muted">
              {activity.description ?? '\u2014'}
            </span>
          )}

          {/* Price */}
          {activity.price != null && activity.price > 0 && (
            <span className="text-xs text-foreground-subtle font-mono">
              @ {formatMoney(activity.price)}
            </span>
          )}
        </div>

        {/* Detail line */}
        <p className="text-xs text-foreground-muted mt-1">
          {buildDetailLine(activity)}
        </p>
      </div>

      {/* Right: date */}
      <span className="text-xs text-foreground-subtle whitespace-nowrap shrink-0 pt-0.5">
        {formatDate(date, 'short')}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TradeRecap() {
  const { data, error, isLoading } = useActivities({ limit: 10 });

  if (isLoading) {
    return <TradeRecapSkeleton />;
  }

  if (error) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load trades</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </CardSpotlight>
    );
  }

  const activities: Activity[] = data?.activities ?? [];

  if (activities.length === 0) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-foreground-muted">No recent trades</p>
      </CardSpotlight>
    );
  }

  return (
    <CardSpotlight className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Recent Trades</h2>
        <Link
          href="/activity"
          className="text-sm text-primary hover:text-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Activity list */}
      <div className="p-4 space-y-2 stagger-fade-in">
        {activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>
    </CardSpotlight>
  );
}
