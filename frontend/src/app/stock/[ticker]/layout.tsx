'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { BucketProvider } from '@/contexts/BucketContext';
import { parseBucket } from '@/lib/bucket';

/**
 * Stock-detail bucket context.
 *
 * When the user navigates from a bucket-filtered Portfolio view to a
 * stock page (e.g., /stock/AAPL?bucket=swing), the URL carries the
 * bucket and this layout exposes it via BucketContext so the position
 * panel and trades panel scope themselves to that bucket. Stock-wide
 * data (price, news, sentiment) is unaffected since those hooks ignore
 * the bucket value.
 */
function StockLayoutInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const bucket = parseBucket(searchParams.get('bucket'));
  return <BucketProvider bucket={bucket}>{children}</BucketProvider>;
}

export default function StockLayout({ children }: { children: ReactNode }) {
  // See PortfolioLayout for the rationale behind `fallback={null}` —
  // rendering children inside the fallback would let bucket-aware hooks
  // run before the provider resolves, returning stale-null data.
  return (
    <Suspense fallback={null}>
      <StockLayoutInner>{children}</StockLayoutInner>
    </Suspense>
  );
}
