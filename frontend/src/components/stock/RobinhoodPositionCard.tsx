'use client';

import { useState, useEffect } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import type { StockProfileCurrent } from '@/types/api';
import { toUiStockPosition, type UiStockPosition } from '@/lib/mappers';
import { formatMoney, formatSignedMoney, formatPercent, formatNumber } from '@/lib/format';
import { pnlTextColor } from '@/lib/colors';
import { PortfolioDiversityRing } from './PortfolioDiversityRing';

interface RobinhoodPositionCardProps {
  ticker: string;
}

export function RobinhoodPositionCard({ ticker }: RobinhoodPositionCardProps) {
  const [position, setPosition] = useState<UiStockPosition | null>(null);
  const [diversity, setDiversity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stock profile (has position data)
        const res = await fetch(`/api/stocks/${ticker}`);
        const data: StockProfileCurrent = await res.json();
        setPosition(toUiStockPosition(data));

        // Fetch portfolio for diversity calculation
        const portfolioRes = await fetch('/api/portfolio');
        if (portfolioRes.ok) {
          const portfolioData = await portfolioRes.json();
          const posMatch = portfolioData.positions?.find(
            (p: { symbol: string }) => p.symbol === ticker,
          );
          if (posMatch?.portfolioDiversity != null) {
            setDiversity(posMatch.portfolioDiversity);
          } else if (posMatch && portfolioData.summary?.totalEquity > 0) {
            setDiversity((posMatch.equity / portfolioData.summary.totalEquity) * 100);
          }
        }
      } catch {
        setPosition(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-6 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-foreground-muted mb-2">
          <BanknotesIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Your Position</span>
        </div>
        <p className="text-sm text-foreground-muted">No position in {ticker}</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-foreground-muted mb-4">
        <BanknotesIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Your position</span>
      </div>

      {/* Shares + Market value row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-foreground-muted mb-1">Shares</p>
          <p className="text-lg font-bold font-mono">{formatNumber(position.quantity, 4)}</p>
        </div>
        <div>
          <p className="text-xs text-foreground-muted mb-1">Market value</p>
          <p className="text-lg font-bold font-mono">{formatMoney(position.marketValue)}</p>
        </div>
      </div>

      {/* Average cost + Diversity ring row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-foreground-muted mb-1">Average cost</p>
          <p className="text-base font-mono font-semibold">{formatMoney(position.averageCost)}</p>
        </div>
        {diversity != null && (
          <div className="text-center">
            <p className="text-xs text-foreground-muted mb-1">Diversity</p>
            <PortfolioDiversityRing percentage={diversity} size={56} />
          </div>
        )}
      </div>

      {/* Today's return */}
      <div className="py-3 border-t border-border">
        <p className="text-xs text-foreground-muted mb-1">Today's return</p>
        <span className={`text-sm font-semibold font-mono ${pnlTextColor(position.dayChange)}`}>
          {formatSignedMoney(position.dayChange)}{' '}
          ({formatPercent(position.dayChangePercent, 2, { showSign: true })})
        </span>
      </div>

      {/* Total return */}
      <div className="py-3 border-t border-border">
        <p className="text-xs text-foreground-muted mb-1">Total return</p>
        <span className={`text-sm font-semibold font-mono ${pnlTextColor(position.unrealizedPL)}`}>
          {formatSignedMoney(position.unrealizedPL)}{' '}
          ({formatPercent(position.unrealizedPLPercent, 2, { showSign: true })})
        </span>
      </div>
    </div>
  );
}
