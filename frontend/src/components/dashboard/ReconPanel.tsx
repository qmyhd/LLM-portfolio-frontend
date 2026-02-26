'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { ReconMeta, ReconPositionMeta, PortfolioResponse } from '@/types/api';
import { formatMoney } from '@/lib/format';
import { RECON_SOURCE_COLORS } from '@/lib/colors';

const RECON_ENABLED =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_RECON === '1';

function SourceBadge({ source }: { source: string }) {
  const color = RECON_SOURCE_COLORS[source] || RECON_SOURCE_COLORS._default;
  return (
    <span className={clsx('text-[10px] font-mono px-1.5 py-0.5 rounded border', color)}>
      {source}
    </span>
  );
}

function PositionRow({ meta }: { meta: ReconPositionMeta }) {
  return (
    <tr className="border-b border-border/50 hover:bg-background-hover/50">
      <td className="py-1.5 px-2 font-mono text-xs font-semibold">{meta.symbol}</td>
      <td className="py-1.5 px-2"><SourceBadge source={meta.priceSource} /></td>
      <td className="py-1.5 px-2 font-mono text-xs text-right">{formatMoney(meta.priceUsed)}</td>
      <td className="py-1.5 px-2 font-mono text-xs text-right text-foreground-muted">
        {meta.databentoPrice != null ? formatMoney(meta.databentoPrice) : '—'}
      </td>
      <td className="py-1.5 px-2 font-mono text-xs text-right text-foreground-muted">
        {meta.snaptradePrice != null ? formatMoney(meta.snaptradePrice) : '—'}
      </td>
      <td className="py-1.5 px-2 font-mono text-xs text-right text-foreground-muted">
        {meta.yfinancePrice != null ? formatMoney(meta.yfinancePrice) : '—'}
      </td>
      <td className="py-1.5 px-2 font-mono text-xs text-right text-foreground-muted">
        {meta.prevCloseValue != null ? formatMoney(meta.prevCloseValue) : '—'}
      </td>
    </tr>
  );
}

export function ReconPanel() {
  const searchParams = useSearchParams();
  const isRecon = searchParams.get('recon') === '1';
  const [recon, setRecon] = useState<ReconMeta | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isRecon || !RECON_ENABLED) {
      setRecon(null);
      return;
    }

    const fetchRecon = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/portfolio?recon=1');
        if (!res.ok) throw new Error(`${res.status}`);
        const data: PortfolioResponse = await res.json();
        setRecon(data.recon ?? null);
        setFetchedAt(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch recon data');
      } finally {
        setLoading(false);
      }
    };

    fetchRecon();
  }, [isRecon]);

  const copyReconJson = useCallback(() => {
    if (!recon) return;
    navigator.clipboard.writeText(JSON.stringify(recon, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [recon]);

  if (!isRecon || !RECON_ENABLED) return null;

  return (
    <div className="card border-2 border-status-warning/30 bg-status-warning/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-status-warning font-bold text-sm">RECON MODE</span>
          <span className="text-xs text-foreground-muted">Price source transparency</span>
          {fetchedAt && (
            <span className="text-[10px] text-foreground-muted">
              as of {fetchedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={copyReconJson}
          disabled={!recon}
          className="flex items-center gap-1 px-2 py-1 text-xs text-foreground-muted hover:text-foreground rounded border border-border hover:border-foreground-muted transition-colors disabled:opacity-40"
        >
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>

      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="skeleton h-4 w-48 rounded" />
          <div className="skeleton h-32 w-full rounded" />
        </div>
      )}

      {error && (
        <p className="text-sm text-loss">Error loading recon data: {error}</p>
      )}

      {recon && (
        <div className="space-y-4">
          {/* Account-level summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Cash (raw)</p>
              <p className="text-sm font-mono font-semibold">{formatMoney(recon.cashRaw)}</p>
            </div>
            <div>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Cash (for total)</p>
              <p className="text-sm font-mono font-semibold">{formatMoney(recon.cashForTotal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Total equity</p>
              <p className="text-sm font-mono font-semibold">{formatMoney(recon.totalEquityComputed)}</p>
            </div>
            <div>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Total cost</p>
              <p className="text-sm font-mono font-semibold">{formatMoney(recon.totalCostComputed)}</p>
            </div>
          </div>

          {/* Price source breakdown */}
          <div>
            <p className="text-xs text-foreground-muted mb-2">Price source distribution</p>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(recon.priceSourceBreakdown).map(([source, count]) => (
                <div key={source} className="flex items-center gap-1.5">
                  <SourceBadge source={source} />
                  <span className="text-xs font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-position table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[10px] text-foreground-muted uppercase tracking-wider">
                  <th className="py-1.5 px-2">Symbol</th>
                  <th className="py-1.5 px-2">Source</th>
                  <th className="py-1.5 px-2 text-right">Used</th>
                  <th className="py-1.5 px-2 text-right">Databento</th>
                  <th className="py-1.5 px-2 text-right">SnapTrade</th>
                  <th className="py-1.5 px-2 text-right">yfinance</th>
                  <th className="py-1.5 px-2 text-right">Prev Close</th>
                </tr>
              </thead>
              <tbody>
                {recon.positions.map((meta) => (
                  <PositionRow key={meta.symbol} meta={meta} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Position count */}
          <p className="text-xs text-foreground-muted">
            {recon.positions.length} positions tracked
          </p>
        </div>
      )}
    </div>
  );
}
