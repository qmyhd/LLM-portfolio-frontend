'use client';

import { useState, useEffect, Suspense } from 'react';
import { clsx } from 'clsx';
import { StockMetrics } from './StockMetrics';
import { StockChart } from './StockChart';
import { TradingViewChart } from './TradingViewChart';
import { IdeasPanel } from './IdeasPanel';
import { ChatWidget } from './ChatWidget';
import { RawMessagesPanel } from './RawMessagesPanel';
import { RobinhoodPositionCard } from './RobinhoodPositionCard';
import { RobinhoodStockHeader } from './RobinhoodStockHeader';
import { FundamentalsCard } from './FundamentalsCard';
import { OpenBBInsightsPanel } from './OpenBBInsightsPanel';
import { TradesPanel } from './TradesPanel';
import { NotesPanel } from './NotesPanel';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useStockProfile } from '@/hooks/useStockProfile';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

type ChartProvider = 'lightweight' | 'tradingview';
type TabKey = 'chat' | 'ideas' | 'raw' | 'insights' | 'notes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'raw', label: 'Raw' },
  { key: 'insights', label: 'Insights' },
  { key: 'notes', label: 'Notes' },
];

interface StockHubContentProps {
  ticker: string;
}

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

function ChartSkeleton() {
  return (
    <div className="h-full flex flex-col p-4 animate-pulse">
      <div className="skeleton h-6 w-32 mb-4 rounded" />
      <div className="flex-1 skeleton rounded-lg" />
    </div>
  );
}

const LS_MORE_STATS = 'stock-more-stats';

