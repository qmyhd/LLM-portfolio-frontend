/**
 * Global live updates state management.
 * 
 * Uses Zustand to manage whether live polling is enabled across the app.
 * State is persisted to localStorage so user preference is remembered.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LiveUpdatesState {
  /** Whether live polling is enabled */
  isEnabled: boolean;
  /** Polling interval in milliseconds */
  interval: number;
  /** Enable live updates */
  enable: () => void;
  /** Disable live updates */
  disable: () => void;
  /** Toggle live updates on/off */
  toggle: () => void;
  /** Set custom polling interval */
  setInterval: (ms: number) => void;
}

/**
 * Global store for live updates toggle.
 * 
 * @example
 * ```tsx
 * // In a component
 * const { isEnabled, toggle } = useLiveUpdates();
 * 
 * return (
 *   <button onClick={toggle}>
 *     Live updates: {isEnabled ? 'ON' : 'OFF'}
 *   </button>
 * );
 * ```
 */
export const useLiveUpdates = create<LiveUpdatesState>()(
  persist(
    (set) => ({
      isEnabled: true, // Default to enabled
      interval: 60000, // 60 seconds default
      
      enable: () => set({ isEnabled: true }),
      disable: () => set({ isEnabled: false }),
      toggle: () => set((state) => ({ isEnabled: !state.isEnabled })),
      setInterval: (ms: number) => set({ interval: Math.max(10000, ms) }), // Min 10s
    }),
    {
      name: 'live-updates', // localStorage key
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        interval: state.interval,
      }),
    }
  )
);
