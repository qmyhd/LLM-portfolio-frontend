import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { PositionsTable } from '@/components/dashboard/PositionsTable';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { SentimentOverview } from '@/components/dashboard/SentimentOverview';

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with search */}
        <TopBar />
        
        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Portfolio Summary Cards */}
            <PortfolioSummary />
            
            {/* Two column layout for tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Positions Table - spans 2 columns */}
              <div className="lg:col-span-2">
                <PositionsTable />
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
