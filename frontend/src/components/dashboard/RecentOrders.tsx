'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import type { Order } from '@/types/api';
import { formatMoney, formatDate } from '@/lib/format';
import { CardSpotlight } from '@/components/ui/CardSpotlight';
import { useOrders } from '@/hooks/useOrders';

export function RecentOrders() {
  const { data, error, isLoading } = useOrders({ limit: 5 });

  if (isLoading) {
    return (
      <CardSpotlight className="card overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-border flex justify-between">
          <div className="h-5 w-28 bg-background-hover rounded" />
          <div className="h-5 w-16 bg-background-hover rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-background-hover rounded" />
          ))}
        </div>
      </CardSpotlight>
    );
  }

  if (error) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-loss font-medium">Failed to load orders</p>
        <p className="text-sm text-foreground-muted mt-1">{error.message}</p>
      </CardSpotlight>
    );
  }

  const orders: Order[] = data?.orders ?? [];

  if (orders.length === 0) {
    return (
      <CardSpotlight className="card p-6 text-center">
        <p className="text-foreground-muted">No recent orders</p>
      </CardSpotlight>
    );
  }

  return (
    <CardSpotlight className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Link
          href="/orders"
          className="text-sm text-primary hover:text-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          View All →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-tertiary">
              <th scope="col" className="table-header text-left">Symbol</th>
              <th scope="col" className="table-header text-center">Action</th>
              <th scope="col" className="table-header text-right hidden sm:table-cell">Qty</th>
              <th scope="col" className="table-header text-right hidden md:table-cell">Price</th>
              <th scope="col" className="table-header text-right">Total</th>
              <th scope="col" className="table-header text-right hidden lg:table-cell">Time</th>
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
                    {price > 0 ? formatMoney(price) : '—'}
                  </td>
                  <td className="table-cell text-right font-mono font-medium">
                    {total > 0 ? formatMoney(total) : '—'}
                  </td>
                  <td className="table-cell text-right text-foreground-subtle text-sm hidden lg:table-cell">
                    {time ? formatDate(time, 'short') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardSpotlight>
  );
}
