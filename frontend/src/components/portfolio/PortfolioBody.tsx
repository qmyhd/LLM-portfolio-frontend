'use client';

import { usePortfolio } from '@/hooks';
import { useBucket } from '@/contexts/BucketContext';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { TradeRecap } from '@/components/dashboard/TradeRecap';
import { DailyMoversTable } from '@/components/dashboard/DailyMoversTable';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { SentimentOverview } from '@/components/dashboard/SentimentOverview';
import { CryptoSection } from '@/components/dashboard/CryptoSection';
import { PortfolioRiskCard } from '@/components/dashboard/PortfolioRiskCard';
import { EquityCurveCard } from './EquityCurveCard';
import { BucketEmptyState } from './BucketEmptyState';

/**
 * Body of the /portfolio landing page.
 *
 * Branches on whether the active bucket has any positions:
 * - 0 positions in a non-default bucket: renders a single friendly empty
 *   state, hiding the equity curve / trade recap / movers / holdings
 *   grid that would otherwise stack four "No data" cards together.
 * - Otherwise: renders the normal widget grid.
 */
export function PortfolioBody() {
  const { data, isLoading } = usePortfolio();
  const bucket = useBucket();

  // Only show the consolidated empty state when the user has explicitly
  // selected a bucket — the unfiltered ('all') view should still show
  // the normal widgets even at 0 positions so the page doesn't go blank
  // for users mid-onboarding.
  const isEmptyBucket =
    !isLoading
    && bucket !== null
    && (data?.positions?.length ?? 0) === 0;

  if (isEmptyBucket) {
    return (
      <>
        <EquityCurveCard />
        <BucketEmptyState />
      </>
    );
  }

  return (
    <>
      <EquityCurveCard />
      <TradeRecap />
      <DailyMoversTable />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HoldingsTable />
          <CryptoSection />
        </div>

        <div className="space-y-6">
          <TopMovers />
          <PortfolioRiskCard />
          <SentimentOverview />
        </div>
      </div>
    </>
  );
}
