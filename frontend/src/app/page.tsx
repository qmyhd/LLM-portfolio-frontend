import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TickerBar } from '@/components/dashboard/TickerBar';
import { RobinhoodHeader } from '@/components/dashboard/RobinhoodHeader';
import { HoldingsList } from '@/components/dashboard/HoldingsList';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { SentimentOverview } from '@/components/dashboard/SentimentOverview';
import { DebugOverlay } from '@/components/dashboard/DebugOverlay';
import { ReconPanel } from '@/components/dashboard/ReconPanel';

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with search */}
        <TopBar />

        {/* Ticker tape */}
        <TickerBar />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Debug overlay (NEXT_PUBLIC_DEBUG_UI=1) */}
            <DebugOverlay />

            {/* Recon mode panel (?recon=1) */}
            <Suspense fallback={null}>
              <ReconPanel />
            </Suspense>

            {/* Portfolio Header (Robinhood-style) */}
            <RobinhoodHeader />

            {/* Two column layout for tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Holdings List - spans 2 columns */}
              <div className="lg:col-span-2">
                <HoldingsList />
              </div>

              {/* Right sidebar with movers and sentiment */}
              <div className="space-y-6">
                <TopMovers />
                <SentimentOverview />
              </div>
            </div>

            {/* Recent Orders */}
            <RecentOrders />
          </div>
        </main>
      </div>
    </div>
  );
}
