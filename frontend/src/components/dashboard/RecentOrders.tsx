'use client';

import { clsx } from 'clsx';
import Link from 'next/link';

// Mock orders data
const ordersData = [
  { 
    id: 'ORD-001', 
    symbol: 'NVDA', 
    action: 'BUY', 
    qty: 10, 
    price: 850.25, 
    total: 8502.50,
    status: 'executed',
    time: '2026-01-26 10:32:45'
  },
  { 
    id: 'ORD-002', 
    symbol: 'AAPL', 
    action: 'SELL', 
    qty: 25, 
    price: 178.50, 
    total: 4462.50,
    status: 'executed',
    time: '2026-01-25 14:15:22'
  },
  { 
    id: 'ORD-003', 
    symbol: 'TSLA', 
    action: 'BUY', 
    qty: 15, 
    price: 242.30, 
    total: 3634.50,
    status: 'executed',
    time: '2026-01-24 09:45:10'
  },
  { 
    id: 'ORD-004', 
    symbol: 'AMD', 
    action: 'BUY', 
    qty: 50, 
    price: 165.80, 
    total: 8290.00,
    status: 'executed',
    time: '2026-01-23 11:20:33'
  },
  { 
    id: 'ORD-005', 
    symbol: 'META', 
    action: 'SELL', 
    qty: 5, 
    price: 580.00, 
    total: 2900.00,
    status: 'executed',
    time: '2026-01-22 15:50:18'
  },
];

export function RecentOrders() {
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
            {ordersData.map((order) => (
              <tr key={order.id} className="table-row">
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
                  {order.qty}
                </td>
                <td className="table-cell text-right font-mono hidden md:table-cell">
                  ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="table-cell text-right font-mono font-medium">
                  ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="table-cell text-right text-foreground-muted text-sm hidden lg:table-cell">
                  {order.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
