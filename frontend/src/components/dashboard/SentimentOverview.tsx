'use client';

import useSWR from 'swr';
import { clsx } from 'clsx';
import { formatNumber } from '@/lib/format';

interface SentimentData {
  ticker: string;
  window: string;
  totalMentions: number;
  bullishPct: number | null;
  bearishPct: number | null;
  neutralPct: number | null;
}

// Mock fallback when API is unavailable
const MOCK_DATA: SentimentData = {
  ticker: 'ALL',
  window: '30d',
  totalMentions: 65,
  bullishPct: 69,
  bearishPct: 18,
  neutralPct: 13,
};

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Failed: ${r.status}`);
  return r.json();
});

function SentimentSkeleton() {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-border">
        <div className="h-5 w-24 bg-background-hover rounded animate-pulse" />
      </div>
      <div className="p-4 space-y-4 animate-pulse">
        <div className="flex justify-center">
          <div className="h-10 w-16 bg-background-hover rounded" />
        </div>
        <div className="h-3 w-full bg-background-hover rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-background-hover rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SentimentOverview() {
  const { data, error, isLoading } = useSWR<SentimentData>(
    '/api/sentiment?window=30d',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000, errorRetryCount: 1 }
  );

  if (isLoading) return <SentimentSkeleton />;

  // Use API data or fall back to mock
  const isMock = !!error || !data;
  const sentiment = data || MOCK_DATA;

  const bullishPct = sentiment.bullishPct ?? 0;
  const bearishPct = sentiment.bearishPct ?? 0;
  const neutralPct = sentiment.neutralPct ?? 0;

  // Derive overall score: 0–1 based on bullish proportion
  const overallScore = bullishPct + bearishPct > 0
    ? bullishPct / (bullishPct + bearishPct)
    : 0.5;

  // Derive counts from percentages
  const total = sentiment.totalMentions || 1;
  const bullishCount = Math.round((bullishPct / 100) * total);
  const bearishCount = Math.round((bearishPct / 100) * total);
  const neutralCount = total - bullishCount - bearishCount;

  return (
    <div className="card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sentiment</h2>
        {isMock && (
          <span className="text-2xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-medium">
            Sample data
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div
            className={clsx(
              'text-4xl font-bold font-mono',
              overallScore >= 0.5 ? 'text-profit' : 'text-loss'
            )}
          >
            {formatNumber(overallScore)}
          </div>
          <div className="text-sm text-foreground-muted mt-1">
            Overall Score
          </div>
        </div>

        {/* Sentiment Bar */}
        <div>
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-profit"
              style={{ width: `${bullishPct}%` }}
            />
            <div
              className="bg-sentiment-neutral"
              style={{ width: `${neutralPct}%` }}
            />
            <div
              className="bg-loss"
              style={{ width: `${bearishPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-profit">
              Bullish {formatNumber(bullishPct, 0)}%
            </span>
            <span className="text-loss">
              Bearish {formatNumber(bearishPct, 0)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-profit/10 rounded-lg">
            <div className="text-lg font-bold text-profit">
              {bullishCount}
            </div>
            <div className="text-2xs text-foreground-muted">Bullish</div>
          </div>
          <div className="text-center p-2 bg-sentiment-neutral/10 rounded-lg">
            <div className="text-lg font-bold text-sentiment-neutral">
              {neutralCount}
            </div>
            <div className="text-2xs text-foreground-muted">Neutral</div>
          </div>
          <div className="text-center p-2 bg-loss/10 rounded-lg">
            <div className="text-lg font-bold text-loss">
              {bearishCount}
            </div>
            <div className="text-2xs text-foreground-muted">Bearish</div>
          </div>
        </div>
      </div>
    </div>
  );
}
