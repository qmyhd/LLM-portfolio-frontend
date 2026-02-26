'use client';

import { clsx } from 'clsx';

interface TimeRangeTabsProps<T extends string> {
  ranges: readonly T[];
  value: T;
  onChange: (range: T) => void;
  className?: string;
}

/**
 * Horizontal pill-tab bar for selecting time ranges.
 * Generic over the range type to support both portfolio and stock-detail
 * range sets.
 */
export function TimeRangeTabs<T extends string>({
  ranges,
  value,
  onChange,
  className,
}: TimeRangeTabsProps<T>) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 bg-background-tertiary p-1 rounded-lg w-fit',
        className,
      )}
    >
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            value === r
              ? 'bg-primary text-white'
              : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
