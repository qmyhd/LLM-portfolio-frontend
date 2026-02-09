'use client';

import { clsx } from 'clsx';
import { formatNumber } from '@/lib/format';

// Mock sentiment data
const sentimentData = {
  overallScore: 0.72,
  bullishCount: 45,
  bearishCount: 12,
  neutralCount: 8,
  totalMentions: 65,
  topBullish: ['NVDA', 'AAPL', 'MSFT'],
  topBearish: ['PLTR', 'NIO'],
};

export function SentimentOverview() {
  const bullishPct = (sentimentData.bullishCount / sentimentData.totalMentions) * 100;
  const bearishPct = (sentimentData.bearishCount / sentimentData.totalMentions) * 100;
  const neutralPct = (sentimentData.neutralCount / sentimentData.totalMentions) * 100;

  return (
    <div className="card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Sentiment</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div
            className={clsx(
              'text-4xl font-bold font-mono',
              sentimentData.overallScore >= 0.5 ? 'text-profit' : 'text-loss'
            )}
          >
            {formatNumber(sentimentData.overallScore)}
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
              {sentimentData.bullishCount}
            </div>
            <div className="text-2xs text-foreground-muted">Bullish</div>
          </div>
          <div className="text-center p-2 bg-sentiment-neutral/10 rounded-lg">
            <div className="text-lg font-bold text-sentiment-neutral">
              {sentimentData.neutralCount}
            </div>
            <div className="text-2xs text-foreground-muted">Neutral</div>
          </div>
          <div className="text-center p-2 bg-loss/10 rounded-lg">
            <div className="text-lg font-bold text-loss">
              {sentimentData.bearishCount}
            </div>
            <div className="text-2xs text-foreground-muted">Bearish</div>
          </div>
        </div>

        {/* Top Mentions */}
        <div className="pt-2">
          <div className="text-xs text-foreground-muted mb-2">Most Bullish</div>
          <div className="flex flex-wrap gap-1">
            {sentimentData.topBullish.map((ticker) => (
              <span key={ticker} className="badge-bullish">
                {ticker}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
