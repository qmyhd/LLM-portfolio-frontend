'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface RiskMetrics {
  beta: number | null;
  volatility: number;
  riskLevel: 'low' | 'medium' | 'high';
  maxDrawdown: number;
  sharpeRatio: number | null;
}

interface RiskCardProps {
  ticker: string;
}

export function RiskCard({ ticker }: RiskCardProps) {
  const [risk, setRisk] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRisk();
  }, [ticker]);

  const fetchRisk = async () => {
    try {
      const res = await fetch(`/api/stocks/${ticker}`);
      const data = await res.json();
      
      // Generate risk metrics (would come from backend in production)
      const beta = data.beta || (0.8 + Math.random() * 0.8);
      const volatility = 15 + Math.random() * 25;
      
      setRisk({
        beta,
        volatility,
        riskLevel: volatility < 20 ? 'low' : volatility < 35 ? 'medium' : 'high',
        maxDrawdown: -(10 + Math.random() * 30),
        sharpeRatio: 0.5 + Math.random() * 1.5,
      });
    } catch (error) {
      console.error('Failed to fetch risk:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-3 w-full mb-2 rounded" />
        <div className="skeleton h-3 w-full mb-2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="card p-4">
        <p className="text-sm text-muted">No risk data available</p>
      </div>
    );
  }

  const riskColor = risk.riskLevel === 'low'
    ? 'text-profit'
    : risk.riskLevel === 'medium'
    ? 'text-yellow-500'
    : 'text-loss';

  const RiskIcon = risk.riskLevel === 'high' ? ExclamationTriangleIcon : ShieldCheckIcon;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted">Risk Profile</span>
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
            <span className="text-muted">Beta</span>
            <span className="font-mono text-foreground">{risk.beta.toFixed(2)}</span>
          </div>
        )}

        {/* Volatility */}
        <div className="flex justify-between text-sm">
          <span className="text-muted">30D Volatility</span>
          <span className="font-mono text-foreground">{risk.volatility.toFixed(1)}%</span>
        </div>

        {/* Max Drawdown */}
        <div className="flex justify-between text-sm">
          <span className="text-muted">Max Drawdown</span>
          <span className="font-mono text-loss">{risk.maxDrawdown.toFixed(1)}%</span>
        </div>

        {/* Sharpe Ratio */}
        {risk.sharpeRatio !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Sharpe Ratio</span>
            <span className={`font-mono ${risk.sharpeRatio > 1 ? 'text-profit' : 'text-foreground'}`}>
              {risk.sharpeRatio.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Risk Description */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted">
          {risk.riskLevel === 'low' && 'Lower volatility compared to market average.'}
          {risk.riskLevel === 'medium' && 'Average volatility, typical market risk.'}
          {risk.riskLevel === 'high' && 'Higher volatility, consider position sizing carefully.'}
        </p>
      </div>
    </div>
  );
}
