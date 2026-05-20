'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  BUCKET_NAMES,
  BUCKET_LABELS,
  parseBucket,
  type BucketName,
} from '@/lib/bucket';

/** Compact labels for narrow screens. */
const SHORT_LABELS: Record<BucketName, string> = {
  long_term: 'Long',
  swing: 'Swing',
  day: 'Day',
  retirement: 'IRA',
  other: 'Other',
};

interface BucketSwitcherProps {
  /** Show the "All" tab in addition to the five buckets. Default: true. */
  showAll?: boolean;
  /** Compact spacing for inline contexts. Default: false. */
  compact?: boolean;
}

/**
 * Tab strip for selecting the active strategy bucket on Portfolio pages.
 *
 * URL is the source of truth: clicking a tab pushes `?bucket=<name>` (or
 * removes it for "All"), and all bucket-aware hooks immediately refetch.
 * Pair with `<BucketProvider bucket={parseBucket(...)}>` in the parent
 * layout so the rest of the tree reads the current value.
 *
 * Self-wrapped in `Suspense` because `useSearchParams()` suspends during
 * streaming SSR — this makes the component safe to mount anywhere without
 * the caller having to remember the boundary.
 */
export function BucketSwitcher(props: BucketSwitcherProps) {
  return (
    <Suspense fallback={<div className="h-9 mb-4 border-b border-border" aria-hidden />}>
      <BucketSwitcherInner {...props} />
    </Suspense>
  );
}

function BucketSwitcherInner({ showAll = true, compact = false }: BucketSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active: BucketName | null = parseBucket(searchParams.get('bucket'));

  const setBucket = (next: BucketName | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set('bucket', next);
    } else {
      params.delete('bucket');
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const tabs: Array<{
    key: string;
    fullLabel: string;
    shortLabel: string;
    value: BucketName | null;
  }> = [
    ...(showAll ? [{ key: 'all', fullLabel: 'All', shortLabel: 'All', value: null }] : []),
    ...BUCKET_NAMES.map((b) => ({
      key: b,
      fullLabel: BUCKET_LABELS[b],
      shortLabel: SHORT_LABELS[b],
      value: b as BucketName | null,
    })),
  ];

  return (
    // overflow-x-auto + snap-x keeps the strip on one line on narrow screens
    // while letting users swipe through buckets. The hidden scrollbar keeps
    // it visually clean.
    <div
      className={clsx(
        'flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar snap-x snap-mandatory',
        compact ? 'pb-1' : 'pb-2 mb-4',
      )}
      role="tablist"
      aria-label="Strategy bucket filter"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => setBucket(tab.value)}
            className={clsx(
              'shrink-0 snap-start px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
            )}
            title={tab.fullLabel}
          >
            {/* Full label on sm+ screens, short label below sm. */}
            <span className="hidden sm:inline">{tab.fullLabel}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
