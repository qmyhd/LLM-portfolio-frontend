'use client';

import { clsx } from 'clsx';

function formatAsOf(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Subtle freshness indicator: a pulsing dot + "Updating…" while data is being
 * revalidated, or a static dot + "as of HH:MM" when idle. Used wherever a view
 * may show stale (previously-loaded / persisted) data while SWR refreshes, so
 * the shown data is never mistaken for fully live.
 */
export function RefreshingIndicator({
  updating,
  asOf,
  className,
}: {
  updating: boolean;
  asOf?: string | null;
  className?: string;
}) {
  const time = formatAsOf(asOf);
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs text-foreground-muted', className)}>
      <span
        className={clsx(
          'inline-block w-1.5 h-1.5 rounded-full',
          updating ? 'bg-primary animate-pulse' : 'bg-foreground-subtle',
        )}
        aria-hidden
      />
      {updating ? 'Updating…' : time ? `as of ${time}` : null}
    </span>
  );
}
