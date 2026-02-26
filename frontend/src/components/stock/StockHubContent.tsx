'use client';

import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { StockMetrics } from './StockMetrics';
import { StockChart } from './StockChart';
import { TradingViewChart } from './TradingViewChart';
import { IdeasPanel } from './IdeasPanel';
import { ChatWidget } from './ChatWidget';
import { RawMessagesPanel } from './RawMessagesPanel';
import { RobinhoodPositionCard } from './RobinhoodPositionCard';
import { RobinhoodStockHeader } from './RobinhoodStockHeader';
import { SentimentCard } from './SentimentCard';
import { RiskCard } from './RiskCard';
import { FundamentalsCard } from './FundamentalsCard';
import { OpenBBInsightsPanel } from './OpenBBInsightsPanel';
import {
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { StockProfileCurrent } from '@/types/api';

const profileFetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
    return r.json();
  });

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
  const [activeTab, setActiveTab] = useState<'ideas' | 'chat' | 'raw' | 'insights'>('ideas');
  const [isFavorite, setIsFavorite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartProvider, setChartProvider] = useState<ChartProvider>('tradingview');

  // Fetch stock profile for header
  const { data: profile } = useSWR<StockProfileCurrent>(
    `/api/stocks/${ticker}`,
    profileFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

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
    <main className="flex-1 overflow-hidden bg-background">
      {/* Robinhood-style Stock Header */}
      {profile ? (
        <RobinhoodStockHeader
          ticker={ticker}
          profile={profile}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <div className="px-4 py-4 border-b border-border bg-background-secondary animate-pulse">
          <div className="skeleton h-4 w-16 mb-2 rounded" />
          <div className="skeleton h-7 w-48 mb-2 rounded" />
          <div className="skeleton h-10 w-36 rounded" />
        </div>
      )}

      {/* Three-column layout */}
      <div className="h-[calc(100%-56px)] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Column - Stacked Cards */}
        <aside className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto flex-shrink-0 p-4 space-y-4 bg-background-secondary/80 backdrop-blur-md">
          {/* Profile Card - loads first (critical info) */}
          <Suspense fallback={<CardSkeleton lines={4} />}>
            <StockMetrics ticker={ticker} key={`metrics-${refreshKey}`} />
          </Suspense>

          {/* Position Card - Robinhood-style */}
          <Suspense fallback={<CardSkeleton lines={3} />}>
            <RobinhoodPositionCard ticker={ticker} key={`position-${refreshKey}`} />
          </Suspense>

          {/* Sentiment Card */}
          <Suspense fallback={<CardSkeleton lines={2} />}>
            <SentimentCard ticker={ticker} key={`sentiment-${refreshKey}`} />
          </Suspense>

          {/* Risk Card */}
          <Suspense fallback={<CardSkeleton lines={3} />}>
            <RiskCard ticker={ticker} key={`risk-${refreshKey}`} />
          </Suspense>

          {/* Fundamentals Card */}
          <Suspense fallback={<CardSkeleton lines={5} />}>
            <FundamentalsCard ticker={ticker} key={`fundamentals-${refreshKey}`} />
          </Suspense>
        </aside>

        {/* Middle Column - Chart (owns height) */}
        <div className="flex-1 min-w-0 min-h-[400px] border-b lg:border-b-0 lg:border-r border-border overflow-hidden flex flex-col">
          {/* Chart controls */}
          <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border bg-background-secondary/50">
            <button
              onClick={toggleChartProvider}
              className={`p-1.5 rounded-md transition-colors ${
                chartProvider === 'tradingview'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
              title={`Switch to ${chartProvider === 'lightweight' ? 'TradingView' : 'Lightweight'} chart`}
            >
              <ChartBarIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-md hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
              title="Refresh data"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
            </button>
          </div>
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
        <aside className="w-full lg:w-80 xl:w-96 min-h-[300px] overflow-hidden flex flex-col flex-shrink-0 bg-background-secondary/80 backdrop-blur-md">
          {/* Tab switcher */}
          <div className="flex border-b border-border bg-background-secondary">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'ideas'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Ideas
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Raw
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Insights
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
              {activeTab === 'insights' && (
                <OpenBBInsightsPanel ticker={ticker} key={`insights-${refreshKey}`} />
              )}
            </Suspense>
          </div>
        </aside>
      </div>
    </main>
  );
}
