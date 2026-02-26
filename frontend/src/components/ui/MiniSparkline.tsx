'use client';

import { clsx } from 'clsx';
import { Sparkline } from '@/components/dashboard/Sparkline';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Sparkline with empty-state support.
 * When data is empty or has <2 points, shows a dotted gray baseline
 * instead of rendering nothing.
 */
export function MiniSparkline({
  data,
  width = 64,
  height = 24,
  className,
}: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={clsx('flex-shrink-0', className)}
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--color-foreground-muted)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.4"
        />
      </svg>
    );
  }

  return (
    <Sparkline data={data} width={width} height={height} className={className} />
  );
}
