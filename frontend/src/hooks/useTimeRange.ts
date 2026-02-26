/**
 * Shared time-range state for portfolio header and charts.
 *
 * Uses Zustand so the selected range persists across components.
 */

import { create } from 'zustand';

export type TimeRange = '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

interface TimeRangeState {
  range: TimeRange;
  setRange: (r: TimeRange) => void;
}

export const useTimeRange = create<TimeRangeState>((set) => ({
  range: '1M',
  setRange: (range) => set({ range }),
}));
