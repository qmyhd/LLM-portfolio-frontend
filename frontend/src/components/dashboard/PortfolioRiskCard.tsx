'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber, formatPercent } from '@/lib/format';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import type { PortfolioRiskReport } from '@/types/api';

export function PortfolioRiskCard() {
  const [risk, setRisk] = useState<PortfolioRiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const bucket = useBucket();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(withBucket('/api/portfolio/risk', bucket))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setRisk(data);
      })
      .catch(() => {
        if (!cancelled) setRisk(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket]);

  if (loading) {
    return (
      <div className="card p-4 space-y-3">
        <Skeleton.Line className="h-4 w-32" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-3/4" />
      </div>
    );
  }

  if (!risk) return null;

  const hhi = risk.concentration_hhi;
  const concentrationLevel = hhi < 0.15 ? 'Diversified' : hhi < 0.25 ? 'Moderate' : 'Concentrated';
  const concentrationColor = hhi < 0.15 ? 'text-green-400' : hhi < 0.25 ? 'text-yellow-400' : 'text-red-400';
  const Icon = hhi >= 0.25 ? ExclamationTriangleIcon : ShieldCheckIcon;

  // Top sector exposures (up to 3)
  const topSectors = Object.entries(risk.sector_exposure || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground-muted">Portfolio Risk</span>
        <div className={`flex items-center gap-1 ${concentrationColor}`}>
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium">{concentrationLevel}</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* VaR 1-Day */}
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">VaR 95% (1D)</span>
          <span className="font-mono text-loss">
            -{formatPercent(risk.var_95_1d_pct, 1)}
          </span>
        </div>

        {/* VaR 5-Day */}
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">VaR 95% (5D)</span>
          <span className="font-mono text-loss">
            -{formatPercent(risk.var_95_5d_pct, 1)}
          </span>
        </div>

        {/* HHI */}
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Concentration (HHI)</span>
          <span className="font-mono text-foreground">{formatNumber(hhi, 3)}</span>
        </div>

        {/* Diversification Ratio */}
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Diversification</span>
          <span className="font-mono text-foreground">{formatNumber(risk.diversification_ratio, 2)}x</span>
        </div>
      </div>

      {/* Sector Exposure */}
      {topSectors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-[10px] uppercase text-foreground-subtle tracking-wide">Top Sectors</span>
          <div className="mt-1.5 space-y-1">
            {topSectors.map(([sector, weight]) => (
              <div key={sector} className="flex justify-between text-xs">
                <span className="text-foreground-muted truncate">{sector}</span>
                <span className="font-mono text-foreground">{Math.round(weight * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
