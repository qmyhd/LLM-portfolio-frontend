'use client';

import Link from 'next/link';
import type { Position } from '@/types/api';
import type { HoldingSortMode } from './ValuePill';
import { MiniSparkline } from '@/components/ui/MiniSparkline';
import { AssetBadge } from '@/components/ui/AssetBadge';
import { ValuePill } from './ValuePill';
import { COMPANY_NAMES } from '@/lib/mappers';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';

interface HoldingRowProps {
  position: Position;
  sparklineData?: number[];
  sortMode: HoldingSortMode;
}

export function HoldingRow({ position, sparklineData, sortMode }: HoldingRowProps) {
  const companyName = position.companyName || COMPANY_NAMES[position.symbol] || '';
  const bucket = useBucket();

  return (
    <Link
      href={stockHref(position.symbol, bucket)}
      className="flex items-center justify-between py-3 px-4 hover:bg-background-hover transition-colors border-b border-border last:border-b-0"
    >
      {/* Left: Ticker + company name */}
      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono font-semibold text-base">{position.symbol}</span>
          <AssetBadge assetType={position.assetType} />
        </span>
        {companyName && (
          <p className="text-xs text-foreground-muted truncate mt-0.5">{companyName}</p>
        )}
      </div>

      {/* Center: Sparkline (hidden on mobile) */}
      <div className="hidden sm:flex items-center justify-center flex-shrink-0 mx-4">
        <MiniSparkline data={sparklineData ?? []} width={64} height={24} />
      </div>

      {/* Right: Value pill */}
      <div className="flex-shrink-0">
        <ValuePill position={position} sortMode={sortMode} />
      </div>
    </Link>
  );
}
