'use client';

import { Suspense } from 'react';
import { clsx } from 'clsx';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useBucket } from '@/contexts/BucketContext';
import { BUCKET_LABELS } from '@/lib/bucket';

interface BucketBadgeProps {
  /** Show a tooltip-style explanation, e.g. on the stock detail page. Default true. */
  showHint?: boolean;
  /** Show a small "x" button to clear the bucket filter. Default true. */
  dismissible?: boolean;
  className?: string;
}

/**
 * Visual indicator that the current page is scoped to a single bucket.
 *
 * Used on stock detail pages so the user understands why position metrics
 * differ from the portfolio-wide view ("AAPL — Swing only: 10 shares").
 * Hidden entirely when no bucket is active (returns null).
 *
 * Pair with `<BucketProvider>` in the parent layout. The dismiss button
 * removes the ?bucket= query param from the URL via router.push, which
 * triggers BucketProvider to re-render with bucket=null and all
 * bucket-aware hooks to refetch portfolio-wide data.
 */
export function BucketBadge(props: BucketBadgeProps) {
  // Self-wrap in Suspense because the inner component calls useSearchParams,
  // which suspends during streaming SSR. Fallback is null because the badge
  // is purely informational — its absence is a fine intermediate state.
  return (
    <Suspense fallback={null}>
      <BucketBadgeInner {...props} />
    </Suspense>
  );
}

function BucketBadgeInner({
  showHint = true,
  dismissible = true,
  className,
}: BucketBadgeProps) {
  const bucket = useBucket();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!bucket) return null;

  const clearBucket = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('bucket');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full',
        'bg-primary/10 text-primary border border-primary/30',
        'text-xs font-medium',
        className,
      )}
      role="status"
      aria-label={`Filtered to ${BUCKET_LABELS[bucket]} bucket`}
    >
      <span className="font-semibold">{BUCKET_LABELS[bucket]}</span>
      {showHint && <span className="text-primary/70">only</span>}
      {dismissible && (
        <button
          onClick={clearBucket}
          className="ml-0.5 -mr-1 p-0.5 rounded hover:bg-primary/20 transition-colors"
          aria-label="Clear bucket filter"
          title="Show all buckets"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
