'use client';

import { clsx } from 'clsx';

interface QQQLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'text-lg h-8',
  md: 'text-3xl h-16',
  lg: 'text-6xl h-screen',
} as const;

/**
 * Branded "QQQ" loading animation with gradient shimmer.
 * Letters fade in with staggered delay, then pulse.
 */
export function QQQLoader({ size = 'sm', className }: QQQLoaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        SIZE_MAP[size],
        className,
      )}
    >
      <span className="qqq-loader font-bold font-mono tracking-widest select-none">
        {'QQQ'.split('').map((letter, i) => (
          <span
            key={i}
            className="qqq-loader-letter"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {letter}
          </span>
        ))}
      </span>
    </div>
  );
}
