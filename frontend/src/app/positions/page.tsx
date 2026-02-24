'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import type { Position as ApiPosition } from '@/types/api';
import { toUiPosition, type UiPosition } from '@/lib/mappers';
import { formatMoney, formatPercent, formatNumber } from '@/lib/format';

export default function PositionsPage() {
  const [positions, setPositions] = useState<UiPosition[]>([]);
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
      const apiPositions: ApiPosition[] = data.positions || [];
      setPositions(apiPositions.map(toUiPosition));
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
  const totalDayChange = positions.reduce((sum, p) => sum + p.dayChange, 0);

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
          <p className="text-foreground-muted">Your current holdings</p>
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
          <p className="text-sm text-foreground-muted">Total Value</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {formatMoney(totalValue)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-foreground-muted">Total Cost</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {formatMoney(totalCost)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-foreground-muted">Unrealized P/L</p>
          <p className={`mt-1 text-2xl font-bold ${totalPL >= 0 ? 'text-profit' : 'text-loss'}`}>
            {totalPL > 0 ? '+' : totalPL < 0 ? '-' : ''}{formatMoney(Math.abs(totalPL))}
            <span className="ml-2 text-sm">
              ({formatPercent(totalPLPercent, 2, { showSign: true })})
            </span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-foreground-muted">Day Change</p>
          <p className={`mt-1 text-2xl font-bold ${
            totalDayChange === 0 ? 'text-foreground-muted' : totalDayChange > 0 ? 'text-profit' : 'text-loss'
          }`}>
            {totalDayChange === 0
              ? '$0.00'
              : `${totalDayChange >= 0 ? '+' : ''}${formatMoney(Math.abs(totalDayChange))}`}
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-foreground-muted">
                <th scope="col" className="px-4 py-3 font-medium">Symbol</th>
                <th scope="col" className="px-4 py-3 font-medium">Company</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Qty</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Avg Cost</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Price</th>
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3 font-medium text-right hover:text-foreground select-none"
                  onClick={() => toggleSort('value')}
                >
                  <span className="inline-flex items-center gap-1">
                    Value
                    {sortBy === 'value' && (sortOrder === 'desc'
                      ? <ChevronDownIcon className="h-3.5 w-3.5" />
                      : <ChevronUpIcon className="h-3.5 w-3.5" />)}
                  </span>
                </th>
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3 font-medium text-right hover:text-foreground select-none"
                  onClick={() => toggleSort('pl')}
                >
                  <span className="inline-flex items-center gap-1">
                    P/L
                    {sortBy === 'pl' && (sortOrder === 'desc'
                      ? <ChevronDownIcon className="h-3.5 w-3.5" />
                      : <ChevronUpIcon className="h-3.5 w-3.5" />)}
                  </span>
                </th>
                <th
                  scope="col"
                  className="cursor-pointer px-4 py-3 font-medium text-right hover:text-foreground select-none"
                  onClick={() => toggleSort('dayChange')}
                >
                  <span className="inline-flex items-center gap-1">
                    Day
                    {sortBy === 'dayChange' && (sortOrder === 'desc'
                      ? <ChevronDownIcon className="h-3.5 w-3.5" />
                      : <ChevronUpIcon className="h-3.5 w-3.5" />)}
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
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
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <BriefcaseIcon className="mx-auto h-10 w-10 text-foreground-muted/50 mb-2" />
                    <p className="text-foreground-muted">No positions found</p>
                    <p className="text-xs text-foreground-subtle mt-1">Sync your brokerage to see holdings</p>
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos) => (
                  <tr key={pos.symbol} className="table-row">
                    <td className="px-4 py-3">
                      <Link
                        href={`/stock/${pos.symbol}`}
                        className="font-bold text-foreground hover:text-primary"
                      >
                        {pos.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">
                      {pos.companyName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {pos.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground-muted">
                      {formatMoney(pos.averageCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatMoney(pos.currentPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                      {formatMoney(pos.marketValue)}
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
                        {formatPercent(pos.unrealizedPLPercent, 2, { showSign: true })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pos.dayChange === 0 && pos.dayChangePercent === 0 ? (
                        <span className="font-mono text-sm text-foreground-muted">{'\u2014'}</span>
                      ) : (
                        <span className={`font-mono text-sm ${
                          pos.dayChangePercent >= 0 ? 'text-profit' : 'text-loss'
                        }`}>
                          {formatPercent(pos.dayChangePercent, 2, { showSign: true })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/stock/${pos.symbol}`}
                        className="rounded p-1.5 text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </Link>
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
                const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
                return (
                  <div key={sector}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground-muted">{sector}</span>
                      <span className="text-foreground">{formatNumber(percent, 1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background-tertiary">
                      <div
                        className="h-full rounded-full bg-primary"
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
