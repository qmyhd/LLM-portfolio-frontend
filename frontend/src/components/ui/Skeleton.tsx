'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

// Base skeleton bar -- configurable via className for h/w
function Line({ className }: SkeletonProps) {
  return <div className={clsx('skeleton rounded', className)} />;
}

// Circular skeleton
function Circle({ className }: SkeletonProps) {
  return <div className={clsx('skeleton rounded-full', className)} />;
}

// Card-shaped skeleton with header + body lines
function Card({ className }: SkeletonProps) {
  return (
    <div className={clsx('card p-4 space-y-3', className)}>
      <Line className="h-4 w-32" />
      <Line className="h-3 w-full" />
      <Line className="h-3 w-3/4" />
    </div>
  );
}

// Table row skeleton -- mimics a data row with multiple columns
function TableRow({ className, cols = 4 }: SkeletonProps & { cols?: number }) {
  return (
    <div className={clsx('flex items-center gap-4 py-3 px-4', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Line
          key={i}
          className={clsx(
            'h-4',
            i === 0 ? 'w-24' : i === cols - 1 ? 'w-16' : 'w-20 flex-1'
          )}
        />
      ))}
    </div>
  );
}

// List item skeleton -- icon circle + text lines
function ListItem({ className }: SkeletonProps) {
  return (
    <div className={clsx('flex items-center gap-3 py-2', className)}>
      <Circle className="h-8 w-8 shrink-0" />
      <div className="flex-1 space-y-2">
        <Line className="h-3 w-32" />
        <Line className="h-3 w-20" />
      </div>
    </div>
  );
}

// Export as namespace-style
export const Skeleton = {
  Line,
  Circle,
  Card,
  TableRow,
  ListItem,
};
