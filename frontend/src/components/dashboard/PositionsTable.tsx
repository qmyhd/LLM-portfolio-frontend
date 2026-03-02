'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePortfolio } from '@/hooks';
import type { Position } from '@/types/api';
import { formatMoney, formatSignedMoney, formatPercent, formatQuantity } from '@/lib/format';
import { pnlTextColor, pnlBgColor } from '@/lib/colors';
import { Select } from '@/components/ui/Select';
import { CardSpotlight } from '@/components/ui/CardSpotlight';

type SortKey = 'symbol' | 'equity' | 'openPnl' | 'openPnlPercent';
type FilterMode = 'all' | 'winners' | 'losers';

const COLLAPSE_KEY = 'dashboard_positions_collapsed';

export function PositionsTable() {
  const { data, error, isLoading } = usePortfolio();
  const [sortKey, setSortKey] = useState<SortKey>('equity');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize from localStorage, default collapsed on mobile
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    } else {
      setIsCollapsed(window.innerWidth < 1024);
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, String(next));
  };

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
      <CardSpotlight className="card overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-border flex justify-between">
          <div className="h-5 w-24 bg-background-hover rounded" />
          <div className="h-5 w-20 bg-background-hover rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-background-hover rounded" />
          ))}
        </div>
      </CardSpotlight>
    );
  }

  if (error) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load positions</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </CardSpotlight>
    );
  }

  const positions: Position[] = data?.positions ?? [];

  if (positions.length === 0) {
    return (
      <CardSpotlight className="card p-6">
        <EmptyState icon={BriefcaseIcon} title="No positions" description="Sync your brokerage to see holdings" />
      </CardSpotlight>
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
    <CardSpotlight className="card overflow-hidden">
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <h2 className="text-lg font-semibold">Positions</h2>
          <span className="text-sm text-foreground-muted">
            ({positions.length})
          </span>
          {isCollapsed ? (
            <ChevronDownIcon className="w-4 h-4 text-foreground-muted" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-foreground-muted" />
          )}
        </button>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-foreground-muted" />
            <Select
              value={filter}
              onChange={(v) => setFilter(v as FilterMode)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'winners', label: 'Winners' },
                { value: 'losers', label: 'Losers' },
              ]}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Collapsed summary: show totals even when hidden */}
      {isCollapsed && (
        <div className="px-5 py-3 flex items-center gap-6 text-sm border-b border-border">
          <span className="text-foreground-muted">
            Total Value: <span className="font-mono font-medium text-foreground">{formatMoney(positions.reduce((s, p) => s + p.equity, 0))}</span>
          </span>
          <span className="text-foreground-muted">
            P/L:{' '}
            <span className={`font-mono font-medium ${pnlTextColor(positions.reduce((s, p) => s + p.openPnl, 0))}`}>
              {formatSignedMoney(positions.reduce((s, p) => s + p.openPnl, 0))}
            </span>
          </span>
        </div>
      )}

      {/* Table - hidden when collapsed */}
      {!isCollapsed && <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-tertiary">
              <th
                scope="col"
                className="table-header text-left cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('symbol')}
              >
                Symbol <SortIcon column="symbol" />
              </th>
              <th scope="col" className="table-header text-right hidden sm:table-cell">Qty</th>
              <th scope="col" className="table-header text-right hidden md:table-cell">Price</th>
              <th scope="col" className="table-header text-right hidden xl:table-cell">Avg Cost</th>
              <th
                scope="col"
                className="table-header text-right cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('equity')}
              >
                Value <SortIcon column="equity" />
              </th>
              <th
                scope="col"
                className="table-header text-right cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('openPnl')}
              >
                P/L <SortIcon column="openPnl" />
              </th>
              <th
                scope="col"
                className="table-header text-right cursor-pointer hover:text-foreground select-none"
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
                  {formatQuantity(position.quantity)}
                </td>
                <td className="table-cell text-right font-mono hidden md:table-cell">
                  {formatMoney(position.currentPrice)}
                </td>
                <td className="table-cell text-right font-mono text-foreground-muted hidden xl:table-cell">
                  {position.averageBuyPrice != null
                    ? formatMoney(position.averageBuyPrice)
                    : '—'}
                </td>
                <td className="table-cell text-right font-mono">
                  {formatMoney(position.equity)}
                </td>
                <td className={`table-cell text-right font-mono ${pnlTextColor(position.openPnl)}`}>
                  {formatSignedMoney(position.openPnl)}
                </td>
                <td className={`table-cell text-right font-mono font-medium ${pnlTextColor(position.openPnlPercent)}`}>
                  <span className={`px-2 py-1 rounded ${pnlBgColor(position.openPnlPercent)}`}>
                    {formatPercent(position.openPnlPercent, 2, { showSign: true })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-5 py-3 border-t border-border bg-background-tertiary">
          <p className="text-sm text-foreground-muted">
            Showing {sortedData.length} of {positions.length} positions
          </p>
        </div>
      )}
    </CardSpotlight>
  );
}
