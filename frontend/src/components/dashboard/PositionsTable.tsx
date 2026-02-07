'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import type { Position } from '@/types/api';

type SortKey = 'symbol' | 'equity' | 'openPnl' | 'openPnlPercent';
type FilterMode = 'all' | 'winners' | 'losers';

export function PositionsTable() {
  const { data, error, isLoading } = usePortfolio();
  const [sortKey, setSortKey] = useState<SortKey>('equity');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortAsc ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="card overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-border flex justify-between">
          <div className="h-5 w-24 bg-background-hover rounded" />
          <div className="h-5 w-20 bg-background-hover rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-background-hover rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load positions</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </div>
    );
  }

  const positions: Position[] = data?.positions ?? [];

  if (positions.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-foreground-muted">No open positions</p>
      </div>
    );
  }

  const filteredData = positions.filter(p => {
    if (filter === 'winners') return p.openPnl > 0;
    if (filter === 'losers') return p.openPnl < 0;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? ((aVal as number) ?? 0) - ((bVal as number) ?? 0)
      : ((bVal as number) ?? 0) - ((aVal as number) ?? 0);
  });

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Positions</h2>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-foreground-muted" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
            className="bg-background-hover border border-border rounded-md px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="winners">Winners</option>
            <option value="losers">Losers</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-tertiary">
              <th
                className="table-header text-left cursor-pointer hover:text-foreground"
                onClick={() => handleSort('symbol')}
              >
                Symbol <SortIcon column="symbol" />
              </th>
              <th className="table-header text-right hidden sm:table-cell">Qty</th>
              <th className="table-header text-right hidden md:table-cell">Price</th>
              <th
                className="table-header text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort('equity')}
              >
                Value <SortIcon column="equity" />
              </th>
              <th
                className="table-header text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort('openPnl')}
              >
                P/L <SortIcon column="openPnl" />
              </th>
              <th
                className="table-header text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort('openPnlPercent')}
              >
                P/L % <SortIcon column="openPnlPercent" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((position) => (
              <tr key={position.symbol} className="table-row">
                <td className="table-cell">
                  <Link 
                    href={`/stock/${position.symbol}`}
                    className="hover:text-primary transition-colors"
                  >
                    <div className="font-mono font-semibold">{position.symbol}</div>
                  </Link>
                </td>
                <td className="table-cell text-right font-mono hidden sm:table-cell">
                  {position.quantity}
                </td>
                <td className="table-cell text-right font-mono hidden md:table-cell">
                  ${position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="table-cell text-right font-mono">
                  ${position.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={clsx(
                    'table-cell text-right font-mono',
                    position.openPnl >= 0 ? 'text-profit' : 'text-loss'
                  )}
                >
                  {position.openPnl >= 0 ? '+' : ''}${position.openPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={clsx(
                    'table-cell text-right font-mono font-medium',
                    position.openPnlPercent >= 0 ? 'text-profit' : 'text-loss'
                  )}
                >
                  <span className={clsx(
                    'px-2 py-1 rounded',
                    position.openPnlPercent >= 0 ? 'bg-profit/10' : 'bg-loss/10'
                  )}>
                    {position.openPnlPercent >= 0 ? '+' : ''}{position.openPnlPercent.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-background-tertiary">
        <p className="text-sm text-foreground-muted">
          Showing {sortedData.length} of {positions.length} positions
        </p>
      </div>
    </div>
  );
}
