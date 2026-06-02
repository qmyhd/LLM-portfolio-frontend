'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';
import { formatMoney, formatPercent, formatQuantity } from '@/lib/format';
import { pnlTextColor, pnlBgColor } from '@/lib/colors';
import { CardSpotlight } from '@/components/ui/CardSpotlight';

const LS_SHOW_CRYPTO = 'show-crypto';

export function CryptoSection() {
  const { data } = usePortfolio();
  const [isOpen, setIsOpen] = useState(true);
  const bucket = useBucket();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_SHOW_CRYPTO);
      if (stored === 'false') setIsOpen(false);
    } catch { /* ignore */ }
  }, []);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    try { localStorage.setItem(LS_SHOW_CRYPTO, String(next)); } catch { /* ignore */ }
  };

  const cryptoPositions = useMemo(() => {
    return (data?.positions ?? []).filter(p => {
      const at = (p.assetType ?? '').toLowerCase();
      return at === 'crypto' || at === 'cryptocurrency';
    });
  }, [data?.positions]);

  const totalValue = useMemo(() =>
    cryptoPositions.reduce((s, p) => s + p.equity, 0),
    [cryptoPositions],
  );

  const totalPnl = useMemo(() =>
    cryptoPositions.reduce((s, p) => s + p.openPnl, 0),
    [cryptoPositions],
  );

  const totalCost = useMemo(() =>
    cryptoPositions.reduce((s, p) => s + p.quantity * p.averageBuyPrice, 0),
    [cryptoPositions],
  );
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const portfolioEquity = data?.summary?.totalEquity ?? 0;
  const cryptoWeight = portfolioEquity > 0 ? (totalValue / portfolioEquity) * 100 : null;

  // Don't render if no crypto positions
  if (cryptoPositions.length === 0) return null;

  return (
    <CardSpotlight className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-background-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">
            Crypto
            <span className="ml-1.5 text-xs font-normal text-foreground-muted">
              ({cryptoPositions.length})
            </span>
          </h2>
          {cryptoWeight != null && (
            <span className="text-sm font-mono text-foreground-muted">
              {formatPercent(cryptoWeight, 1)} of portfolio
            </span>
          )}
          <span className={clsx('text-xs font-mono', pnlTextColor(totalPnlPct))}>
            {formatPercent(totalPnlPct, 2, { showSign: true })}
          </span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-foreground-muted" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-foreground-muted" />
        )}
      </button>

      {/* Table */}
      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-border">
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted text-left">
                  Symbol
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted text-right">
                  Qty
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted text-right">
                  Price
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted text-right">
                  Weight
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted text-right">
                  P/L %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cryptoPositions.map((position) => (
                <tr
                  key={position.symbol}
                  className="hover:bg-background-hover transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={stockHref(position.symbol, bucket)}
                      className="hover:text-primary transition-colors font-mono font-semibold text-sm"
                    >
                      {position.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm text-foreground-muted">
                    {formatQuantity(position.quantity)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm">
                    {formatMoney(position.currentPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm">
                    {formatPercent(position.portfolioDiversity, 1)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-mono font-medium',
                        pnlTextColor(position.openPnlPercent),
                        pnlBgColor(position.openPnlPercent),
                      )}
                    >
                      {formatPercent(position.openPnlPercent, 2, { showSign: true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardSpotlight>
  );
}
