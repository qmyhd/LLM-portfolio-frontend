'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/format';
import { riskLevelColor } from '@/lib/colors';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBucket, withBucket } from '@/contexts/BucketContext';

interface RiskMetrics {
  beta: number | null;
  volatility: number;
  riskLevel: 'low' | 'medium' | 'high';
  maxDrawdown: number;
  sharpeRatio: number | null;
  positionSizePct: number | null;
}

interface RiskCardProps {
  ticker: string;
}

export function RiskCard({ ticker }: RiskCardProps) {
  const [risk, setRisk] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const bucket = useBucket();

  useEffect(() => {
    fetchRisk();
    // Re-fetch on bucket change so position-sizing % reflects the bucket-
    // scoped portfolio denominator.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, bucket]);

  const fetchRisk = async () => {
    try {
      const res = await fetch(
        withBucket(`/api/stocks/${ticker}/analysis/risk`, bucket),
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();

      // Extract risk metrics from the agent_signals
      const riskAgent = data.agent_signals?.find(
        (s: { agent_id: string }) => s.agent_id === 'risk'
      );
      const metrics = riskAgent?.metrics || {};

      const vol = metrics.annualized_vol != null
        ? metrics.annualized_vol * 100
        : null;

      setRisk({
        beta: metrics.beta ?? null,
        volatility: vol ?? 0,
        riskLevel: vol == null ? 'medium' : vol < 20 ? 'low' : vol < 40 ? 'medium' : 'high',
        maxDrawdown: metrics.max_drawdown != null ? metrics.max_drawdown * 100 : 0,
        sharpeRatio: metrics.sharpe_ratio ?? null,
        positionSizePct: metrics.position_size_pct ?? null,
      });
    } catch {
      // Graceful fallback — show empty state
      setRisk(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-4 space-y-3">
        <Skeleton.Line className="h-4 w-24" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-3/4" />
        <Skeleton.Line className="h-3 w-1/2" />
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="card p-4">
        <EmptyState icon={ShieldCheckIcon} title="No risk data available" />
      </div>
    );
  }

  const riskColor = riskLevelColor(risk.riskLevel);

  const RiskIcon = risk.riskLevel === 'high' ? ExclamationTriangleIcon : ShieldCheckIcon;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground-muted">Risk Profile</span>
        <div className={`flex items-center gap-1 ${riskColor}`}>
          <RiskIcon className="h-4 w-4" />
          <span className="text-sm font-medium capitalize">{risk.riskLevel}</span>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="space-y-2">
        {/* Beta */}
        {risk.beta !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Beta</span>
            <span className="font-mono text-foreground">{formatNumber(risk.beta)}</span>
          </div>
        )}

        {/* Volatility */}
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Annualized Vol</span>
          <span className="font-mono text-foreground">{formatNumber(risk.volatility, 1)}%</span>
        </div>

        {/* Max Drawdown */}
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Max Drawdown</span>
          <span className="font-mono text-loss">{formatNumber(risk.maxDrawdown, 1)}%</span>
        </div>

        {/* Sharpe Ratio */}
        {risk.sharpeRatio !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Sharpe Ratio</span>
            <span className={`font-mono ${risk.sharpeRatio > 1 ? 'text-profit' : 'text-foreground'}`}>
              {formatNumber(risk.sharpeRatio)}
            </span>
          </div>
        )}

        {/* Position Size */}
        {risk.positionSizePct !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Suggested Size</span>
            <span className="font-mono text-foreground">{formatNumber(risk.positionSizePct, 1)}%</span>
          </div>
        )}
      </div>

      {/* Risk Description */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-foreground-muted">
          {risk.riskLevel === 'low' && 'Lower volatility compared to market average.'}
          {risk.riskLevel === 'medium' && 'Average volatility, typical market risk.'}
          {risk.riskLevel === 'high' && 'Higher volatility, consider position sizing carefully.'}
        </p>
      </div>
    </div>
  );
}
