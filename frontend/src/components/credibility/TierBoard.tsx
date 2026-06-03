'use client';

import { clsx } from 'clsx';
import type { PersonDetail } from '@/types/credibility';
import { PersonCard } from './PersonCard';

interface TierBoardProps {
  details: PersonDetail[];
  category: string;
  attentionIds?: Set<number>;
  selectedId?: number | null;
  onSelect: (id: number) => void;
}

const TIER_ROWS = ['S', 'A', 'B', 'C', 'D'] as const;

const TIER_COLORS: Record<string, string> = {
  S: 'text-profit',
  A: 'text-primary',
  B: 'text-foreground',
  C: 'text-status-warning',
  D: 'text-loss',
  Unrated: 'text-foreground-muted',
};

export function TierBoard({ details, category, attentionIds, selectedId, onSelect }: TierBoardProps) {
  const tierOf = (d: PersonDetail): string => {
    const t = d.tiers.find((x) => x.categorySlug === category)?.tier;
    return t && TIER_ROWS.includes(t as (typeof TIER_ROWS)[number]) ? t : 'Unrated';
  };

  const rows: { label: string; people: PersonDetail[] }[] = [...TIER_ROWS, 'Unrated'].map((label) => ({
    label,
    people: details.filter((d) => tierOf(d) === label),
  }));

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="card p-3 flex gap-3">
          <div
            className={clsx(
              'w-12 shrink-0 text-lg font-bold flex items-start justify-center pt-1',
              TIER_COLORS[row.label] ?? 'text-foreground',
            )}
          >
            {row.label === 'Unrated' ? '—' : row.label}
          </div>
          <div className="flex-1 min-w-0">
            {row.people.length === 0 ? (
              <p className="text-xs text-foreground-subtle py-1">
                {row.label === 'Unrated' ? 'No unrated people' : 'Empty'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {row.people.map((d) => (
                  <PersonCard
                    key={d.id}
                    detail={d}
                    category={category}
                    needsAttention={attentionIds?.has(d.id)}
                    selected={selectedId === d.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
