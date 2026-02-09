'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import type { StockProfileCurrent } from '@/types/api';
import { toUiStockPosition, type UiStockPosition } from '@/lib/mappers';
import { formatMoney, formatPercent } from '@/lib/format';

interface PositionCardProps {
  ticker: string;
}

export function PositionCard({ ticker }: PositionCardProps) {
  const [position, setPosition] = useState<UiStockPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosition();
  }, [ticker]);

  const fetchPosition = async () => {
    try {
      const res = await fetch(`/api/stocks/${ticker}`);
      const data: StockProfileCurrent = await res.json();
      setPosition(toUiStockPosition(data));
    } catch (error) {
      console.error('Failed to fetch position:', error);
      setPosition(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="skeleton h-4 w-20 mb-3 rounded" />
        <div className="skeleton h-6 w-24 mb-2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-muted mb-3">
          <BanknotesIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Your Position</span>
        </div>
        <p className="text-sm text-muted">No position in {ticker}</p>
        <button className="mt-3 btn-primary text-xs py-1.5 px-3 w-full">
          Trade {ticker}
        </button>
      </div>
    );
  }

  const isProfitable = position.unrealizedPL >= 0;
  const isDayPositive = position.dayChange >= 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted">
          <BanknotesIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Your Position</span>
        </div>
        <span className="text-xs text-muted">{position.quantity} shares</span>
      </div>

      {/* Market Value */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-foreground">
          {formatMoney(position.marketValue)}
        </p>
      </div>

      {/* P/L Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Total P/L */}
        <div>
          <p className="text-xs text-muted mb-1">Total P/L</p>
          <div className={`flex items-center gap-1 font-medium ${isProfitable ? 'text-profit' : 'text-loss'}`}>
            {isProfitable ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
            <span>
              {isProfitable ? '+' : ''}{formatMoney(Math.abs(position.unrealizedPL))}
            </span>
            <span className="text-xs">
              ({formatPercent(position.unrealizedPLPercent, 2, { showSign: true })})
            </span>
          </div>
        </div>

        {/* Day Change */}
        <div>
          <p className="text-xs text-muted mb-1">Today</p>
          <div className={`flex items-center gap-1 font-medium ${isDayPositive ? 'text-profit' : 'text-loss'}`}>
            {isDayPositive ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
            <span>
              {formatPercent(position.dayChangePercent, 2, { showSign: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Cost Basis */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Avg Cost</span>
          <span className="font-mono text-foreground">{formatMoney(position.averageCost)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted">Current</span>
          <span className="font-mono text-foreground">{formatMoney(position.currentPrice)}</span>
        </div>
      </div>
    </div>
  );
}
