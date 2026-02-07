'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

interface Position {
  symbol: string;
  companyName: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector: string;
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'pl' | 'dayChange'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setPositions(data.positions || []);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncBrokerage = async () => {
    setSyncing(true);
    try {
      await fetch('/api/portfolio', { method: 'POST' });
      await fetchPositions();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const sortedPositions = [...positions].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'value':
        comparison = a.marketValue - b.marketValue;
        break;
      case 'pl':
        comparison = a.unrealizedPLPercent - b.unrealizedPLPercent;
        break;
      case 'dayChange':
        comparison = a.dayChangePercent - b.dayChangePercent;
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const totalDayChange = positions.reduce((sum, p) => sum + (p.dayChange * p.quantity), 0);

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Positions</h1>
          <p className="text-muted">Your current holdings</p>
        </div>
        
        <button
          onClick={syncBrokerage}
          disabled={syncing}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Brokerage'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-muted">Total Value</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Total Cost</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Unrealized P/L</p>
          <p className={`mt-1 text-2xl font-bold ${totalPL >= 0 ? 'text-profit' : 'text-loss'}`}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className="ml-2 text-sm">
              ({totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%)
            </span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Day Change</p>
          <p className={`mt-1 text-2xl font-bold ${totalDayChange >= 0 ? 'text-profit' : 'text-loss'}`}>
            {totalDayChange >= 0 ? '+' : ''}${totalDayChange.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted">
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Avg Cost</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th 
                  className="cursor-pointer px-4 py-3 font-medium text-right hover:text-foreground"
                  onClick={() => toggleSort('value')}
                >
                  Value {sortBy === 'value' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="cursor-pointer px-4 py-3 font-medium text-right hover:text-foreground"
                  onClick={() => toggleSort('pl')}
                >
                  P/L {sortBy === 'pl' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="cursor-pointer px-4 py-3 font-medium text-right hover:text-foreground"
                  onClick={() => toggleSort('dayChange')}
                >
                  Day {sortBy === 'dayChange' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-16 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted">
                    No positions found
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos) => (
                  <tr key={pos.symbol} className="table-row">
                    <td className="px-4 py-3">
                      <a
                        href={`/stock/${pos.symbol}`}
                        className="font-bold text-foreground hover:text-accent"
                      >
                        {pos.symbol}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {pos.companyName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {pos.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted">
                      ${pos.averageCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      ${pos.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                      ${pos.marketValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono text-sm font-medium ${
                        pos.unrealizedPL >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {pos.unrealizedPL >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3" />
                        )}
                        {pos.unrealizedPLPercent >= 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${
                        pos.dayChangePercent >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {pos.dayChangePercent >= 0 ? '+' : ''}{pos.dayChangePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/stock/${pos.symbol}`}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-tertiary hover:text-foreground"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sector Breakdown */}
      {!loading && positions.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-4 font-medium text-foreground">Sector Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(
              positions.reduce((acc, pos) => {
                const sector = pos.sector || 'Other';
                acc[sector] = (acc[sector] || 0) + pos.marketValue;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .map(([sector, value]) => {
                const percent = (value / totalValue) * 100;
                return (
                  <div key={sector}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted">{sector}</span>
                      <span className="text-foreground">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-tertiary">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
        </main>
      </div>
    </div>
  );
}
