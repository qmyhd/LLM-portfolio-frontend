'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import useSWR from 'swr';
import type { OrdersResponse, Order } from '@/types/api';

const fetcher = async (url: string): Promise<OrdersResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
};

export function RecentOrders() {
  const { data, error, isLoading } = useSWR<OrdersResponse>(
    '/api/orders?limit=5',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000, errorRetryCount: 3 }
  );

  if (isLoading) {
    return (
      <div className="card overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-border flex justify-between">
          <div className="h-5 w-28 bg-background-hover rounded" />
          <div className="h-5 w-16 bg-background-hover rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-background-hover rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load orders</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </div>
    );
  }

  const orders: Order[] = data?.orders ?? [];

  if (orders.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-foreground-muted">No recent orders</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Link
          href="/orders"
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-tertiary">
              <th className="table-header text-left">Symbol</th>
              <th className="table-header text-center">Action</th>
              <th className="table-header text-right hidden sm:table-cell">Qty</th>
              <th className="table-header text-right hidden md:table-cell">Price</th>
              <th className="table-header text-right">Total</th>
              <th className="table-header text-right hidden lg:table-cell">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const price = order.executionPrice ?? order.limitPrice ?? 0;
              const total = order.totalQuantity * price;
              const time = order.timeExecuted ?? order.timePlaced ?? '';

              return (
                <tr key={order.brokerageOrderId} className="table-row">
                  <td className="table-cell">
                    <Link 
                      href={`/stock/${order.symbol}`}
                      className="font-mono font-semibold hover:text-primary transition-colors"
                    >
                      {order.symbol}
                    </Link>
                  </td>
                  <td className="table-cell text-center">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold',
                        order.action === 'BUY'
                          ? 'bg-profit/20 text-profit'
                          : 'bg-loss/20 text-loss'
                      )}
                    >
                      {order.action === 'BUY' ? '▲' : '▼'} {order.action}
                    </span>
                  </td>
                  <td className="table-cell text-right font-mono hidden sm:table-cell">
                    {order.totalQuantity}
                  </td>
                  <td className="table-cell text-right font-mono hidden md:table-cell">
                    {price > 0
                      ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="table-cell text-right font-mono font-medium">
                    {total > 0
                      ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="table-cell text-right text-foreground-muted text-sm hidden lg:table-cell">
                    {time ? new Date(time).toLocaleString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
