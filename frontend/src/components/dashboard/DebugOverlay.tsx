'use client';

import { usePortfolio } from '@/hooks';

export function DebugOverlay() {
  const { data, isLoading } = usePortfolio();

  if (process.env.NEXT_PUBLIC_DEBUG_UI !== '1') return null;
  if (isLoading || !data) return null;

  const { summary } = data;

  return (
    <div className="card p-4 border border-yellow-500/50 font-mono text-xs">
      <h3 className="text-yellow-500 font-semibold mb-2 text-sm">Debug Overlay</h3>
      <div className="space-y-1 text-foreground-muted">
        <div>
          Source: <span className="text-foreground">{summary.source}</span>
        </div>
        <div>
          SnapTrade Last Sync: <span className="text-foreground">{summary.lastSync}</span>
        </div>
        <div>
          Total Equity: <span className="text-foreground">${summary.totalEquity?.toFixed(2)}</span>
        </div>
        <div>
          Total Value (incl cash): <span className="text-foreground">${summary.totalValue?.toFixed(2)}</span>
        </div>
        <div>
          Cash: <span className="text-foreground">${summary.cashBalance?.toFixed(2)}</span>
        </div>
        <div>
          Positions: <span className="text-foreground">{summary.positionsCount}</span>
        </div>
        <div>
          Day Change: <span className="text-foreground">${summary.dayChange?.toFixed(2)} ({summary.dayChangePercent?.toFixed(2)}%)</span>
        </div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-yellow-500 hover:text-yellow-400">
          Raw JSON
        </summary>
        <pre className="mt-1 overflow-x-auto text-foreground-muted whitespace-pre-wrap break-all">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </details>
    </div>
  );
}
