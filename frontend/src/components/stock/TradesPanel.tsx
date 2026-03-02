'use client';

import { clsx } from 'clsx';
import { formatMoney, formatNumber, formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useStockActivities } from '@/hooks/useStockActivities';
import type { StockActivity } from '@/types/api';

interface TradesPanelProps {
  ticker: string;
}

/** Left-border + badge color per activity type. */
function activityStyle(type: string | null): { border: string; badge: string; label: string } {
  const t = (type ?? '').toUpperCase();
  if (t === 'BUY') return { border: 'border-l-indigo-500', badge: 'bg-indigo-500/20 text-indigo-400', label: 'BUY' };
  if (t === 'SELL') return { border: 'border-l-loss', badge: 'bg-loss/20 text-loss', label: 'SELL' };
  if (t.startsWith('DIV')) return { border: 'border-l-blue-500', badge: 'bg-blue-500/20 text-blue-400', label: 'DIV' };
  return { border: 'border-l-foreground-muted', badge: 'bg-background-tertiary text-foreground-muted', label: t || '—' };
}

function TradeCard({ activity }: { activity: StockActivity }) {
  const style = activityStyle(activity.activityType);

  return (
    <div
      className={clsx(
        'card p-3 border-l-[3px] transition-colors hover:bg-background-tertiary/50',
        style.border,
      )}
    >
      {/* Top row: badge + date */}
      <div className="flex items-center justify-between mb-2">
        <span className={clsx('px-2 py-0.5 text-2xs font-semibold rounded', style.badge)}>
          {style.label}
        </span>
        <span className="text-xs text-foreground-subtle">
          {formatDate(activity.tradeDate, 'short')}
        </span>
      </div>

      {/* Detail row */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3 text-sm">
          {activity.price != null && (
            <span className="text-foreground-muted">
              @ <span className="text-foreground font-mono">{formatMoney(activity.price)}</span>
            </span>
          )}
          {activity.units != null && (
            <span className="text-foreground-muted">
              <span className="text-foreground font-mono">{formatNumber(Math.abs(activity.units), 4)}</span> units
            </span>
          )}
        </div>
        <span className="text-sm font-medium font-mono text-foreground">
          {formatMoney(Math.abs(activity.amount))}
        </span>
      </div>

      {/* Fee + description */}
      {(activity.fee > 0 || activity.description) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground-subtle">
          {activity.fee > 0 && <span>Fee: {formatMoney(activity.fee)}</span>}
          {activity.description && (
            <span className="truncate">{activity.description}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function TradesPanel({ ticker }: TradesPanelProps) {
  const { data, error, isLoading } = useStockActivities(ticker, 50);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton.Card key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-loss">Failed to load trades</p>
        <p className="text-xs text-foreground-subtle mt-1">{error.message}</p>
      </div>
    );
  }

  const activities = data?.activities ?? [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <EmptyState
            icon={ArrowsRightLeftIcon}
            title="No trades found"
            description={`No trade or dividend activity for ${ticker}`}
          />
        ) : (
          activities.map((a) => <TradeCard key={a.id} activity={a} />)
        )}
      </div>
    </div>
  );
}
