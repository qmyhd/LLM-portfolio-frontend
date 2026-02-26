/**
 * Safe formatting utilities for numbers, money, and percentages.
 *
 * Every function gracefully handles null | undefined | NaN so callers
 * never need to guard with `?? 0` before formatting.
 */

/** Return a safe number or the provided fallback (default 0). */
function safe(n: number | null | undefined, fallback = 0): number {
  if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return fallback;
  return n;
}

/**
 * Format a number as USD currency string.
 * `formatMoney(1234.5)` → `"$1,234.50"`
 * `formatMoney(null)`   → `"—"`
 */
export function formatMoney(
  n: number | null | undefined,
  opts?: { placeholder?: string },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (n == null || Number.isNaN(n)) return placeholder;
  return `$${safe(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number with fixed decimal places.
 * `formatNumber(3.14159, 2)` → `"3.14"`
 * `formatNumber(null)`       → `"—"`
 */
export function formatNumber(
  n: number | null | undefined,
  decimals = 2,
  opts?: { placeholder?: string },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (n == null || Number.isNaN(n)) return placeholder;
  return safe(n).toFixed(decimals);
}

/**
 * Format a number as a percentage string.
 * `formatPercent(12.345)`  → `"12.35%"`
 * `formatPercent(-3.2, 1)` → `"-3.2%"`
 * `formatPercent(null)`    → `"—"`
 */
export function formatPercent(
  n: number | null | undefined,
  decimals = 2,
  opts?: { placeholder?: string; showSign?: boolean },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (n == null || Number.isNaN(n)) return placeholder;
  const v = safe(n);
  const sign = opts?.showSign && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(decimals)}%`;
}

/**
 * Format a signed money value with +/- prefix.
 * `formatSignedMoney(250.5)` → `"+$250.50"`
 * `formatSignedMoney(-42)`   → `"-$42.00"`
 */
export function formatSignedMoney(
  n: number | null | undefined,
  opts?: { placeholder?: string },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (n == null || Number.isNaN(n)) return placeholder;
  const v = safe(n);
  const sign = v >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a large number with K/M/B suffix.
 * `formatCompact(52_340_000)` → `"52.3M"`
 */
export function formatCompact(
  n: number | null | undefined,
  decimals = 1,
  opts?: { placeholder?: string },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (n == null || Number.isNaN(n)) return placeholder;
  const v = Math.abs(safe(n));
  if (v >= 1_000_000_000) return `${(safe(n) / 1_000_000_000).toFixed(decimals)}B`;
  if (v >= 1_000_000) return `${(safe(n) / 1_000_000).toFixed(decimals)}M`;
  if (v >= 1_000) return `${(safe(n) / 1_000).toFixed(decimals)}K`;
  return safe(n).toFixed(decimals);
}

/**
 * Format a signed percentage with explicit +/- sign.
 * `formatSignedPct(12.5)` → `"+12.50%"`
 * `formatSignedPct(-3.2)` → `"-3.20%"`
 */
export function formatSignedPct(
  n: number | null | undefined,
  decimals = 2,
  opts?: { placeholder?: string },
): string {
  return formatPercent(n, decimals, { ...opts, showSign: true });
}

/**
 * Format an ISO date string to a short human-readable date.
 * `formatDate('2024-03-15T10:30:00Z')`          → `"Mar 15, 2024"`
 * `formatDate('2024-03-15T10:30:00Z', 'short')` → `"Mar 15"`
 * `formatDate('2024-03-15T10:30:00Z', 'relative')` → `"3d ago"`
 */
export function formatDate(
  dateStr: string | null | undefined,
  style: 'full' | 'short' | 'relative' = 'full',
  opts?: { placeholder?: string },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (!dateStr) return placeholder;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return placeholder;

  if (style === 'relative') return formatRelativeTime(dateStr, { placeholder });

  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Human-relative time: "just now", "5m ago", "3h ago", "2d ago",
 * then falls back to a short date.
 */
export function formatRelativeTime(
  dateStr: string | null | undefined,
  opts?: { placeholder?: string },
): string {
  const placeholder = opts?.placeholder ?? '—';
  if (!dateStr) return placeholder;
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return placeholder;
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
