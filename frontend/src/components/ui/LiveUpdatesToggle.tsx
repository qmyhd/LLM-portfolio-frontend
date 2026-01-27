'use client';

/**
 * Live Updates Toggle Component
 * 
 * A toggle button that allows users to enable/disable live polling.
 * Shows current status and can be placed in the TopBar or settings.
 */

import { useLiveUpdates } from '@/hooks/useLiveUpdates';

interface LiveUpdatesToggleProps {
  /** Show label text */
  showLabel?: boolean;
  /** Compact mode (icon only) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function LiveUpdatesToggle({ 
  showLabel = true, 
  compact = false,
  className = '' 
}: LiveUpdatesToggleProps) {
  const { isEnabled, toggle } = useLiveUpdates();
  
  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`p-2 rounded-lg transition-colors ${
          isEnabled 
            ? 'bg-profit/20 text-profit hover:bg-profit/30' 
            : 'bg-gray-700 text-text-muted hover:bg-gray-600'
        } ${className}`}
        title={`Live updates: ${isEnabled ? 'ON' : 'OFF'}`}
        aria-label={`Toggle live updates (currently ${isEnabled ? 'on' : 'off'})`}
      >
        {/* Pulse icon when enabled */}
        <svg 
          className={`w-5 h-5 ${isEnabled ? 'animate-pulse' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="10" r="3" />
          {isEnabled && (
            <>
              <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </>
          )}
        </svg>
      </button>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm text-text-muted">Live updates</span>
      )}
      
      {/* Toggle switch */}
      <button
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary ${
          isEnabled ? 'bg-profit' : 'bg-gray-600'
        }`}
        role="switch"
        aria-checked={isEnabled}
        aria-label="Toggle live updates"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      
      {/* Status indicator */}
      <span className={`text-xs font-medium ${
        isEnabled ? 'text-profit' : 'text-text-muted'
      }`}>
        {isEnabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
