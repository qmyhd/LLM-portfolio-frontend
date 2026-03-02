'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import type { Position as ApiPosition } from '@/types/api';
import type { SyncResponse } from '@/types/ideas';
import { toUiPosition, type UiPosition } from '@/lib/mappers';
import { formatMoney, formatPercent, formatNumber, formatQuantity } from '@/lib/format';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'partial' | 'error';

interface SyncFeedback {
  status: SyncStatus;
  message: string;
  details?: string[];
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<UiPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback>({ status: 'idle', message: '' });
  const [sortBy, setSortBy] = useState<'value' | 'pl' | 'dayChange'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchPositions = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch('/api/portfolio');
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || errBody?.detail || `Server error (${res.status})`);
      }
      const data = await res.json();
      const apiPositions: ApiPosition[] = data.positions || [];
      setPositions(apiPositions.map(toUiPosition));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch positions';
      setFetchError(msg);
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch positions:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const syncBrokerage = async () => {
    setSyncFeedback({ status: 'syncing', message: 'Syncing with brokerage...' });
    try {
      const res = await fetch('/api/portfolio', { method: 'POST' });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || errBody?.detail || `Sync failed (${res.status})`);
      }
      const result: SyncResponse = await res.json();

      if (result.authError) {
        setSyncFeedback({
          status: 'error',
          message: result.message || 'Brokerage authentication failed — please re-link your account',
          details: result.errors?.length ? result.errors : undefined,
        });
      } else if (result.status === 'success') {
        setSyncFeedback({
          status: 'success',
          message: `Sync complete: ${result.positions} positions, ${result.orders} orders updated`,
        });
      } else if (result.status === 'error') {
        setSyncFeedback({
          status: 'error',
          message: result.message || 'Sync failed',
          details: result.errors?.length ? result.errors : undefined,
        });
      } else {
        setSyncFeedback({
          status: 'partial',
          message: result.message || 'Sync completed with some errors',
          details: result.errors?.length ? result.errors : undefined,
        });
      }

      // Refresh portfolio data after sync (skip if full error with no data)
      if (result.status !== 'error') {
        await fetchPositions();
      }

      // Auto-dismiss success after 5s
      if (result.status === 'success') {
        setTimeout(() => setSyncFeedback((prev) =>
          prev.status === 'success' ? { status: 'idle', message: '' } : prev
        ), 5000);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sync failed';
      setSyncFeedback({
        status: 'error',
        message: msg,
      });
      if (process.env.NODE_ENV === 'development') {
        console.error('Sync error:', error);
      }
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
          disabled={syncFeedback.status === 'syncing'}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${syncFeedback.status === 'syncing' ? 'animate-spin' : ''}`} />
          {syncFeedback.status === 'syncing' ? 'Syncing...' : 'Sync Brokerage'}
        </button>
      </div>

      {/* Sync Feedback Banner */}
      {syncFeedback.status !== 'idle' && syncFeedback.status !== 'syncing' && (
        <div className={`rounded-lg p-4 flex items-start gap-3 ${
          syncFeedback.status === 'success'
            ? 'bg-profit/10 border border-profit/20'
            : syncFeedback.status === 'partial'
            ? 'bg-status-warning/10 border border-status-warning/20'
            : 'bg-loss/10 border border-loss/20'
        }`}>
          {syncFeedback.status === 'success' && (
            <CheckCircleIcon className="h-5 w-5 text-profit flex-shrink-0 mt-0.5" />
          )}
          {syncFeedback.status === 'partial' && (
            <ExclamationTriangleIcon className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
          )}
          {syncFeedback.status === 'error' && (
            <XCircleIcon className="h-5 w-5 text-loss flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              syncFeedback.status === 'success'
                ? 'text-profit'
                : syncFeedback.status === 'partial'
                ? 'text-status-warning'
                : 'text-loss'
            }`}>
              {syncFeedback.message}
            </p>
            {syncFeedback.details && syncFeedback.details.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {syncFeedback.details.map((detail, i) => (
                  <li key={i} className="text-xs text-foreground-muted">{detail}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={() => setSyncFeedback({ status: 'idle', message: '' })}
            className="text-foreground-muted hover:text-foreground text-xs flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="rounded-lg p-4 flex items-start gap-3 bg-loss/10 border border-loss/20">
          <XCircleIcon className="h-5 w-5 text-loss flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-loss">{fetchError}</p>
          </div>
          <button
            onClick={() => { setFetchError(null); setLoading(true); fetchPositions(); }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            <ArrowPathIcon className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

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
                      {formatQuantity(pos.quantity)}
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
