'use client';

import { clsx } from 'clsx';

interface AssetBadgeProps {
  /** The position's assetType from the backend, e.g. 'crypto', 'equity', 'adr'. */
  assetType?: string | null;
  /** Optional size override. Default is "xs". */
  size?: 'xs' | 'sm';
  /** Optional className for layout adjustments. */
  className?: string;
}

const STYLES: Record<string, { label: string; cls: string }> = {
  crypto: {
    label: 'CRYPTO',
    cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  },
  etf: {
    label: 'ETF',
    cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  },
  option: {
    label: 'OPT',
    cls: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  },
  adr: {
    label: 'ADR',
    cls: 'bg-teal-500/15 text-teal-500 border-teal-500/30',
  },
  structured: {
    label: 'STR',
    cls: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  },
};

/**
 * Small label badge that flags non-equity asset types alongside a ticker.
 *
 * Crypto in particular needs visible labeling: per the bucket model, crypto
 * positions are folded into whichever strategy bucket the holding account
 * belongs to (no separate crypto bucket), so the badge is what tells the
 * user "this AAPL-looking row is actually a coin."
 *
 * Plain equity (the default) renders nothing — the absence of a badge IS
 * the signal.
 */
export function AssetBadge({ assetType, size = 'xs', className }: AssetBadgeProps) {
  if (!assetType) return null;
  const key = assetType.toLowerCase();
  const style = STYLES[key];
  if (!style) return null;
  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono font-semibold rounded border',
        size === 'xs' ? 'px-1 py-0 text-[9px] leading-tight' : 'px-1.5 py-0.5 text-[10px]',
        style.cls,
        className,
      )}
      aria-label={`Asset type: ${style.label}`}
      title={style.label}
    >
      {style.label}
    </span>
  );
}
