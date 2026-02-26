'use client';

import { clsx } from 'clsx';
import type { HoldingSortMode } from './ValuePill';

const SORT_OPTIONS: { label: string; value: HoldingSortMode }[] = [
  { label: 'Equity', value: 'equity' },
  { label: 'Symbol', value: 'symbol' },
  { label: 'Price', value: 'lastPrice' },
  { label: '% Change', value: 'percentChange' },
  { label: "Today's", value: 'todaysReturn' },
  { label: 'Total $', value: 'totalReturn' },
  { label: 'Total %', value: 'totalReturnPercent' },
];

interface SortModeSelectorProps {
  value: HoldingSortMode;
  onChange: (mode: HoldingSortMode) => void;
}

export function SortModeSelector({ value, onChange }: SortModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
            value === opt.value
              ? 'bg-primary text-white'
              : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
