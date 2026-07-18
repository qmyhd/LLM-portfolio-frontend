'use client';

import { clsx } from 'clsx';
import type { AttributionKind, IdeaSource, ReviewStatus } from '@/types/ideas';

const SOURCE_STYLES: Record<string, { label: string; className: string }> = {
  imessage: { label: 'iMessage', className: 'bg-emerald-500/10 text-emerald-400' },
  twitter: { label: 'X', className: 'bg-sky-500/10 text-sky-400' },
  x: { label: 'X', className: 'bg-sky-500/10 text-sky-400' },
  discord: { label: 'Discord', className: 'bg-indigo-500/10 text-indigo-400' },
  manual: { label: 'Manual', className: 'bg-primary/10 text-primary' },
  transcribe: { label: 'Voice', className: 'bg-amber-500/10 text-amber-400' },
};

export function SourceBadge({ source }: { source: IdeaSource | string }) {
  const style = SOURCE_STYLES[source] ?? {
    label: source,
    className: 'bg-foreground-muted/10 text-foreground-muted',
  };
  return (
    <span className={clsx('px-1.5 py-0.5 rounded text-2xs font-medium', style.className)}>
      {style.label}
    </span>
  );
}

const REVIEW_STYLES: Record<ReviewStatus, { label: string; className: string }> = {
  unreviewed: { label: 'Unreviewed', className: 'bg-foreground-muted/10 text-foreground-muted' },
  needs_review: { label: 'Needs review', className: 'bg-status-warning/10 text-status-warning' },
  reviewed: { label: 'Reviewed', className: 'bg-gain/10 text-gain' },
};

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const style = REVIEW_STYLES[status] ?? REVIEW_STYLES.unreviewed;
  return (
    <span className={clsx('px-1.5 py-0.5 rounded text-2xs font-medium', style.className)}>
      {style.label}
    </span>
  );
}

export const ATTRIBUTION_LABELS: Record<AttributionKind, string> = {
  self: 'My own take',
  external_person: 'External person',
  institution: 'Institution / fund',
  unknown: 'Unknown',
};

export function AttributionBadge({ kind }: { kind: AttributionKind }) {
  if (kind === 'self') return null; // the default isn't worth a badge
  return (
    <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-purple-500/10 text-purple-400">
      {ATTRIBUTION_LABELS[kind] ?? kind}
    </span>
  );
}
