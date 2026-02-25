'use client';

import { useState, useEffect, useCallback } from 'react';
import { IdeaCaptureForm } from './IdeaCaptureForm';
import { IdeasFilterBar } from './IdeasFilterBar';
import { IdeaCard } from './IdeaCard';
import { IdeaDetailDrawer } from './IdeaDetailDrawer';
import { CarRideMode } from './CarRideMode';
import { useUserIdeas } from '@/hooks/useUserIdeas';
import type {
  UserIdea,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  RefineResponse,
  IdeasFilters,
} from '@/types/ideas';

export function IdeasPageContent() {
  // Car ride mode
  const [isCarRideMode, setIsCarRideMode] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('ideas-car-ride-mode');
    if (stored === 'true') setIsCarRideMode(true);
  }, []);
  const toggleCarRideMode = () => {
    const next = !isCarRideMode;
    setIsCarRideMode(next);
    localStorage.setItem('ideas-car-ride-mode', String(next));
  };

  // Filters and data
  const [filters, setFilters] = useState<IdeasFilters>({ limit: 50, offset: 0 });
  const { data, isLoading, mutate } = useUserIdeas(filters);

  // Detail drawer
  const [selectedIdea, setSelectedIdea] = useState<UserIdea | null>(null);
  const [refineResult, setRefineResult] = useState<RefineResponse | null>(null);

  // --- CRUD handlers ---

  const handleCreate = useCallback(
    async (req: CreateIdeaRequest) => {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create idea');
      }
      await mutate();
    },
    [mutate]
  );

  const handleUpdate = useCallback(
    async (id: string, req: UpdateIdeaRequest) => {
      const res = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update idea');
      }
      await mutate();
    },
    [mutate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete idea');
      }
      setSelectedIdea(null);
      await mutate();
    },
    [mutate]
  );

  const handleRefine = useCallback(async (id: string): Promise<RefineResponse | null> => {
    const res = await fetch(`/api/ideas/${id}/refine`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to refine idea');
    }
    const result: RefineResponse = await res.json();
    setRefineResult(result);
    return result;
  }, []);

  const handleApplyRefine = useCallback(
    async (id: string, refined: RefineResponse) => {
      await handleUpdate(id, {
        content: refined.refinedContent,
        symbols: refined.extractedSymbols,
        tags: refined.suggestedTags,
        status: 'refined',
      });
      setRefineResult(null);
    },
    [handleUpdate]
  );

  // --- Pagination ---

  const handleNextPage = () => {
    if (data?.hasMore) {
      setFilters((prev) => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 50),
      }));
    }
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)),
    }));
  };

  // --- Render ---

  if (isCarRideMode) {
    return (
      <CarRideMode
        onSave={handleCreate}
        onExit={toggleCarRideMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with car ride mode toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ideas</h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-foreground-muted">Car Ride Mode</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isCarRideMode}
              onChange={toggleCarRideMode}
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors ${
                isCarRideMode ? 'bg-primary' : 'bg-background-hover'
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                isCarRideMode ? 'translate-x-5' : ''
              }`}
            />
          </div>
        </label>
      </div>

      {/* Capture form */}
      <IdeaCaptureForm onSubmit={handleCreate} />

      {/* Filter bar */}
      <IdeasFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Ideas list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 w-24 bg-background-hover rounded mb-2" />
              <div className="h-3 w-full bg-background-hover rounded mb-1" />
              <div className="h-3 w-3/4 bg-background-hover rounded" />
            </div>
          ))}
        </div>
      ) : data?.ideas.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-foreground-muted">
            {filters.symbol || filters.tag || filters.source || filters.status || filters.q
              ? 'No ideas match your filters.'
              : 'No ideas yet. Start by capturing one above!'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={setSelectedIdea}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-foreground-muted">
                Showing {(filters.offset || 0) + 1}–
                {Math.min((filters.offset || 0) + (data.ideas.length), data.total)} of{' '}
                {data.total}
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-ghost text-sm"
                  onClick={handlePrevPage}
                  disabled={(filters.offset || 0) === 0}
                >
                  Previous
                </button>
                <button
                  className="btn-ghost text-sm"
                  onClick={handleNextPage}
                  disabled={!data.hasMore}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      <IdeaDetailDrawer
        idea={selectedIdea}
        onClose={() => {
          setSelectedIdea(null);
          setRefineResult(null);
        }}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRefine={handleRefine}
        refineResult={refineResult}
        onApplyRefine={handleApplyRefine}
        onDismissRefine={() => setRefineResult(null)}
      />
    </div>
  );
}
