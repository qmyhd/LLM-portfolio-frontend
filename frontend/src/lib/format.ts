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
