/**
 * Centralized color decision functions and categorical color maps.
 *
 * Every component should use these instead of inline ternaries like
 * `value >= 0 ? 'text-profit' : 'text-loss'`.
 */

// ---------------------------------------------------------------------------
// P/L color functions
// ---------------------------------------------------------------------------

/** Profit/loss text color: green for positive, red for negative, muted for zero/null. */
export function pnlTextColor(value: number | null | undefined): string {
  if (value == null || value === 0) return 'text-foreground-muted';
  return value > 0 ? 'text-profit' : 'text-loss';
}

/** Profit/loss background tint for pills. */
export function pnlBgColor(value: number | null | undefined): string {
  if (value == null || value === 0) return 'bg-background-tertiary';
  return value > 0 ? 'bg-profit/10' : 'bg-loss/10';
}

/** Combined text + bg classes for a P/L pill. */
export function pnlPillClasses(value: number | null | undefined): string {
  return `${pnlTextColor(value)} ${pnlBgColor(value)}`;
}

/** Direction as a simple enum. */
export function trendDirection(
  value: number | null | undefined,
): 'up' | 'down' | 'neutral' {
  if (value == null || value === 0) return 'neutral';
  return value > 0 ? 'up' : 'down';
}

// ---------------------------------------------------------------------------
// Semantic color functions
// ---------------------------------------------------------------------------

/** Sentiment direction color (bullish / bearish / neutral). */
export function directionTextColor(
  direction: 'bullish' | 'bearish' | 'neutral' | string,
): string {
  switch (direction) {
    case 'bullish':
      return 'text-profit';
    case 'bearish':
      return 'text-loss';
    case 'neutral':
      return 'text-status-warning';
    default:
      return 'text-foreground-muted';
  }
}

/** Risk level color (low = green, medium = yellow, high = red). */
export function riskLevelColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return 'text-profit';
    case 'medium':
      return 'text-status-warning';
    case 'high':
      return 'text-loss';
  }
}

// ---------------------------------------------------------------------------
// Semantic constants
// ---------------------------------------------------------------------------

/** Favorite / watchlist star color. */
export const FAVORITE_COLOR = 'text-status-warning';

// ---------------------------------------------------------------------------
// Categorical color maps
// ---------------------------------------------------------------------------

/** Recon panel price-source badges. */
export const RECON_SOURCE_COLORS: Record<string, string> = {
  databento: 'bg-profit/20 text-profit border-profit/30',
  snaptrade: 'bg-status-warning/20 text-status-warning border-status-warning/30',
  yfinance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  avgcost: 'bg-loss/20 text-loss border-loss/30',
  _default: 'bg-foreground-muted/20 text-foreground-muted border-foreground-muted/30',
};

/** Idea card status badges. */
export const IDEA_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-status-warning/20 text-status-warning',
  refined: 'bg-profit/20 text-profit',
  archived: 'bg-background-hover text-foreground-subtle',
  _default: 'bg-background-tertiary text-foreground-muted',
};

/** Idea card source badges. */
export const IDEA_SOURCE_COLORS: Record<string, string> = {
  discord: 'bg-primary/20 text-primary',
  manual: 'bg-primary/20 text-primary',
  transcribe: 'bg-purple-500/20 text-purple-400',
  _default: 'bg-background-tertiary text-foreground-muted',
};

/** SEC filing form-type badges. */
export const FILING_FORM_COLORS: Record<string, string> = {
  '10-K': 'bg-primary/20 text-primary',
  '10-Q': 'bg-purple-500/20 text-purple-400',
  '8-K': 'bg-status-warning/20 text-status-warning',
  '4': 'bg-cyan-500/20 text-cyan-400',
  _default: 'bg-background-hover text-foreground-muted',
};
