'use client';

import { LockClosedIcon } from '@heroicons/react/24/outline';

/**
 * Consistent inline "read-only" affordance shown to viewers in place of a
 * write control (capture form, chat box, curate button, etc.). Keeps the
 * viewer experience clean instead of surfacing buttons that 403 server-side.
 */
export function ReadOnlyNotice({
  label = 'Read-only access',
  hint = 'Ask the owner for editor access to contribute.',
  className = '',
}: {
  label?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-dashed border-border bg-background-secondary/40 px-3 py-2.5 text-xs text-foreground-muted ${className}`}
    >
      <LockClosedIcon className="h-4 w-4 flex-shrink-0 text-foreground-subtle" />
      <span>
        <span className="font-medium text-foreground-muted">{label}</span>
        {hint ? <span className="text-foreground-subtle"> — {hint}</span> : null}
      </span>
    </div>
  );
}
