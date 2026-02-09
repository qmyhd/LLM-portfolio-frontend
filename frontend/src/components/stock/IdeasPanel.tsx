'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { formatNumber } from '@/lib/format';
import {
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Idea {
  id: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  labels: string[];
  entryPrice: number | null;
  targetPrice: number | null;
  stopLoss: number | null;
  text: string;
  author: string;
  createdAt: string;
}

interface IdeasPanelProps {
  ticker: string;
}

type FilterMode = 'all' | 'bullish' | 'bearish' | 'neutral';
type SortMode = 'time' | 'confidence';

const LABEL_COLORS: Record<string, string> = {
  TRADE_PLAN: 'bg-accent/20 text-accent',
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

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function IdeasPanel({ ticker }: IdeasPanelProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
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
    if (labelFilter && !idea.labels.includes(labelFilter)) return false;
    if (authorFilter && idea.author !== authorFilter) return false;
    return true;
  });

  // Sort
  filteredIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === 'confidence') {
      return b.confidence - a.confidence;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
            <FunnelIcon className="w-4 h-4 text-muted" />
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
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-accent/20 text-accent'
                      : 'text-muted hover:text-foreground hover:bg-tertiary'
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
            className="text-xs bg-tertiary text-foreground rounded px-2 py-1 border-none focus:ring-1 focus:ring-accent"
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
                  ? LABEL_COLORS[labelFilter] || 'bg-tertiary text-foreground'
                  : 'bg-tertiary text-muted hover:text-foreground'
              )}
            >
              {labelFilter ? labelFilter.replace('_', ' ') : 'Label'}
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            
            {showLabelDropdown && (
              <div className="absolute z-10 mt-1 w-48 bg-secondary border border-border rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setLabelFilter(null);
                    setShowLabelDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-muted hover:bg-tertiary"
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
                    className="w-full px-3 py-2 text-left text-xs hover:bg-tertiary flex items-center gap-2"
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
              className="text-xs bg-tertiary text-foreground rounded px-2 py-1 border-none focus:ring-1 focus:ring-accent"
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
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-foreground"
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
          <div className="flex flex-col items-center justify-center h-32 text-muted">
            <p>No ideas found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-accent mt-2 hover:underline">
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
  idea: Idea;
  onAuthorClick: (author: string) => void;
}

function IdeaCard({ idea, onAuthorClick }: IdeaCardProps) {
  const DirectionIcon =
    idea.direction === 'bullish'
      ? ArrowTrendingUpIcon
      : idea.direction === 'bearish'
      ? ArrowTrendingDownIcon
      : MinusIcon;

  const directionColor =
    idea.direction === 'bullish'
      ? 'text-profit'
      : idea.direction === 'bearish'
      ? 'text-loss'
      : 'text-yellow-500';

  return (
    <div className="p-4 hover:bg-tertiary/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <DirectionIcon className={clsx('w-4 h-4', directionColor)} />
          <span className={clsx('text-sm font-medium capitalize', directionColor)}>
            {idea.direction}
          </span>
          <span className="text-xs text-muted">{formatNumber((idea.confidence ?? 0) * 100, 0)}%</span>
        </div>
        <span className="text-xs text-muted">{formatTimeAgo(idea.createdAt)}</span>
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-1 mb-2">
        {idea.labels.map((label) => (
          <span
            key={label}
            className={clsx(
              'px-1.5 py-0.5 text-2xs font-medium rounded',
              LABEL_COLORS[label] || 'bg-tertiary text-muted'
            )}
          >
            {label.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Text */}
      <p className="text-sm text-foreground leading-relaxed">{idea.text}</p>

      {/* Price levels */}
      {(idea.entryPrice || idea.targetPrice || idea.stopLoss) && (
        <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
          {idea.entryPrice && (
            <span className="text-muted">
              Entry: <span className="text-foreground">${formatNumber(idea.entryPrice)}</span>
            </span>
          )}
          {idea.targetPrice && (
            <span className="text-muted">
              Target: <span className="text-profit">${formatNumber(idea.targetPrice)}</span>
            </span>
          )}
          {idea.stopLoss && (
            <span className="text-muted">
              Stop: <span className="text-loss">${formatNumber(idea.stopLoss)}</span>
            </span>
          )}
        </div>
      )}

      {/* Author */}
      <button
        onClick={() => onAuthorClick(idea.author)}
        className="mt-2 text-xs text-muted hover:text-accent transition-colors"
      >
        @{idea.author}
      </button>
    </div>
  );
}
