'use client';

import { useFundamentals } from '@/hooks/useOpenBB';
import { formatNumber, formatCompact, formatPercent } from '@/lib/format';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';

interface FundamentalsCardProps {
  ticker: string;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-xs font-mono text-foreground">{value}</span>
    </div>
  );
}

export function FundamentalsCard({ ticker }: FundamentalsCardProps) {
  const { data, isLoading, error } = useFundamentals(ticker);

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="skeleton h-4 w-28 mb-3 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-3 w-full mb-2 rounded" />
        ))}
      </div>
    );
  }

  if (error || !data) return null;

  const hasData = data.peRatio != null || data.returnOnEquity != null || data.debtToEquity != null;
  if (!hasData) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartBarSquareIcon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Fundamentals</h3>
      </div>

      <div className="divide-y divide-border/50">
        {data.marketCap != null && (
          <MetricRow label="Market Cap" value={`$${formatCompact(data.marketCap)}`} />
        )}
        {data.peRatio != null && (
          <MetricRow label="P/E Ratio" value={formatNumber(data.peRatio, 1)} />
        )}
        {data.pegRatio != null && (
          <MetricRow label="PEG Ratio" value={formatNumber(data.pegRatio, 2)} />
        )}
        {data.epsActual != null && (
          <MetricRow label="EPS" value={`$${formatNumber(data.epsActual, 2)}`} />
        )}
        {data.debtToEquity != null && (
          <MetricRow label="Debt/Equity" value={formatNumber(data.debtToEquity, 2)} />
        )}
        {data.currentRatio != null && (
          <MetricRow label="Current Ratio" value={formatNumber(data.currentRatio, 2)} />
        )}
        {data.returnOnEquity != null && (
          <MetricRow label="ROE" value={formatPercent(data.returnOnEquity * 100, 1)} />
        )}
        {data.returnOnAssets != null && (
          <MetricRow label="ROA" value={formatPercent(data.returnOnAssets * 100, 1)} />
        )}
        {data.dividendYield != null && (
          <MetricRow label="Div. Yield" value={formatPercent(data.dividendYield * 100, 2)} />
        )}
        {data.priceToBook != null && (
          <MetricRow label="P/B" value={formatNumber(data.priceToBook, 2)} />
        )}
        {data.priceToSales != null && (
          <MetricRow label="P/S" value={formatNumber(data.priceToSales, 2)} />
        )}
      </div>
    </div>
  );
}
