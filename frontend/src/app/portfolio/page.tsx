import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TickerBar } from '@/components/dashboard/TickerBar';
import { RobinhoodHeader } from '@/components/dashboard/RobinhoodHeader';
import { DebugOverlay } from '@/components/dashboard/DebugOverlay';
import { ReconPanel } from '@/components/dashboard/ReconPanel';
import { ConnectionBanner } from '@/components/dashboard/ConnectionBanner';
import { BucketSwitcher } from '@/components/portfolio/BucketSwitcher';
import { PortfolioBody } from '@/components/portfolio/PortfolioBody';

export default function PortfolioLandingPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-30 bg-background">
          <TopBar />
          <TickerBar />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<div className="h-9 mb-4 border-b border-border" aria-hidden />}>
              <BucketSwitcher />
            </Suspense>

            <ConnectionBanner />
            <DebugOverlay />

            <Suspense fallback={null}>
              <ReconPanel />
            </Suspense>

            {/* RobinhoodHeader carries total value, range-aware change,
                cash, buying power, and position count — the five separate
                metric cards underneath it were redundant and have been
                removed. */}
            <RobinhoodHeader />

            {/* PortfolioBody decides between the full widget grid and a
                single empty-bucket card based on positionsCount + bucket,
                so empty buckets don't stack four "No data" widgets. */}
            <PortfolioBody />
          </div>
        </main>
      </div>
    </div>
  );
}
