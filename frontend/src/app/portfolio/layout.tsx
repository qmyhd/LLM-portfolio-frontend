'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { BucketProvider } from '@/contexts/BucketContext';
import { parseBucket } from '@/lib/bucket';

interface PortfolioLayoutProps {
  children: ReactNode;
}

/**
 * Provides the active strategy bucket to all `/portfolio/*` pages.
 *
 * Reads the bucket from the URL (`?bucket=long_term`) and exposes it via
 * `BucketContext`. Pages render `<BucketSwitcher />` themselves so the
 * tab strip lives inside each page's main content (matches the existing
 * per-page Sidebar/TopBar layout pattern).
 */
function PortfolioLayoutInner({ children }: PortfolioLayoutProps) {
  const searchParams = useSearchParams();
  const bucket = parseBucket(searchParams.get('bucket'));
  return <BucketProvider bucket={bucket}>{children}</BucketProvider>;
}

export default function PortfolioLayout({ children }: PortfolioLayoutProps) {
  // Suspense boundary required because useSearchParams suspends during
  // streaming SSR for client components. The fallback intentionally
  // renders NOTHING (not children) — rendering children inside the
  // fallback would let hooks run without BucketProvider, returning a
  // stale `null` bucket and triggering a wrong-data fetch that gets
  // re-fetched once the provider resolves. A brief blank flash is
  // preferable to flashing wrong data.
  return (
    <Suspense fallback={null}>
      <PortfolioLayoutInner>{children}</PortfolioLayoutInner>
    </Suspense>
  );
}
