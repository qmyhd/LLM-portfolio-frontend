'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import type { Activity } from '@/types/api';
import { formatMoney, formatNumber, formatDate } from '@/lib/format';

const TYPE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  BUY: { label: 'BUY', color: 'bg-profit/15 text-profit', border: 'border-l-profit' },
  SELL: { label: 'SELL', color: 'bg-loss/15 text-loss', border: 'border-l-loss' },
  DIVIDEND: { label: 'DIV', color: 'bg-primary/15 text-primary', border: 'border-l-primary' },
  FEE: { label: 'FEE', color: 'bg-foreground-muted/15 text-foreground-muted', border: 'border-l-foreground-muted' },
};

interface TradeCardProps {
  activity: Activity;
}

export function TradeCard({ activity }: TradeCardProps) {
  const type = (activity.activityType ?? 'FEE').toUpperCase();
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.FEE;
  const symbol = activity.symbol;
  const hasSymbol = symbol && symbol.trim() !== '';

  const content = (
    <div
      className={clsx(
        'border-l-4 p-4',
        config.border,
        hasSymbol ? 'card-hover hover:bg-background-hover cursor-pointer' : 'card transition-colors',
      )}
    >
      {/* Top row: badge + symbol + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={clsx('text-xs font-bold px-2 py-0.5 rounded', config.color)}>
            {config.label}
          </span>
          {hasSymbol && (
            <span className="font-mono font-semibold text-base">{symbol}</span>
          )}
        </div>
        <span className="text-xs text-foreground-muted">
          {formatDate(activity.tradeDate, 'short')}
        </span>
      </div>

      {/* Details row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground-muted">
          {activity.units != null && activity.price != null ? (
            <>
              {formatNumber(activity.units, 4)} shares @ {formatMoney(activity.price)}
            </>
          ) : activity.description ? (
            <span className="truncate max-w-[300px] inline-block">{activity.description}</span>
          ) : null}
        </div>
        <div className="text-right">
          <span className="font-mono font-semibold text-sm text-foreground">
            {formatMoney(Math.abs(activity.amount))}
          </span>
          {activity.fee != null && activity.fee > 0 && (
            <div className="text-xs text-foreground-muted">
              Fee: {formatMoney(activity.fee)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (hasSymbol) {
    return <Link href={`/stock/${symbol}`}>{content}</Link>;
  }

  return content;
}
