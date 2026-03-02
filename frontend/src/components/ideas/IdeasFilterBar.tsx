'use client';

import { useState, useEffect, useRef } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { IdeasFilters } from '@/types/ideas';
import { Select } from '@/components/ui/Select';

interface IdeasFilterBarProps {
  filters: IdeasFilters;
  onFiltersChange: (filters: IdeasFilters) => void;
}

export function IdeasFilterBar({ filters, onFiltersChange }: IdeasFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, q: searchInput || undefined, offset: 0 });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasActiveFilters =
    filters.symbol || filters.tag || filters.source || filters.status || filters.q;

  const clearAll = () => {
    setSearchInput('');
    onFiltersChange({ limit: filters.limit, offset: 0 });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FunnelIcon className="h-4 w-4 text-foreground-muted flex-shrink-0" />

      {/* Symbol filter */}
      <input
        type="text"
        className="input w-28 text-sm"
        placeholder="Symbol"
        value={filters.symbol || ''}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            symbol: e.target.value.toUpperCase() || undefined,
            offset: 0,
          })
        }
      />

      {/* Source filter */}
      <Select
        value={filters.source || ''}
        onChange={(v) => onFiltersChange({ ...filters, source: (v as IdeasFilters['source']) || undefined, offset: 0 })}
        options={[
          { value: '', label: 'All Sources' },
          { value: 'discord', label: 'Discord' },
          { value: 'manual', label: 'Manual' },
          { value: 'transcribe', label: 'Transcribe' },
        ]}
        size="sm"
        className="w-32"
      />

      {/* Status filter */}
      <Select
        value={filters.status || ''}
        onChange={(v) => onFiltersChange({ ...filters, status: (v as IdeasFilters['status']) || undefined, offset: 0 })}
        options={[
          { value: '', label: 'All Statuses' },
          { value: 'draft', label: 'Draft' },
          { value: 'refined', label: 'Refined' },
          { value: 'archived', label: 'Archived' },
        ]}
        size="sm"
        className="w-32"
      />

      {/* Content search */}
      <input
        type="text"
        className="input flex-1 min-w-[140px] text-sm"
        placeholder="Search content..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="btn-ghost text-xs gap-1"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
