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
import { ProfilePanel } from './ProfilePanel';
import { AnalysisPanel } from './AnalysisPanel';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useStockProfile } from '@/hooks/useStockProfile';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { BucketBadge } from '@/components/portfolio/BucketBadge';

type ChartProvider = 'lightweight' | 'tradingview';
type TabKey = 'chat' | 'profile' | 'ideas' | 'analysis' | 'raw' | 'insights' | 'notes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'profile', label: 'Profile' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'analysis', label: 'Analysis' },
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

// ---------------------------------------------------------------------------
// Shared sections — rendered exactly once by whichever layout is active,
// so panels (TradingView embeds, chat, SWR subscriptions) never mount twice.
// ---------------------------------------------------------------------------

interface ChartControlsProps {
  chartProvider: ChartProvider;
  onToggleProvider: () => void;
  onRefresh: () => void;
}

function ChartControls({ chartProvider, onToggleProvider, onRefresh }: ChartControlsProps) {
  return (
    <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border/40 bg-background-secondary/30">
      <button
        onClick={onToggleProvider}
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
        onClick={onRefresh}
        className="p-1.5 rounded-md hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
        title="Refresh data"
      >
        <ArrowPathIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ChartAreaProps {
  ticker: string;
  chartProvider: ChartProvider;
  refreshKey: number;
  height: number;
}

function ChartArea({ ticker, chartProvider, refreshKey, height }: ChartAreaProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      {chartProvider === 'tradingview' ? (
        <TradingViewChart symbol={ticker} key={`tv-chart-${refreshKey}`} theme="dark" height={height} autosize={true} />
      ) : (
        <StockChart ticker={ticker} key={`chart-${refreshKey}`} />
      )}
    </Suspense>
  );
}

function TradesSection({ ticker, refreshKey }: { ticker: string; refreshKey: number }) {
  return (
    <>
      <div className="px-3 py-2 border-b border-border/40 bg-background-secondary/30 sticky top-0 z-10">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">Recent Trades</span>
      </div>
      <TradesPanel ticker={ticker} key={`trades-${refreshKey}`} />
    </>
  );
}

interface TabsSectionProps {
  ticker: string;
  refreshKey: number;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

function TabsSection({ ticker, refreshKey, activeTab, onTabChange }: TabsSectionProps) {
  return (
    <>
      <div className="flex border-b border-border/60 bg-background-secondary/30 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
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
          {activeTab === 'analysis' && <AnalysisPanel ticker={ticker} key={`analysis-${refreshKey}`} />}
          {activeTab === 'raw' && <RawMessagesPanel ticker={ticker} key={`raw-${refreshKey}`} />}
          {activeTab === 'insights' && <OpenBBInsightsPanel ticker={ticker} key={`insights-${refreshKey}`} />}
          {activeTab === 'notes' && <NotesPanel ticker={ticker} key={`notes-${refreshKey}`} />}
          {activeTab === 'profile' && <ProfilePanel ticker={ticker} key={`profile-${refreshKey}`} />}
        </Suspense>
      </div>
    </>
  );
}

export function StockHubContent({ ticker }: StockHubContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('ideas');
  const [isFavorite, setIsFavorite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartProvider, setChartProvider] = useState<ChartProvider>('tradingview');
  const [moreStatsOpen, setMoreStatsOpen] = useState(false);

  // null until the breakpoint is known (SSR / first paint) — we render a
  // skeleton then, so only ONE layout ever mounts its data components.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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
      {/* Bucket filter badge — only renders when ?bucket= is set, signals
          that position metrics on this page are scoped to one strategy. */}
      <div className="px-4 pt-3 -mb-1 flex justify-end">
        <Suspense fallback={null}>
          <BucketBadge />
        </Suspense>
      </div>

      {/* ── Top section: Header + Position + Returns ── */}
      <div className="border-b border-border/60 bg-background-secondary/30">
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
        <div className="border-t border-border/40">
          <button
            onClick={toggleMoreStats}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-hover/50 transition-colors"
          >
            <span className="uppercase tracking-wider">Stats &amp; Fundamentals</span>
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

      {/* ── Bottom section: Chart + Trades | Tabs ── */}
      <div className="flex-1 min-h-0 lg:h-[calc(100vh-320px)]">
        {isDesktop === null ? (
          // Breakpoint unknown for one frame — neutral skeleton, no data mounts.
          <div className="min-h-[300px]">
            <ChartSkeleton />
          </div>
        ) : isDesktop ? (
          /* Desktop: resizable panels.
             NOTE: react-resizable-panels v4.7.0 (bvaughn) uses `orientation`,
             not `direction` — verified against the packaged .d.ts. */
          <div className="flex h-full">
            <PanelGroup orientation="horizontal" className="h-full">
              <Panel defaultSize={60} minSize={30}>
                <div className="flex flex-col h-full">
                  <ChartControls
                    chartProvider={chartProvider}
                    onToggleProvider={toggleChartProvider}
                    onRefresh={handleRefresh}
                  />
                  <div className="flex-1 min-h-[300px]">
                    <ChartArea ticker={ticker} chartProvider={chartProvider} refreshKey={refreshKey} height={400} />
                  </div>
                  <div className="border-t border-border/40 max-h-[250px] overflow-y-auto flex-shrink-0">
                    <TradesSection ticker={ticker} refreshKey={refreshKey} />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-primary/50 transition-colors cursor-col-resize" />

              <Panel defaultSize={40} minSize={25}>
                <aside className="h-full flex flex-col">
                  <TabsSection
                    ticker={ticker}
                    refreshKey={refreshKey}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </aside>
              </Panel>
            </PanelGroup>
          </div>
        ) : (
          /* Mobile: stacked layout */
          <div className="flex flex-col">
            <div className="border-b border-border/60">
              <ChartControls
                chartProvider={chartProvider}
                onToggleProvider={toggleChartProvider}
                onRefresh={handleRefresh}
              />
              <div className="min-h-[300px]">
                <ChartArea ticker={ticker} chartProvider={chartProvider} refreshKey={refreshKey} height={300} />
              </div>
            </div>

            <div className="border-b border-border/60 max-h-[250px] overflow-y-auto">
              <TradesSection ticker={ticker} refreshKey={refreshKey} />
            </div>

            <div className="min-h-[300px] flex flex-col">
              <TabsSection
                ticker={ticker}
                refreshKey={refreshKey}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
