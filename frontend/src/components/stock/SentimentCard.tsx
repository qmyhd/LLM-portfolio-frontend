'use client';

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/ui/EmptyState';
import { directionTextColor } from '@/lib/colors';
import { useStockProfile } from '@/hooks/useStockProfile';

interface SentimentCardProps {
  ticker: string;
}

export function SentimentCard({ ticker }: SentimentCardProps) {
  const { data: profile, isLoading } = useStockProfile(ticker);

  // Derive sentiment from the stock profile
  const b = profile?.bullishMentionPct ?? 0;
  const br = profile?.bearishMentionPct ?? 0;
  const n = profile?.neutralMentionPct ?? 0;
  const hasSentiment = b + br + n > 0;

  const sentiment = hasSentiment
    ? {
        bullish: b,
        bearish: br,
        neutral: n,
        overall: (b > br ? 'bullish' : br > b ? 'bearish' : 'neutral') as
          | 'bullish'
          | 'bearish'
          | 'neutral',
        score: b + br > 0 ? Math.round((b / (b + br)) * 100) : 50,
        ideaCount: profile?.mentionCount30d ?? 0,
      }
    : null;

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="skeleton h-4 w-20 mb-3 rounded" />
        <div className="skeleton h-4 w-full mb-2 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div className="card p-4">
        <EmptyState icon={ChatBubbleLeftIcon} title="No sentiment data" description="No Discord mentions found for this ticker" />
      </div>
    );
  }

  const SentimentIcon = sentiment.overall === 'bullish' 
    ? ArrowTrendingUpIcon 
    : sentiment.overall === 'bearish' 
    ? ArrowTrendingDownIcon 
    : MinusIcon;

  const sentimentColor = directionTextColor(sentiment.overall);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground-muted">Community Sentiment</span>
        <div className={`flex items-center gap-1 ${sentimentColor}`}>
          <SentimentIcon className="h-4 w-4" />
          <span className="text-sm font-medium capitalize">{sentiment.overall}</span>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="h-2 rounded-full overflow-hidden flex mb-3">
        <div
          className="bg-profit transition-all"
          style={{ width: `${sentiment.bullish}%` }}
        />
        <div
          className="bg-foreground-muted/30 transition-all"
          style={{ width: `${sentiment.neutral}%` }}
        />
        <div
          className="bg-loss transition-all"
          style={{ width: `${sentiment.bearish}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-profit" />
          <span className="text-foreground-muted">{sentiment.bullish}% Bullish</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-loss" />
          <span className="text-foreground-muted">{sentiment.bearish}% Bearish</span>
        </div>
      </div>

      {/* Idea Count */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-foreground-muted">
          Based on <span className="text-foreground font-medium">{sentiment.ideaCount}</span> ideas in the last 30 days
        </p>
      </div>
    </div>
  );
}
