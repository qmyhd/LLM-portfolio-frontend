'use client';

import { useState, useEffect, useRef } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { IdeasFilters } from '@/types/ideas';

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
      <select
        className="input w-32 text-sm"
        value={filters.source || ''}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            source: (e.target.value as IdeasFilters['source']) || undefined,
            offset: 0,
          })
        }
      >
        <option value="">All Sources</option>
        <option value="discord">Discord</option>
        <option value="manual">Manual</option>
        <option value="transcribe">Transcribe</option>
      </select>

      {/* Status filter */}
      <select
        className="input w-32 text-sm"
        value={filters.status || ''}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            status: (e.target.value as IdeasFilters['status']) || undefined,
            offset: 0,
          })
        }
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="refined">Refined</option>
        <option value="archived">Archived</option>
      </select>

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
