'use client';

import { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  ChartBarSquareIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/lib/format';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { CredibilityDelta } from '@/components/stock/CredibilityDelta';
import { StockTopicTagsEditor } from '@/components/stock/StockTopicTagsEditor';
import type { ConsensusReport, AgentSignal } from '@/types/api';
import type { CredibilityBreakdown } from '@/types/credibility';

interface AnalysisPanelProps {
  ticker: string;
}

const SIGNAL_COLORS: Record<string, string> = {
  strong_buy: 'text-emerald-400 bg-emerald-500/15',
  buy: 'text-green-400 bg-green-500/15',
  hold: 'text-yellow-400 bg-yellow-500/15',
  sell: 'text-orange-400 bg-orange-500/15',
  strong_sell: 'text-red-400 bg-red-500/15',
  bullish: 'text-green-400 bg-green-500/15',
  bearish: 'text-red-400 bg-red-500/15',
  neutral: 'text-zinc-400 bg-zinc-500/15',
};

const SIGNAL_LABELS: Record<string, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

const AGENT_LABELS: Record<string, string> = {
  technical: 'Technical',
  fundamental: 'Fundamental',
  valuation: 'Valuation',
  sentiment: 'Sentiment',
  risk: 'Risk',
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full bg-background-tertiary rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function AgentSignalCard({ signal }: { signal: AgentSignal }) {
  const color = SIGNAL_COLORS[signal.signal] || SIGNAL_COLORS.neutral;
  const label = AGENT_LABELS[signal.agent_id] || signal.agent_id;

  return (
    <div className="p-3 bg-background-hover rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${color}`}>
          {signal.signal}
        </span>
      </div>
      <ConfidenceBar value={signal.confidence} />
      <p className="text-xs text-foreground-muted line-clamp-2">{signal.reasoning}</p>
    </div>
  );
}

export function AnalysisPanel({ ticker }: AnalysisPanelProps) {
  const [report, setReport] = useState<ConsensusReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bucket = useBucket();

  const fetchAnalysis = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Bucket scopes the position context and portfolio value the risk
      // agent sees. When refresh=true, force a bypass of the bucket-keyed
      // cache entry.
      const base = `/api/stocks/${ticker}/analysis${refresh ? '?refresh=true' : ''}`;
      const url = withBucket(base, bucket);

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data: ConsensusReport = await res.json();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // Re-fetch when ticker OR bucket changes so the analysis reflects
    // the currently-active strategy filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, bucket]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton.Line className="h-6 w-32" />
        <Skeleton.Line className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton.Line key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4">
        <EmptyState
          icon={ChartBarSquareIcon}
          title="Analysis unavailable"
          description={error || 'No analysis data yet. Click refresh to generate.'}
        />
        <div className="flex justify-center mt-3">
          <button
            onClick={() => fetchAnalysis(true)}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Generate Analysis
          </button>
        </div>
      </div>
    );
  }

  const signalColor = SIGNAL_COLORS[report.overall_signal] || SIGNAL_COLORS.hold;
  const signalLabel = SIGNAL_LABELS[report.overall_signal] || report.overall_signal;

  const sentiment = report?.agent_signals?.find((s) => s.agent_id === 'sentiment');
  const credibility = (sentiment?.metrics?.credibility ?? null) as CredibilityBreakdown | null;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Overall Signal */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SignalIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Consensus</h3>
          </div>
          <button
            onClick={() => fetchAnalysis(true)}
            disabled={refreshing}
            className="p-1.5 rounded-md hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
            title="Refresh analysis"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold px-3 py-1 rounded-lg ${signalColor}`}>
            {signalLabel}
          </span>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs text-foreground-muted">
              <span>Confidence</span>
              <span>{Math.round(report.overall_confidence * 100)}%</span>
            </div>
            <ConfidenceBar value={report.overall_confidence} />
          </div>
        </div>

        {/* Bull/Bear Score */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted">Bull/Bear</span>
          <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
              style={{ width: '100%', opacity: 0.3 }}
            />
            <div
              className="absolute top-0 h-full w-2 bg-foreground rounded-full"
              style={{ left: `${((report.bull_bear_score + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <span className="text-xs font-mono text-foreground">
            {report.bull_bear_score > 0 ? '+' : ''}{formatNumber(report.bull_bear_score, 2)}
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-foreground-muted">{report.summary}</p>
      </div>

      {/* Agent Signals */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
          Agent Breakdown ({report.agent_signals.length})
        </h4>
        {report.agent_signals.map((signal) => (
          <AgentSignalCard key={signal.agent_id} signal={signal} />
        ))}
      </div>

      {/* Credibility weighting delta (sentiment agent) */}
      <CredibilityDelta breakdown={credibility} />

      {/* Topic tags (credibility routing) */}
      <details className="card p-3">
        <summary className="cursor-pointer text-xs uppercase tracking-wider text-foreground-muted hover:text-foreground">
          Topic tags (credibility routing)
        </summary>
        <div className="mt-3">
          <StockTopicTagsEditor ticker={ticker} />
        </div>
      </details>

      {/* Metadata */}
      <div className="text-[10px] text-foreground-subtle space-y-0.5 pt-2 border-t border-border">
        <div>Model: {report.model_used}</div>
        <div>Sources: {report.data_sources.join(', ')}</div>
        <div>Computed: {new Date(report.computed_at).toLocaleString()}</div>
      </div>
    </div>
  );
}
