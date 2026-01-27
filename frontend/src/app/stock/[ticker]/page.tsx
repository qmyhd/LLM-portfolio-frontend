import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { StockHubContent } from '@/components/stock/StockHubContent';

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();

  return (
    <div className="flex h-screen">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with search */}
        <TopBar currentTicker={normalizedTicker} />
        
        {/* Stock hub content - three column layout */}
        <StockHubContent ticker={normalizedTicker} />
      </div>
    </div>
  );
}

// Generate static params for popular tickers (optional optimization)
export async function generateStaticParams() {
  return [
    { ticker: 'AAPL' },
    { ticker: 'MSFT' },
    { ticker: 'GOOGL' },
    { ticker: 'NVDA' },
    { ticker: 'TSLA' },
  ];
}
