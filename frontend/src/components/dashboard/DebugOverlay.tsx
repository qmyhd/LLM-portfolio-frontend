'use client';

import { usePortfolio } from '@/hooks';
import { usePrivacy } from '@/hooks/usePrivacy';
import { formatMoney, formatSignedMoney, formatSignedPct } from '@/lib/format';

export function DebugOverlay() {
  const { data, isLoading } = usePortfolio();
  const { hideSizes } = usePrivacy();

  if (process.env.NEXT_PUBLIC_DEBUG_UI !== '1') return null;
  // Never expose the raw dollar debug dump to viewers.
  if (hideSizes) return null;
  if (isLoading || !data) return null;

  const { summary } = data;

  return (
    <div className="card p-4 border border-status-warning/50 font-mono text-xs">
      <h3 className="text-status-warning font-semibold mb-2 text-sm">Debug Overlay</h3>
      <div className="space-y-1 text-foreground-muted">
        <div>
          Source: <span className="text-foreground">{summary.source}</span>
        </div>
        <div>
          SnapTrade Last Sync: <span className="text-foreground">{summary.lastSync}</span>
        </div>
        <div>
          Total Equity: <span className="text-foreground">{formatMoney(summary.totalEquity)}</span>
        </div>
        <div>
          Total Value (incl cash): <span className="text-foreground">{formatMoney(summary.totalValue)}</span>
        </div>
        <div>
          Cash: <span className="text-foreground">{formatMoney(summary.cashBalance)}</span>
        </div>
        <div>
          Positions: <span className="text-foreground">{summary.positionsCount}</span>
        </div>
        <div>
          Day Change: <span className="text-foreground">{formatSignedMoney(summary.dayChange)} ({formatSignedPct(summary.dayChangePercent)})</span>
        </div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-status-warning hover:text-status-warning/80">
          Raw JSON
        </summary>
        <pre className="mt-1 overflow-x-auto text-foreground-muted whitespace-pre-wrap break-all">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </details>
    </div>
  );
}
