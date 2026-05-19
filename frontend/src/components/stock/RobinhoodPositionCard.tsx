'use client';

import { useState, useEffect } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import type { Position } from '@/types/api';
import { formatMoney, formatSignedMoney, formatPercent, formatQuantity } from '@/lib/format';
import { pnlTextColor } from '@/lib/colors';

interface RobinhoodPositionCardProps {
  ticker: string;
}

interface AggregatedPosition {
  totalShares: number;
  totalValue: number;
  totalCost: number;
  weightedAvgCost: number;
  dayChange: number;
  dayChangePct: number | null;
  unrealizedPL: number;
  unrealizedPLPct: number;
  diversity: number | null;
  accounts: { name: string; shares: number; value: number }[];
}

function aggregatePositions(positions: Position[], totalEquity: number): AggregatedPosition {
  const totalShares = positions.reduce((s, p) => s + p.quantity, 0);
  const totalValue = positions.reduce((s, p) => s + p.equity, 0);
  const totalCost = positions.reduce((s, p) => s + p.quantity * p.averageBuyPrice, 0);
  const weightedAvgCost = totalShares > 0 ? totalCost / totalShares : 0;
  const dayChange = positions.reduce((s, p) => s + (p.dayChange ?? 0), 0);
  const unrealizedPL = totalValue - totalCost;
  const unrealizedPLPct = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

  // Day change pct: weighted by equity
  let dayChangePct: number | null = null;
  const positionsWithDay = positions.filter((p) => p.dayChangePercent != null);
  if (positionsWithDay.length > 0) {
    const weightedSum = positionsWithDay.reduce((s, p) => s + (p.dayChangePercent ?? 0) * p.equity, 0);
    const totalEq = positionsWithDay.reduce((s, p) => s + p.equity, 0);
    dayChangePct = totalEq > 0 ? weightedSum / totalEq : null;
  }

  const diversity = totalEquity > 0 ? (totalValue / totalEquity) * 100 : null;

  const accounts = positions.map((p) => ({
    name: p.accountId,
    shares: p.quantity,
    value: p.equity,
  }));

  return { totalShares, totalValue, totalCost, weightedAvgCost, dayChange, dayChangePct, unrealizedPL, unrealizedPLPct, diversity, accounts };
}

export function RobinhoodPositionCard({ ticker }: RobinhoodPositionCardProps) {
  const [agg, setAgg] = useState<AggregatedPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) { setAgg(null); return; }
        const data = await res.json();
        const positions: Position[] = (data.positions || []).filter(
          (p: Position) => p.symbol === ticker,
        );
        if (positions.length === 0) { setAgg(null); return; }
        const totalEquity = data.summary?.totalEquity ?? 0;
        setAgg(aggregatePositions(positions, totalEquity));
      } catch {
        setAgg(null);
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

  if (!agg) {
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
      <div className="flex items-center gap-2 text-foreground-muted mb-3">
        <BanknotesIcon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Your Position</span>
      </div>

      {/* Hero: Total Return */}
      <div className="text-center mb-4 py-2">
        <p className={`text-2xl font-bold font-mono tabular-nums ${pnlTextColor(agg.unrealizedPL)}`}>
          {formatSignedMoney(agg.unrealizedPL)}
        </p>
        <p className={`text-sm font-semibold font-mono tabular-nums ${pnlTextColor(agg.unrealizedPL)}`}>
          {agg.unrealizedPL >= 0 ? '▲' : '▼'} {formatPercent(agg.unrealizedPLPct, 2)}
        </p>
        <p className="text-xs text-foreground-muted mt-0.5">Total return</p>
      </div>

      {/* 2×2 Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden mb-3">
        <div className="bg-background p-3">
          <p className="text-lg font-bold font-mono tabular-nums">{formatQuantity(agg.totalShares)}</p>
          <p className="text-xs text-foreground-muted mt-0.5">Shares</p>
        </div>
        <div className="bg-background p-3">
          <p className="text-lg font-bold font-mono tabular-nums">{formatMoney(agg.totalValue)}</p>
          <p className="text-xs text-foreground-muted mt-0.5">Market Value</p>
        </div>
        <div className="bg-background p-3">
          <p className="text-lg font-bold font-mono tabular-nums">{formatMoney(agg.weightedAvgCost)}</p>
          <p className="text-xs text-foreground-muted mt-0.5">Avg Cost</p>
        </div>
        <div className="bg-background p-3">
          {agg.diversity != null ? (
            <>
              <p className="text-lg font-bold font-mono tabular-nums">{formatPercent(agg.diversity, 1)}</p>
              <p className="text-xs text-foreground-muted mt-0.5">Portfolio</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold font-mono tabular-nums text-foreground-muted">—</p>
              <p className="text-xs text-foreground-muted mt-0.5">Portfolio</p>
            </>
          )}
        </div>
      </div>

      {/* Footer: Today's return */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground-muted">Today&apos;s return</span>
        <span className={`font-semibold font-mono tabular-nums ${pnlTextColor(agg.dayChange)}`}>
          {formatSignedMoney(agg.dayChange)}
          {agg.dayChangePct != null && (
            <span className="ml-1 text-foreground-muted font-normal">
              ({formatPercent(agg.dayChangePct, 2, { showSign: true })})
            </span>
          )}
        </span>
      </div>

      {/* Per-account breakdown (only if multiple accounts) */}
      {agg.accounts.length > 1 && (
        <div className="pt-3 mt-3 border-t border-border">
          <p className="text-xs text-foreground-muted mb-2">Accounts</p>
          <div className="space-y-1.5">
            {agg.accounts.map((acct) => (
              <div key={acct.name} className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted truncate max-w-[120px]" title={acct.name}>
                  {acct.name.length > 8 ? `${acct.name.slice(0, 8)}…` : acct.name}
                </span>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className="text-foreground-muted">{formatQuantity(acct.shares)} sh</span>
                  <span className="text-foreground">{formatMoney(acct.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
