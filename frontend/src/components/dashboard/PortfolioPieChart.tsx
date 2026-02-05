'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface PortfolioHolding {
  symbol: string;
  companyName: string;
  logoUrl?: string;
  weight: number; // Percentage of portfolio (0-100)
  totalReturn: number; // Percentage gain/loss
  value: number;
}

interface PortfolioPieChartProps {
  holdings: PortfolioHolding[];
  totalReturn: number;
  positionCount: number;
  className?: string;
}

type TimePeriod = 'All Time' | '1Y' | '6M' | '3M' | '1M' | '1W';

// Color palette for the donut chart (matching the image style)
const CHART_COLORS = [
  '#3ba55d', // Profit green (primary/largest) - matches theme
  '#5865f2', // Primary blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber/neutral
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#14B8A6', // Cyan
  '#F97316', // Orange
  '#ed4245', // Loss red
];

function getCompanyLogo(symbol: string, logoUrl?: string) {
  // Use Clearbit Logo API for stock logos (reliable and free)
  const companyDomains: Record<string, string> = {
    NVDA: 'nvidia.com',
    AMZN: 'amazon.com',
    GOOGL: 'google.com',
    GOOG: 'google.com',
    AMD: 'amd.com',
    AAPL: 'apple.com',
    MSFT: 'microsoft.com',
    TSLA: 'tesla.com',
    META: 'meta.com',
    NFLX: 'netflix.com',
    INTC: 'intel.com',
    CRM: 'salesforce.com',
    ORCL: 'oracle.com',
    ADBE: 'adobe.com',
    PYPL: 'paypal.com',
    V: 'visa.com',
    MA: 'mastercard.com',
    JPM: 'jpmorganchase.com',
    BAC: 'bankofamerica.com',
    WFC: 'wellsfargo.com',
    DIS: 'disney.com',
    SBUX: 'starbucks.com',
    NKE: 'nike.com',
    KO: 'coca-cola.com',
    PEP: 'pepsi.com',
  };

  if (logoUrl) return logoUrl;
  
  const domain = companyDomains[symbol.toUpperCase()];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  
  return null;
}

function LogoOrInitial({ symbol, logoUrl, color }: { symbol: string; logoUrl?: string; color: string }) {
  const [imgError, setImgError] = useState(false);
  const logo = getCompanyLogo(symbol, logoUrl);

  if (logo && !imgError) {
    return (
      <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden border border-border">
        <img
          src={logo}
          alt={symbol}
          className="w-6 h-6 object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback to colored initial
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ backgroundColor: color }}
    >
      {symbol.charAt(0)}
    </div>
  );
}

function DonutChart({
  holdings,
  totalReturn,
  selectedPeriod,
  onPeriodChange,
}: {
  holdings: PortfolioHolding[];
  totalReturn: number;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const periods: TimePeriod[] = ['All Time', '1Y', '6M', '3M', '1M', '1W'];

  // Calculate donut segments
  const segments = useMemo(() => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;

    return holdings.map((holding, index) => {
      const percent = holding.weight / 100;
      const offset = cumulativePercent * circumference;
      const length = percent * circumference;
      cumulativePercent += percent;

      return {
        color: CHART_COLORS[index % CHART_COLORS.length],
        strokeDasharray: `${length} ${circumference - length}`,
        strokeDashoffset: -offset,
        weight: holding.weight,
      };
    });
  }, [holdings]);

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Donut Chart */}
      <svg viewBox="0 0 220 220" className="w-52 h-52 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          stroke="rgba(42, 45, 49, 0.5)"
          strokeWidth="24"
        />
        {/* Segment circles */}
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke={segment.color}
            strokeWidth="24"
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-300"
          />
        ))}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-3xl font-bold ${totalReturn >= 0 ? 'text-profit' : 'text-loss'}`}
        >
          {totalReturn >= 0 ? '+' : ''}
          {totalReturn.toFixed(2)}%
        </span>

        {/* Period dropdown */}
        <div className="relative mt-1">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            {selectedPeriod}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-background-elevated border border-border rounded-lg shadow-card py-1 min-w-[100px] z-10">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    onPeriodChange(period);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-background-hover transition-colors ${
                    period === selectedPeriod ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HoldingRow({ holding, color }: { holding: PortfolioHolding; color: string }) {
  const isPositive = holding.totalReturn >= 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <LogoOrInitial symbol={holding.symbol} logoUrl={holding.logoUrl} color={color} />
        <div>
          <p className="font-semibold text-foreground">{holding.symbol}</p>
          <p className="text-sm text-foreground-muted truncate max-w-[120px]">{holding.companyName}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold text-foreground">{holding.weight.toFixed(1)}%</p>
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            isPositive ? 'bg-profit-muted text-profit' : 'bg-loss-muted text-loss'
          }`}
        >
          {isPositive ? '+' : ''}
          {holding.totalReturn.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export function PortfolioPieChart({
  holdings,
  totalReturn,
  positionCount,
  className = '',
}: PortfolioPieChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('All Time');

  // Sort holdings by weight descending and take top items
  const sortedHoldings = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => b.weight - a.weight);
    const top5 = sorted.slice(0, 5);
    const othersWeight = sorted.slice(5).reduce((sum, h) => sum + h.weight, 0);

    if (othersWeight > 0) {
      // Add "OTHER" category for remaining holdings
      return [
        ...top5,
        {
          symbol: 'OTHER',
          companyName: `${sorted.length - 5} more`,
          weight: othersWeight,
          totalReturn: 0,
          value: sorted.slice(5).reduce((sum, h) => sum + h.value, 0),
        },
      ];
    }

    return top5;
  }, [holdings]);

  // Display holdings (exclude OTHER from the list)
  const displayHoldings = sortedHoldings.filter((h) => h.symbol !== 'OTHER');

  return (
    <div className={`card ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Portfolio</h3>
            <span className="text-foreground-muted">• {positionCount} positions</span>
          </div>
        </div>

        {/* Chart and List side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Donut Chart */}
          <div className="flex justify-center">
            <DonutChart
              holdings={sortedHoldings}
              totalReturn={totalReturn}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>

          {/* Holdings List */}
          <div className="flex flex-col">
            {displayHoldings.map((holding, index) => (
              <HoldingRow
                key={holding.symbol}
                holding={holding}
                color={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}

            {/* See all stocks link */}
            <Link
              href="/positions"
              className="mt-4 text-sm text-foreground-muted hover:text-primary transition-colors text-center flex items-center justify-center gap-1"
            >
              See all stocks
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export mock data for development
export const mockPortfolioHoldings: PortfolioHolding[] = [
  { symbol: 'NVDA', companyName: 'NVIDIA Corporation', weight: 8.7, totalReturn: 66.45, value: 10947 },
  { symbol: 'AMZN', companyName: 'Amazon.com Inc', weight: 6.5, totalReturn: 30.76, value: 8182 },
  { symbol: 'ETH', companyName: 'Ethereum', weight: 5.6, totalReturn: 37.91, value: 7049 },
  { symbol: 'GOOGL', companyName: 'Alphabet Inc Class A', weight: 5.6, totalReturn: 14.55, value: 7049 },
  { symbol: 'AMD', companyName: 'Advanced Micro De...', weight: 5.5, totalReturn: 27.59, value: 6924 },
];
