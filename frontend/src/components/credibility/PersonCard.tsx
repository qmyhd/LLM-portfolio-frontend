'use client';

import { clsx } from 'clsx';
import type { PersonDetail } from '@/types/credibility';

interface PersonCardProps {
  detail: PersonDetail;
  category: string;
  needsAttention?: boolean;
  selected?: boolean;
  onSelect: (id: number) => void;
}

export function PersonCard({ detail, category, needsAttention, selected, onSelect }: PersonCardProps) {
  const tier = detail.tiers.find((t) => t.categorySlug === category);
  const muted = tier?.muted ?? false;

  return (
    <button
      type="button"
      onClick={() => onSelect(detail.id)}
      className={clsx(
        'w-full text-left px-3 py-2 rounded-md border transition-colors',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-background-secondary hover:bg-background-hover',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">{detail.fullName}</span>
        {needsAttention && (
          <span
            className="h-2 w-2 rounded-full bg-status-warning shrink-0"
            title="Needs attention"
          />
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        {detail.role && (
          <span className="text-xs text-foreground-muted truncate">{detail.role}</span>
        )}
        {muted && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary text-foreground-muted">
            muted
          </span>
        )}
      </div>
    </button>
  );
}
