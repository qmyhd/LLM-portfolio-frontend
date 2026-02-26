'use client';

import { clsx } from 'clsx';
import { pnlPillClasses } from '@/lib/colors';

interface MetricPillProps {
  /** Formatted display text (e.g. "+$250.50" or "+12.5%") */
  text: string;
  /** Numeric value for color determination */
  numeric: number | null | undefined;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
}

export function MetricPill({
  text,
  numeric,
  size = 'sm',
  className,
}: MetricPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md font-mono font-semibold pill-transition',
        size === 'sm' && 'px-2.5 py-1 text-xs',
        size === 'md' && 'px-3 py-1.5 text-sm',
        pnlPillClasses(numeric),
        className,
      )}
    >
      {text}
    </span>
  );
}
