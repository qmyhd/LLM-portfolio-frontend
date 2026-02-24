'use client';

import { useState, useEffect } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

interface Sentiment {
  bullish: number;
  bearish: number;
  neutral: number;
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number;
  ideaCount: number;
}

interface SentimentCardProps {
  ticker: string;
}

export function SentimentCard({ ticker }: SentimentCardProps) {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiment();
  }, [ticker]);

  const fetchSentiment = async () => {
    try {
      const res = await fetch(`/api/stocks/${ticker}`);
      const data = await res.json();
      
      if (data.sentiment) {
        setSentiment(data.sentiment);
      }
    } catch (error) {
      console.error('Failed to fetch sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <p className="text-sm text-foreground-muted">No sentiment data</p>
      </div>
    );
  }

  const SentimentIcon = sentiment.overall === 'bullish' 
    ? ArrowTrendingUpIcon 
    : sentiment.overall === 'bearish' 
    ? ArrowTrendingDownIcon 
    : MinusIcon;

  const sentimentColor = sentiment.overall === 'bullish'
    ? 'text-profit'
    : sentiment.overall === 'bearish'
    ? 'text-loss'
    : 'text-foreground-muted';

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
