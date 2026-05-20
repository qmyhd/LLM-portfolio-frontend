'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { formatMoney, formatNumber, formatDate, formatPercent } from '@/lib/format';
import { pnlTextColor } from '@/lib/colors';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';
import type { EnrichedTrade } from '@/types/api';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BlossomTradeCardProps {
  trade: EnrichedTrade;
  /** Show ticker symbol (used on dashboard). Hidden on per-stock pages. */
  showSymbol?: boolean;
  /** Compact mode strips the metric boxes at the bottom (for dashboard rows). */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

interface TradeStyle {
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
  label: string;
}

function getTradeStyle(trade: EnrichedTrade): TradeStyle {
  const type = trade.type.toUpperCase();

  if (type === 'BUY') {
    return {
      borderColor: 'border-l-indigo-500',
      badgeBg: 'bg-indigo-500/20',
      badgeText: 'text-indigo-400',
      icon: '\u25B2',
      label: 'BUY',
    };
  }

  if (type === 'SELL') {
    // realizedPnl is null when the position is fully closed (no current cost
    // basis available) or when the backend can't compute P/L. Default to a
    // neutral style in that case rather than falsely flagging the SELL as
    // profitable.
    if (trade.realizedPnl == null) {
      return {
        borderColor: 'border-l-foreground-muted',
        badgeBg: 'bg-foreground-muted/20',
        badgeText: 'text-foreground-muted',
        icon: '\u25BC',
        label: 'SELL',
      };
    }
    const profitable = trade.realizedPnl >= 0;
    return {
      borderColor: profitable ? 'border-l-profit' : 'border-l-loss',
      badgeBg: profitable ? 'bg-profit/20' : 'bg-loss/20',
      badgeText: profitable ? 'text-profit' : 'text-loss',
      icon: '\u25BC',
      label: 'SELL',
    };
  }

  if (type === 'DIVIDEND') {
    return {
      borderColor: 'border-l-blue-500',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-400',
      icon: '\u25CF',
      label: 'DIV',
    };
  }

  // FEE or unknown
  return {
    borderColor: 'border-l-foreground-muted',
    badgeBg: 'bg-background-tertiary',
    badgeText: 'text-foreground-muted',
    icon: '\u25CB',
    label: type || 'OTHER',
  };
}

/** Build the action description, e.g. "Bought 10 shares @ $150.25" */
function buildActionText(trade: EnrichedTrade): string {
  const type = trade.type.toUpperCase();

  if (type === 'DIVIDEND') {
    return `${formatMoney(Math.abs(trade.amount))} dividend received`;
  }

  const verb = type === 'BUY' ? 'Bought' : type === 'SELL' ? 'Sold' : type;
  const parts: string[] = [verb];

  if (trade.units != null && trade.units !== 0) {
    const qty = Math.abs(trade.units);
    const formatted = qty % 1 === 0 ? formatNumber(qty, 0) : formatNumber(qty, 4);
    parts.push(`${formatted} shares`);
  }

  if (trade.price != null && trade.price > 0) {
    parts.push(`@ ${formatMoney(trade.price)}`);
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlossomTradeCard({ trade, showSymbol = true, compact = false }: BlossomTradeCardProps) {
  const style = getTradeStyle(trade);
  const type = trade.type.toUpperCase();
  const isSell = type === 'SELL';
  const isBuy = type === 'BUY';
  const bucket = useBucket();

  return (
    <div
      className={clsx(
        'card border-l-[3px] transition-colors hover:bg-background-tertiary/50',
        compact ? 'px-3 py-2.5' : 'p-3',
        style.borderColor,
      )}
    >
      {/* Top row: badge + symbol + date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Action badge */}
          <span
            className={clsx(
              'inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md text-2xs font-semibold',
              style.badgeBg,
              style.badgeText,
            )}
          >
            {style.icon} {style.label}
          </span>

          {/* Ticker link */}
          {showSymbol && (
            <Link
              href={stockHref(trade.symbol, bucket)}
              className="font-mono font-semibold text-sm hover:text-primary transition-colors truncate"
            >
              {trade.symbol}
            </Link>
          )}
        </div>

        {/* Date */}
        <span className="text-xs text-foreground-subtle whitespace-nowrap shrink-0">
          {formatDate(trade.tradeDate, 'short')}
        </span>
      </div>

      {/* Action text: "Bought 10 shares @ $150.25" */}
      <p className="text-sm text-foreground-muted mt-1.5">
        {buildActionText(trade)}
      </p>

      {/* Realized P/L line for SELL trades */}
      {isSell && trade.realizedPnl != null && (
        <p className={clsx('text-sm font-medium font-mono mt-1', pnlTextColor(trade.realizedPnl))}>
          {trade.realizedPnl >= 0 ? '+' : ''}{formatMoney(trade.realizedPnl)}
          {trade.realizedPnlPct != null && (
            <span className="text-xs ml-1">
              ({trade.realizedPnlPct >= 0 ? '+' : ''}{formatPercent(trade.realizedPnlPct, 1)})
            </span>
          )}
        </p>
      )}

      {/* Metric boxes — hidden in compact mode */}
      {!compact && (isBuy || isSell) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {isBuy && (
            <>
              {/* Portfolio % */}
              <div className="bg-background-tertiary/50 rounded-lg px-3 py-2">
                <p className="text-2xs text-foreground-subtle">Portfolio %</p>
                <p className="text-sm font-mono font-medium text-foreground">
                  {trade.portfolioPct != null ? formatPercent(trade.portfolioPct, 1) : '\u2014'}
                </p>
              </div>
              {/* Position P/L */}
              <div className="bg-background-tertiary/50 rounded-lg px-3 py-2">
                <p className="text-2xs text-foreground-subtle">Position P/L</p>
                <p className={clsx('text-sm font-mono font-medium', pnlTextColor(trade.unrealizedPnl))}>
                  {trade.unrealizedPnl != null ? (
                    <>
                      {trade.unrealizedPnl >= 0 ? '+' : ''}{formatMoney(trade.unrealizedPnl)}
                    </>
                  ) : (
                    '\u2014'
                  )}
                </p>
              </div>
            </>
          )}
          {isSell && (
            <>
              {/* Avg Cost */}
              <div className="bg-background-tertiary/50 rounded-lg px-3 py-2">
                <p className="text-2xs text-foreground-subtle">Avg Cost</p>
                <p className="text-sm font-mono font-medium text-foreground">
                  {trade.avgCost != null ? formatMoney(trade.avgCost) : '\u2014'}
                </p>
              </div>
              {/* Portfolio % */}
              <div className="bg-background-tertiary/50 rounded-lg px-3 py-2">
                <p className="text-2xs text-foreground-subtle">Portfolio %</p>
                <p className="text-sm font-mono font-medium text-foreground">
                  {trade.portfolioPct != null ? formatPercent(trade.portfolioPct, 1) : '\u2014'}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fee + description (non-compact only) */}
      {!compact && (trade.fee > 0 || trade.description) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-foreground-subtle">
          {trade.fee > 0 && <span>Fee: {formatMoney(trade.fee)}</span>}
          {trade.description && (
            <span className="truncate">{trade.description}</span>
          )}
        </div>
      )}
    </div>
  );
}
