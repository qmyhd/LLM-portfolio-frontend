'use client';

import { clsx } from 'clsx';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Mini SVG sparkline chart. Renders a single polyline with no axes or labels.
 * Color: green if last > first, red if last < first, grey if equal.
 */
export function Sparkline({ data, width = 64, height = 24, className }: SparklineProps) {
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

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid division by zero

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1; // 1px padding
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = data[data.length - 1];
  const first = data[0];
  const strokeColor =
    last > first ? 'var(--color-profit)' : last < first ? 'var(--color-loss)' : 'var(--color-foreground-muted)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={clsx('flex-shrink-0', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
