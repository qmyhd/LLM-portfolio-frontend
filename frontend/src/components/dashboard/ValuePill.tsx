'use client';

import type { Position } from '@/types/api';
import { formatMoney, formatPercent, formatSignedMoney } from '@/lib/format';
import { MetricPill } from '@/components/ui/MetricPill';

export type HoldingSortMode =
  | 'symbol'
  | 'lastPrice'
  | 'percentChange'
  | 'equity'
  | 'todaysReturn'
  | 'totalReturn'
  | 'totalReturnPercent';

interface ValuePillProps {
  position: Position;
  sortMode: HoldingSortMode;
}

function getPillValue(position: Position, sortMode: HoldingSortMode): { text: string; numeric: number } {
  switch (sortMode) {
    case 'symbol':
    case 'equity':
      return { text: formatMoney(position.equity), numeric: position.equity };
    case 'lastPrice':
      return { text: formatMoney(position.currentPrice), numeric: position.currentPrice };
    case 'percentChange':
      return {
        text: formatPercent(position.openPnlPercent, 2, { showSign: true }),
        numeric: position.openPnlPercent,
      };
    case 'todaysReturn':
      return {
        text: formatSignedMoney(position.dayChange),
        numeric: position.dayChange ?? 0,
      };
    case 'totalReturn':
      return {
        text: formatSignedMoney(position.openPnl),
        numeric: position.openPnl,
      };
    case 'totalReturnPercent':
      return {
        text: formatPercent(position.openPnlPercent, 2, { showSign: true }),
        numeric: position.openPnlPercent,
      };
  }
}

export function ValuePill({ position, sortMode }: ValuePillProps) {
  const { text, numeric } = getPillValue(position, sortMode);
  return <MetricPill text={text} numeric={numeric} />;
}
