'use client';

import { clsx } from 'clsx';
import type { CredibilityBreakdown } from '@/types/credibility';

interface CredibilityDeltaProps {
  breakdown?: CredibilityBreakdown | null;
}

function formatTiers(tiers: Record<string, string>): string {
  const entries = Object.entries(tiers);
  if (entries.length === 0) return '—';
  return entries.map(([cat, tier]) => `${cat}:${tier}`).join(', ');
}

export function CredibilityDelta({ breakdown }: CredibilityDeltaProps) {
  // Render nothing when there's no breakdown or the delta is effectively zero.
  if (!breakdown || Math.abs(breakdown.delta) < 0.0001) {
    return null;
  }

  const { baseline_score, adjusted_score, delta, contributors } = breakdown;
  const deltaColor = delta > 0 ? 'text-green-400' : 'text-red-400';
  const sign = delta > 0 ? '+' : '';

  return (
    <div className="card p-3 space-y-2 text-xs">
      <p className="text-foreground-muted">
        Sentiment{' '}
        <span className={clsx('font-mono font-semibold', deltaColor)}>
          {sign}
          {delta.toFixed(2)}
        </span>{' '}
        from credibility weighting ({contributors.length} contributor
        {contributors.length === 1 ? '' : 's'})
      </p>

      <details className="text-foreground-muted">
        <summary className="cursor-pointer hover:text-foreground">
          {baseline_score.toFixed(2)} → {adjusted_score.toFixed(2)}
        </summary>
        <ul className="mt-2 space-y-1">
          {contributors.map((c, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <span className="text-foreground">{c.person || c.author_id}</span>
              <span className="text-foreground-subtle">{formatTiers(c.tiers)}</span>
              <span className="font-mono text-foreground-muted">
                ×{c.effective_mult.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
