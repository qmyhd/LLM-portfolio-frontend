'use client';

import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePortfolio, useSparklines } from '@/hooks';
import type { Position } from '@/types/api';
import type { HoldingSortMode } from './ValuePill';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { HoldingRow } from './HoldingRow';
import { SortModeSelector } from './SortModeSelector';

function getSortValue(position: Position, mode: HoldingSortMode): number | string {
  switch (mode) {
    case 'symbol':
      return position.symbol;
    case 'lastPrice':
      return position.currentPrice;
    case 'percentChange':
      return position.openPnlPercent;
    case 'equity':
      return position.equity;
    case 'todaysReturn':
      return position.dayChange ?? 0;
    case 'totalReturn':
      return position.openPnl;
    case 'totalReturnPercent':
      return position.openPnlPercent;
  }
}

export function HoldingsList() {
  const { data, error, isLoading, refresh } = usePortfolio();
  const [sortMode, setSortMode] = useState<HoldingSortMode>('equity');
  const [sortAsc, setSortAsc] = useState(false);
  const [sparklinePeriod, setSparklinePeriod] = useState<'1W' | '1M'>('1W');
  const { sparklinesMap } = useSparklines(sparklinePeriod);

  const handleSortChange = (mode: HoldingSortMode) => {
    if (mode === sortMode) {
      setSortAsc(!sortAsc);
    } else {
      setSortMode(mode);
      setSortAsc(mode === 'symbol'); // Alphabetical defaults to ascending
    }
  };

  const sortedPositions = useMemo(() => {
    const positions = data?.positions ?? [];
    return [...positions].sort((a, b) => {
      const aVal = getSortValue(a, sortMode);
      const bVal = getSortValue(b, sortMode);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortAsc ? diff : -diff;
    });
  }, [data?.positions, sortMode, sortAsc]);

  if (isLoading) {
    return (
      <CardSpotlight className="card animate-pulse">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-5 w-32 bg-background-hover rounded" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 px-4 py-3">
              <div className="h-4 w-full bg-background-hover rounded" />
            </div>
          ))}
        </div>
      </CardSpotlight>
    );
  }

  if (error) {
    return (
      <CardSpotlight className="card p-5">
        <p className="text-loss text-sm mb-2">Failed to load positions</p>
        <p className="text-foreground-muted text-xs mb-3">{error.message}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Retry
        </button>
      </CardSpotlight>
    );
  }

  if (!sortedPositions.length) {
    return (
      <CardSpotlight className="card p-5 text-center">
        <p className="text-foreground-muted text-sm">No positions</p>
      </CardSpotlight>
    );
  }

  return (
    <CardSpotlight className="card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">
              Holdings
              <span className="ml-1.5 text-xs font-normal text-foreground-muted">
                ({sortedPositions.length})
              </span>
            </h2>
            {/* Sparkline period toggle */}
            <div className="flex items-center gap-0.5 bg-background-tertiary p-0.5 rounded">
              {(['1W', '1M'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSparklinePeriod(p)}
                  className={clsx(
                    'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                    sparklinePeriod === p
                      ? 'bg-background-hover text-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <SortModeSelector value={sortMode} onChange={handleSortChange} />
        </div>
      </div>

      {/* Rows */}
      <div>
        {sortedPositions.map((position) => (
          <HoldingRow
            key={position.symbol}
            position={position}
            sparklineData={sparklinesMap[position.symbol]}
            sortMode={sortMode}
          />
        ))}
      </div>
    </CardSpotlight>
  );
}
