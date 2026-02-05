'use client';

import { useState, useEffect, Suspense } from 'react';
import { StockMetrics } from './StockMetrics';
import { StockChart } from './StockChart';
import { TradingViewChart } from './TradingViewChart';
import { IdeasPanel } from './IdeasPanel';
import { ChatWidget } from './ChatWidget';
import { RawMessagesPanel } from './RawMessagesPanel';
import { PositionCard } from './PositionCard';
import { SentimentCard } from './SentimentCard';
import { RiskCard } from './RiskCard';
import {
  StarIcon,
  ArrowPathIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type ChartProvider = 'lightweight' | 'tradingview';

interface StockHubContentProps {
  ticker: string;
}

// Loading skeleton for cards
function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4 animate-pulse">
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="skeleton h-3 w-full mb-2 rounded" />
      ))}
    </div>
  );
}

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <div className="h-full flex flex-col p-4 animate-pulse">
      <div className="skeleton h-6 w-32 mb-4 rounded" />
      <div className="flex-1 skeleton rounded-lg" />
    </div>
  );
}

export function StockHubContent({ ticker }: StockHubContentProps) {
  const [activeTab, setActiveTab] = useState<'ideas' | 'chat' | 'raw'>('ideas');
  const [isFavorite, setIsFavorite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartProvider, setChartProvider] = useState<ChartProvider>('tradingview');

  // Check if ticker is in favorites
  useEffect(() => {
    const stored = localStorage.getItem('portfolio-watchlist');
    if (stored) {
      try {
        const watchlist = JSON.parse(stored);
        setIsFavorite(watchlist.includes(ticker));
      } catch {
        setIsFavorite(false);
      }
    }
    
    // Load chart provider preference
    const chartPref = localStorage.getItem('chart-provider');
    if (chartPref === 'lightweight' || chartPref === 'tradingview') {
      setChartProvider(chartPref);
    }
  }, [ticker]);

  const toggleFavorite = () => {
    const stored = localStorage.getItem('portfolio-watchlist');
    let watchlist: string[] = [];
    if (stored) {
      try {
        watchlist = JSON.parse(stored);
      } catch {
        watchlist = [];
      }
    }

    if (isFavorite) {
      watchlist = watchlist.filter((t) => t !== ticker);
    } else {
      watchlist.push(ticker);
    }

    localStorage.setItem('portfolio-watchlist', JSON.stringify(watchlist));
    setIsFavorite(!isFavorite);
  };

  const toggleChartProvider = () => {
    const newProvider = chartProvider === 'lightweight' ? 'tradingview' : 'lightweight';
    setChartProvider(newProvider);
    localStorage.setItem('chart-provider', newProvider);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="flex-1 overflow-hidden bg-primary">
      {/* Stock Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">{ticker}</h1>
          <button
            onClick={toggleFavorite}
            className="p-1.5 rounded-lg hover:bg-tertiary transition-colors"
            title={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isFavorite ? (
              <StarIconSolid className="h-5 w-5 text-yellow-500" />
            ) : (
              <StarIcon className="h-5 w-5 text-muted" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleChartProvider}
            className={`p-2 rounded-lg transition-colors ${
              chartProvider === 'tradingview' 
                ? 'bg-primary/20 text-primary' 
                : 'text-muted hover:text-foreground hover:bg-tertiary'
            }`}
            title={`Switch to ${chartProvider === 'lightweight' ? 'TradingView' : 'Lightweight'} chart`}
          >
            <ChartBarIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-tertiary text-muted hover:text-foreground transition-colors"
            title="Refresh data"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-tertiary text-muted hover:text-foreground transition-colors"
            title="Share"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-tertiary text-muted hover:text-foreground transition-colors"
            title="More options"
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="h-[calc(100%-56px)] flex flex-col lg:flex-row">
        {/* Left Column - Stacked Cards */}
        <aside className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto flex-shrink-0 p-4 space-y-4">
          {/* Profile Card - loads first (critical info) */}
          <Suspense fallback={<CardSkeleton lines={4} />}>
            <StockMetrics ticker={ticker} key={`metrics-${refreshKey}`} />
          </Suspense>

          {/* Position Card - user's holding */}
          <Suspense fallback={<CardSkeleton lines={3} />}>
            <PositionCard ticker={ticker} key={`position-${refreshKey}`} />
          </Suspense>

          {/* Sentiment Card */}
          <Suspense fallback={<CardSkeleton lines={2} />}>
            <SentimentCard ticker={ticker} key={`sentiment-${refreshKey}`} />
          </Suspense>

          {/* Risk Card */}
          <Suspense fallback={<CardSkeleton lines={3} />}>
            <RiskCard ticker={ticker} key={`risk-${refreshKey}`} />
          </Suspense>
        </aside>

        {/* Middle Column - Chart (owns height) */}
        <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-border overflow-hidden flex flex-col">
          <Suspense fallback={<ChartSkeleton />}>
            {chartProvider === 'tradingview' ? (
              <TradingViewChart 
                symbol={ticker} 
                key={`tv-chart-${refreshKey}`}
                theme="dark"
                height={500}
                autosize={true}
              />
            ) : (
              <StockChart ticker={ticker} key={`chart-${refreshKey}`} />
            )}
          </Suspense>
        </div>

        {/* Right Column - Tabbed Panel */}
        <aside className="w-full lg:w-80 xl:w-96 overflow-hidden flex flex-col flex-shrink-0">
          {/* Tab switcher */}
          <div className="flex border-b border-border bg-secondary">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-accent border-b-2 border-accent bg-accent/5'
                  : 'text-muted hover:text-foreground hover:bg-tertiary'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'ideas'
                  ? 'text-accent border-b-2 border-accent bg-accent/5'
                  : 'text-muted hover:text-foreground hover:bg-tertiary'
              }`}
            >
              Ideas
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'text-accent border-b-2 border-accent bg-accent/5'
                  : 'text-muted hover:text-foreground hover:bg-tertiary'
              }`}
            >
              Raw
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            <Suspense
              fallback={
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              }
            >
              {activeTab === 'chat' && (
                <ChatWidget ticker={ticker} key={`chat-${refreshKey}`} />
              )}
              {activeTab === 'ideas' && (
                <IdeasPanel ticker={ticker} key={`ideas-${refreshKey}`} />
              )}
              {activeTab === 'raw' && (
                <RawMessagesPanel ticker={ticker} key={`raw-${refreshKey}`} />
              )}
            </Suspense>
          </div>
        </aside>
      </div>
    </main>
  );
}
