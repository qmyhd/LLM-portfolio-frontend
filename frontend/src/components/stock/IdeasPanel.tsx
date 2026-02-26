'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { formatNumber, formatRelativeTime } from '@/lib/format';
import { directionTextColor } from '@/lib/colors';
import type { StockIdea } from '@/types/api';
import {
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/** Extract a price level value from the levels array by kind. */
function getLevelValue(idea: StockIdea, kind: string): number | null {
  const level = idea.levels?.find((l) => l.kind === kind);
  return level?.value ?? null;
}

interface IdeasPanelProps {
  ticker: string;
}

type FilterMode = 'all' | 'bullish' | 'bearish' | 'neutral';
type SortMode = 'time' | 'confidence';

const LABEL_COLORS: Record<string, string> = {
  TRADE_PLAN: 'bg-primary/20 text-primary',
  TRADE_EXECUTION: 'bg-profit/20 text-profit',
  TECHNICAL_ANALYSIS: 'bg-purple-500/20 text-purple-400',
  CATALYST_NEWS: 'bg-blue-500/20 text-blue-400',
  EARNINGS: 'bg-orange-500/20 text-orange-400',
  OPTIONS: 'bg-amber-500/20 text-amber-400',
  SECTOR_MACRO: 'bg-cyan-500/20 text-cyan-400',
  TRADE_OUTCOME: 'bg-pink-500/20 text-pink-400',
  EDUCATIONAL: 'bg-indigo-500/20 text-indigo-400',
  MISC_CHATTER: 'bg-gray-500/20 text-gray-400',
};

const ALL_LABELS = Object.keys(LABEL_COLORS);


export function IdeasPanel({ ticker }: IdeasPanelProps) {
  const [ideas, setIdeas] = useState<StockIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [directionFilter, setDirectionFilter] = useState<FilterMode>('all');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>('time');
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, [ticker]);

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`/api/stocks/${ticker}/ideas?limit=50`);
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique authors for filtering
  const authors = [...new Set(ideas.map((i) => i.author))];

  // Apply filters and sorting
  let filteredIdeas = ideas.filter((idea) => {
    if (directionFilter !== 'all' && idea.direction !== directionFilter) return false;
    if (labelFilter && !(idea.labels as string[]).includes(labelFilter)) return false;
    if (authorFilter && idea.author !== authorFilter) return false;
    return true;
  });

  // Sort
  filteredIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === 'confidence') {
      return b.confidence - a.confidence;
    }
    return new Date(b.sourceCreatedAt).getTime() - new Date(a.sourceCreatedAt).getTime();
  });

  const clearFilters = () => {
    setDirectionFilter('all');
    setLabelFilter(null);
    setAuthorFilter(null);
  };

  const hasActiveFilters = directionFilter !== 'all' || labelFilter || authorFilter;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="skeleton h-4 w-24 mb-2 rounded" />
            <div className="skeleton h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter bar */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        {/* Direction + Sort row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-foreground-muted" />
            <div className="flex gap-1">
              {(['all', 'bullish', 'bearish', 'neutral'] as FilterMode[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setDirectionFilter(f)}
                  className={clsx(
                    'px-2 py-1 text-xs font-medium rounded transition-colors capitalize',
                    directionFilter === f
                      ? f === 'bullish'
                        ? 'bg-profit/20 text-profit'
                        : f === 'bearish'
                        ? 'bg-loss/20 text-loss'
                        : f === 'neutral'
                        ? 'bg-status-warning/20 text-status-warning'
                        : 'bg-primary/20 text-primary'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="text-xs bg-background-tertiary text-foreground rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary"
          >
            <option value="time">Latest</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>

        {/* Label + Author filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Label dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLabelDropdown(!showLabelDropdown)}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                labelFilter
                  ? LABEL_COLORS[labelFilter] || 'bg-background-tertiary text-foreground'
                  : 'bg-background-tertiary text-foreground-muted hover:text-foreground'
              )}
            >
              {labelFilter ? labelFilter.replace('_', ' ') : 'Label'}
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            
            {showLabelDropdown && (
              <div className="absolute z-10 mt-1 w-48 bg-background-secondary border border-border rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setLabelFilter(null);
                    setShowLabelDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-foreground-muted hover:bg-background-tertiary"
                >
                  All Labels
                </button>
                {ALL_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      setLabelFilter(label);
                      setShowLabelDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-background-tertiary flex items-center gap-2"
                  >
                    <span className={clsx('px-1.5 py-0.5 rounded text-2xs', LABEL_COLORS[label])}>
                      {label.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Author dropdown */}
          {authors.length > 0 && (
            <select
              value={authorFilter || ''}
              onChange={(e) => setAuthorFilter(e.target.value || null)}
              className="text-xs bg-background-tertiary text-foreground rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Authors</option>
              {authors.map((author) => (
                <option key={author} value={author}>
                  @{author}
                </option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
            >
              <XMarkIcon className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Ideas list */}
      <div className="flex-1 overflow-y-auto">
        {filteredIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-foreground-muted">
            <p>No ideas found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary mt-2 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onAuthorClick={setAuthorFilter} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface IdeaCardProps {
  idea: StockIdea;
  onAuthorClick: (author: string) => void;
}

function IdeaCard({ idea, onAuthorClick }: IdeaCardProps) {
  const DirectionIcon =
    idea.direction === 'bullish'
      ? ArrowTrendingUpIcon
      : idea.direction === 'bearish'
      ? ArrowTrendingDownIcon
      : MinusIcon;

  const directionColor = directionTextColor(idea.direction);

  return (
    <div className="p-4 hover:bg-background-tertiary/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <DirectionIcon className={clsx('w-4 h-4', directionColor)} />
          <span className={clsx('text-sm font-medium capitalize', directionColor)}>
            {idea.direction}
          </span>
          <span className="text-xs text-foreground-muted">{formatNumber((idea.confidence ?? 0) * 100, 0)}%</span>
        </div>
        <span className="text-xs text-foreground-muted">{formatRelativeTime(idea.sourceCreatedAt)}</span>
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-1 mb-2">
        {idea.labels.map((label) => (
          <span
            key={label}
            className={clsx(
              'px-1.5 py-0.5 text-2xs font-medium rounded',
              LABEL_COLORS[label] || 'bg-background-tertiary text-foreground-muted'
            )}
          >
            {label.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Text */}
      <p className="text-sm text-foreground leading-relaxed">{idea.ideaText}</p>

      {/* Price levels */}
      {(() => {
        const entry = getLevelValue(idea, 'entry');
        const target = getLevelValue(idea, 'target');
        const stop = getLevelValue(idea, 'stop');
        if (!entry && !target && !stop) return null;
        return (
          <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
            {entry && (
              <span className="text-foreground-muted">
                Entry: <span className="text-foreground">${formatNumber(entry)}</span>
              </span>
            )}
            {target && (
              <span className="text-foreground-muted">
                Target: <span className="text-profit">${formatNumber(target)}</span>
              </span>
            )}
            {stop && (
              <span className="text-foreground-muted">
                Stop: <span className="text-loss">${formatNumber(stop)}</span>
              </span>
            )}
          </div>
        );
      })()}

      {/* Author */}
      <button
        onClick={() => onAuthorClick(idea.author)}
        className="mt-2 text-xs text-foreground-muted hover:text-primary transition-colors"
      >
        @{idea.author}
      </button>
    </div>
  );
}
