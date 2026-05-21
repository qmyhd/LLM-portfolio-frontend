'use client';

import Link from 'next/link';
import { BriefcaseIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useBucket } from '@/contexts/BucketContext';
import { BUCKET_LABELS } from '@/lib/bucket';

/**
 * Single, friendly empty state for a bucket with zero accounts/positions.
 *
 * Used in place of the stacked widget grid on `/portfolio` when the
 * active bucket has nothing to show — previously the page rendered four
 * separate "No data" cards from TradeRecap, HoldingsTable, TopMovers,
 * and DailyMoversTable side-by-side, which felt like the page was
 * broken. This is a single intentional empty state instead.
 */
export function BucketEmptyState() {
  const bucket = useBucket();
  const label = bucket ? BUCKET_LABELS[bucket] : 'this bucket';

  return (
    <div className="card p-10 text-center max-w-xl mx-auto">
      <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <BriefcaseIcon className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Nothing in <span className="text-primary">{label}</span> yet
      </h2>
      <p className="text-sm text-foreground-muted mt-2 max-w-md mx-auto">
        No accounts are assigned to this strategy bucket. Assign one in Settings
        — once a SnapTrade account is tagged, its positions, trades, and equity
        curve will surface here automatically.
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Open Settings
        </Link>
        <Link
          href="/portfolio"
          className="text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Back to all buckets
        </Link>
      </div>
    </div>
  );
}
