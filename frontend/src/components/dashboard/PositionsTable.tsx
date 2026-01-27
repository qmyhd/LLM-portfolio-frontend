'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// Mock positions data
const positionsData = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', qty: 50, price: 875.43, value: 43771.50, avgCost: 485.20, pnl: 19511.50, pnlPct: 80.41 },
  { symbol: 'AAPL', name: 'Apple Inc.', qty: 100, price: 178.52, value: 17852.00, avgCost: 145.30, pnl: 3322.00, pnlPct: 22.86 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', qty: 45, price: 425.18, value: 19133.10, avgCost: 380.50, pnl: 2010.60, pnlPct: 11.74 },
  { symbol: 'TSLA', name: 'Tesla Inc.', qty: 30, price: 248.75, value: 7462.50, avgCost: 195.40, pnl: 1600.50, pnlPct: 27.29 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', qty: 25, price: 175.32, value: 4383.00, avgCost: 158.75, pnl: 414.25, pnlPct: 10.44 },
  { symbol: 'META', name: 'Meta Platforms', qty: 20, price: 585.42, value: 11708.40, avgCost: 450.20, pnl: 2704.40, pnlPct: 30.02 },
  { symbol: 'AMD', name: 'AMD Inc.', qty: 75, price: 165.80, value: 12435.00, avgCost: 142.50, pnl: 1747.50, pnlPct: 16.35 },
  { symbol: 'PLTR', name: 'Palantir', qty: 200, price: 25.43, value: 5086.00, avgCost: 28.50, pnl: -614.00, pnlPct: -10.77 },
];

type SortKey = 'symbol' | 'value' | 'pnl' | 'pnlPct';
type FilterMode = 'all' | 'winners' | 'losers';

export function PositionsTable() {
  const [sortKey, setSortKey] = useState<SortKey>('value');
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

  const filteredData = positionsData.filter(p => {
    if (filter === 'winners') return p.pnl > 0;
    if (filter === 'losers') return p.pnl < 0;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortAsc ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

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
                onClick={() => handleSort('value')}
              >
                Value <SortIcon column="value" />
              </th>
              <th
                className="table-header text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort('pnl')}
              >
                P/L <SortIcon column="pnl" />
              </th>
              <th
                className="table-header text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort('pnlPct')}
              >
                P/L % <SortIcon column="pnlPct" />
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
                    <div className="text-xs text-foreground-muted hidden sm:block">{position.name}</div>
                  </Link>
                </td>
                <td className="table-cell text-right font-mono hidden sm:table-cell">
                  {position.qty}
                </td>
                <td className="table-cell text-right font-mono hidden md:table-cell">
                  ${position.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="table-cell text-right font-mono">
                  ${position.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={clsx(
                    'table-cell text-right font-mono',
                    position.pnl >= 0 ? 'text-profit' : 'text-loss'
                  )}
                >
                  {position.pnl >= 0 ? '+' : ''}${position.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={clsx(
                    'table-cell text-right font-mono font-medium',
                    position.pnlPct >= 0 ? 'text-profit' : 'text-loss'
                  )}
                >
                  <span className={clsx(
                    'px-2 py-1 rounded',
                    position.pnlPct >= 0 ? 'bg-profit/10' : 'bg-loss/10'
                  )}>
                    {position.pnlPct >= 0 ? '+' : ''}{position.pnlPct.toFixed(2)}%
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
          Showing {sortedData.length} of {positionsData.length} positions
        </p>
      </div>
    </div>
  );
}
