'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Suspense } from 'react';
import { Select } from '@/components/ui/Select';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BucketSwitcher } from '@/components/portfolio/BucketSwitcher';
import { toUiOrder } from '@/lib/mappers';
import { formatMoney } from '@/lib/format';
import { useOrders } from '@/hooks/useOrders';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';

export default function OrdersPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const bucket = useBucket();

  const { data: ordersData, isLoading: loading } = useOrders({
    status: filter !== 'all' ? filter : undefined,
  });

  const orders = useMemo(
    () => (ordersData?.orders ?? []).map(toUiOrder),
    [ordersData],
  );

  const filteredOrders = orders.filter(order =>
    order.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <Suspense fallback={<div className="h-9 mb-4 border-b border-border" aria-hidden />}>
        <BucketSwitcher />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-foreground-muted">Your trading history and pending orders</p>
        </div>
        
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-48"
            />
          </div>
          
          {/* Filter */}
          <Select
            value={filter}
            onChange={(v) => setFilter(v)}
            options={[
              { value: 'all', label: 'All Orders' },
              { value: 'filled', label: 'Filled' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-foreground-muted">
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Symbol</th>
                <th scope="col" className="px-4 py-3 font-medium">Side</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Qty</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Price</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading skeleton
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-16 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-foreground-muted/50 mb-2" />
                    {bucket ? (
                      <>
                        <p className="text-foreground-muted">
                          No orders in this bucket
                        </p>
                        <p className="text-xs text-foreground-subtle mt-1">
                          Switch to <span className="font-semibold">All</span> above, or adjust the status/symbol filter.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-foreground-muted">No orders found</p>
                        <p className="text-xs text-foreground-subtle mt-1">Try adjusting your filter or search</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="px-4 py-3 text-sm text-foreground-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={stockHref(order.symbol, bucket)}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {order.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        order.side === 'buy' ? 'text-profit' : 'text-loss'
                      }`}>
                        {order.side === 'buy' ? (
                          <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3" />
                        )}
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-foreground-muted">
                      {order.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {order.status === 'filled' ? order.quantity : `${order.filledQuantity}/${order.quantity}`}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatMoney(order.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                      {formatMoney(order.totalValue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'filled'
                          ? 'bg-profit/20 text-profit'
                          : order.status === 'pending'
                          ? 'bg-status-warning/20 text-status-warning'
                          : 'bg-foreground-muted/20 text-foreground-muted'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 w-24 bg-background-hover rounded" />
              <div className="h-8 w-16 bg-background-hover rounded mt-2" />
            </div>
          ))
        ) : (
          <>
            <div className="card p-4">
              <p className="text-sm text-foreground-muted">Total Orders</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-foreground-muted">Filled</p>
              <p className="mt-1 text-2xl font-bold text-profit">
                {orders.filter(o => o.status === 'filled').length}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-foreground-muted">Pending</p>
              <p className="mt-1 text-2xl font-bold text-status-warning">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-foreground-muted">Cancelled</p>
              <p className="mt-1 text-2xl font-bold text-foreground-muted">
                {orders.filter(o => o.status === 'cancelled').length}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
        </main>
      </div>
    </div>
  );
}