export function StockHubContent({ ticker }: StockHubContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('ideas');
  const [isFavorite, setIsFavorite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartProvider, setChartProvider] = useState<ChartProvider>('tradingview');
  const [moreStatsOpen, setMoreStatsOpen] = useState(false);

  const { data: profile } = useStockProfile(ticker);

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

    const chartPref = localStorage.getItem('chart-provider');
    if (chartPref === 'lightweight' || chartPref === 'tradingview') {
      setChartProvider(chartPref);
    }

    const statsOpen = localStorage.getItem(LS_MORE_STATS);
    if (statsOpen === null) {
      setMoreStatsOpen(window.innerWidth >= 1024);
    } else {
      setMoreStatsOpen(statsOpen === 'true');
    }
  }, [ticker]);

  const toggleFavorite = () => {
    const stored = localStorage.getItem('portfolio-watchlist');
    let watchlist: string[] = [];
    if (stored) {
      try { watchlist = JSON.parse(stored); } catch { watchlist = []; }
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

  const toggleMoreStats = () => {
    const next = !moreStatsOpen;
    setMoreStatsOpen(next);
    localStorage.setItem(LS_MORE_STATS, String(next));
  };

  const handleRefresh = () => setRefreshKey((p) => p + 1);

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      {/* ── Top section: Header + Position + Returns ── */}
      <div className="border-b border-border">
        {profile ? (
          <RobinhoodStockHeader
            ticker={ticker}
            profile={profile}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div className="px-4 py-4 bg-background-secondary animate-pulse">
            <div className="skeleton h-4 w-16 mb-2 rounded" />
            <div className="skeleton h-7 w-48 mb-2 rounded" />
            <div className="skeleton h-10 w-36 rounded" />
          </div>
        )}

        {/* Inline position card */}
        <div className="px-4 pb-4">
          <Suspense fallback={<CardSkeleton lines={3} />}>
            <RobinhoodPositionCard ticker={ticker} key={`position-${refreshKey}`} />
          </Suspense>
        </div>

        {/* Collapsible More Stats */}
        <div className="border-t border-border">
          <button
            onClick={toggleMoreStats}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            <span>Stats &amp; Fundamentals</span>
            {moreStatsOpen ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            )}
          </button>
          {moreStatsOpen && (
            <div className="px-4 pb-4 space-y-4">
              <Suspense fallback={<CardSkeleton lines={6} />}>
                <StockMetrics ticker={ticker} key={`metrics-${refreshKey}`} />
              </Suspense>
              <Suspense fallback={<CardSkeleton lines={5} />}>
                <FundamentalsCard ticker={ticker} key={`fundamentals-${refreshKey}`} />
              </Suspense>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom section: Chart + Trades | Tabs (resizable) ── */}
      <div className="flex-1 min-h-0 lg:h-[calc(100vh-320px)]">
        {/* Mobile: stacked layout */}
        <div className="flex flex-col lg:hidden">
          {/* Chart */}
          <div className="border-b border-border">
            <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border bg-background-secondary/50">
              <button
                onClick={toggleChartProvider}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  chartProvider === 'tradingview'
                    ? 'bg-primary/20 text-primary'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary',
                )}
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
            <div className="min-h-[300px]">
              <Suspense fallback={<ChartSkeleton />}>
                {chartProvider === 'tradingview' ? (
                  <TradingViewChart symbol={ticker} key={`tv-chart-${refreshKey}`} theme="dark" height={300} autosize={true} />
                ) : (
                  <StockChart ticker={ticker} key={`chart-${refreshKey}`} />
                )}
              </Suspense>
            </div>
          </div>

          {/* Trades (mobile) */}
          <div className="border-b border-border max-h-[250px] overflow-y-auto">
            <div className="px-3 py-2 border-b border-border bg-background-secondary/50">
              <span className="text-xs font-medium text-foreground-muted">Recent Trades</span>
            </div>
            <TradesPanel ticker={ticker} key={`trades-mobile-${refreshKey}`} />
          </div>

          {/* Tabs (mobile) */}
          <div className="min-h-[300px] flex flex-col bg-background-secondary/80">
            <div className="flex border-b border-border bg-background-secondary overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'flex-1 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.key
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
                {activeTab === 'chat' && <ChatWidget ticker={ticker} key={`chat-${refreshKey}`} />}
                {activeTab === 'ideas' && <IdeasPanel ticker={ticker} key={`ideas-${refreshKey}`} />}
                {activeTab === 'raw' && <RawMessagesPanel ticker={ticker} key={`raw-${refreshKey}`} />}
                {activeTab === 'insights' && <OpenBBInsightsPanel ticker={ticker} key={`insights-${refreshKey}`} />}
                {activeTab === 'notes' && <NotesPanel ticker={ticker} key={`notes-${refreshKey}`} />}
              </Suspense>
            </div>
          </div>
        </div>

        {/* Desktop: resizable panels */}
        <PanelGroup orientation="horizontal" className="hidden lg:flex h-full">
          {/* Left panel: Chart + Trades */}
          <Panel defaultSize={60} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Chart controls */}
              <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border bg-background-secondary/50">
                <button
                  onClick={toggleChartProvider}
                  className={clsx(
                    'p-1.5 rounded-md transition-colors',
                    chartProvider === 'tradingview'
                      ? 'bg-primary/20 text-primary'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary',
                  )}
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

              {/* Chart */}
              <div className="flex-1 min-h-[300px]">
                <Suspense fallback={<ChartSkeleton />}>
                  {chartProvider === 'tradingview' ? (
                    <TradingViewChart symbol={ticker} key={`tv-chart-${refreshKey}`} theme="dark" height={400} autosize={true} />
                  ) : (
                    <StockChart ticker={ticker} key={`chart-${refreshKey}`} />
                  )}
                </Suspense>
              </div>

              {/* Trades pinned below chart */}
              <div className="border-t border-border max-h-[250px] overflow-y-auto flex-shrink-0">
                <div className="px-3 py-2 border-b border-border bg-background-secondary/50 sticky top-0 z-10">
                  <span className="text-xs font-medium text-foreground-muted">Recent Trades</span>
                </div>
                <TradesPanel ticker={ticker} key={`trades-${refreshKey}`} />
              </div>
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />

          {/* Right panel: Tabs */}
          <Panel defaultSize={40} minSize={25}>
            <aside className="h-full flex flex-col bg-background-secondary/80 backdrop-blur-md">
              {/* Tab switcher */}
              <div className="flex border-b border-border bg-background-secondary overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      'flex-1 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                      activeTab === tab.key
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
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
                  {activeTab === 'chat' && <ChatWidget ticker={ticker} key={`chat-${refreshKey}`} />}
                  {activeTab === 'ideas' && <IdeasPanel ticker={ticker} key={`ideas-${refreshKey}`} />}
                  {activeTab === 'raw' && <RawMessagesPanel ticker={ticker} key={`raw-${refreshKey}`} />}
                  {activeTab === 'insights' && <OpenBBInsightsPanel ticker={ticker} key={`insights-${refreshKey}`} />}
                  {activeTab === 'notes' && <NotesPanel ticker={ticker} key={`notes-${refreshKey}`} />}
                </Suspense>
              </div>
            </aside>
          </Panel>
        </PanelGroup>
      </div>
    </main>
  );
}
