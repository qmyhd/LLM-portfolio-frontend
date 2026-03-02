import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TickerBar } from '@/components/dashboard/TickerBar';
import { RobinhoodHeader } from '@/components/dashboard/RobinhoodHeader';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { TradeRecap } from '@/components/dashboard/TradeRecap';
import { DailyMoversTable } from '@/components/dashboard/DailyMoversTable';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { SentimentOverview } from '@/components/dashboard/SentimentOverview';
import { CryptoSection } from '@/components/dashboard/CryptoSection';
import { DebugOverlay } from '@/components/dashboard/DebugOverlay';
import { ReconPanel } from '@/components/dashboard/ReconPanel';
import { ConnectionBanner } from '@/components/dashboard/ConnectionBanner';

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky top: bar + ticker */}
        <div className="sticky top-0 z-30 bg-background">
          <TopBar />
          <TickerBar />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Connection status warning */}
            <ConnectionBanner />

            {/* Debug overlay (NEXT_PUBLIC_DEBUG_UI=1) */}
            <DebugOverlay />

            {/* Recon mode panel (?recon=1) */}
            <Suspense fallback={null}>
              <ReconPanel />
            </Suspense>

            {/* Portfolio Header (Robinhood-style value + chart) */}
            <RobinhoodHeader />

            {/* Summary cards strip */}
            <PortfolioSummary />

            {/* Trade Recap (Blossom-style trade cards) */}
            <TradeRecap />

            {/* Daily Movers Table (full width) */}
            <DailyMoversTable />

            {/* Two column layout: holdings + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <HoldingsTable />
                <CryptoSection />
              </div>

              <div className="space-y-6">
                <TopMovers />
                <SentimentOverview />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
