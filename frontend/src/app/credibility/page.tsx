'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { usePeople, useCredibilityCategories } from '@/hooks/useCredibility';
import { Skeleton } from '@/components/ui/Skeleton';
import { TierBoard } from '@/components/credibility/TierBoard';
import { PersonDetailView } from '@/components/credibility/PersonDetailView';
import type { PersonDetail } from '@/types/credibility';

export default function CredibilityWorkspacePage() {
  const { people, error: peopleError, isLoading: peopleLoading } = usePeople();
  const { categories, isLoading: catsLoading } = useCredibilityCategories();

  const [category, setCategory] = useState<string>('');
  const [details, setDetails] = useState<PersonDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Default the category to the first one once categories load.
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].slug);
    }
  }, [categories, category]);

  // Fetch each person's detail in parallel so the board knows per-category tiers.
  useEffect(() => {
    let cancelled = false;
    if (people.length === 0) {
      setDetails([]);
      return;
    }
    setDetailsLoading(true);
    Promise.all(
      people.map((p) =>
        fetch(`/api/people/${p.id}`)
          .then((r) => (r.ok ? (r.json() as Promise<PersonDetail>) : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setDetails(results.filter((d): d is PersonDetail => d != null));
      setDetailsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [people]);

  const attentionIds = useMemo(
    () => new Set(people.filter((p) => p.needsAttention).map((p) => p.id)),
    [people],
  );

  const isLoading = peopleLoading || catsLoading;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Credibility</h1>
                <p className="text-foreground-muted">
                  Source tiering by category — rank the people behind your signal.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={categories.length === 0}
                  className="bg-background-secondary border border-border rounded-md px-3 py-2 text-sm"
                >
                  {categories.length === 0 && <option value="">No categories</option>}
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled
                  title="(coming in editor)"
                  className="btn-primary opacity-50 cursor-not-allowed"
                >
                  Add person
                </button>
              </div>
            </div>

            {peopleError && (
              <p className="text-sm text-loss">{peopleError.message}</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tier board */}
              <div className="lg:col-span-2 space-y-2">
                {isLoading || detailsLoading ? (
                  <div className="space-y-2">
                    <Skeleton.Card />
                    <Skeleton.Card />
                  </div>
                ) : people.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-sm font-medium text-foreground-muted">No people yet.</p>
                    <p className="text-xs text-foreground-subtle mt-1">
                      Add someone to start tiering.
                    </p>
                  </div>
                ) : (
                  <TierBoard
                    details={details}
                    category={category}
                    attentionIds={attentionIds}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                )}
              </div>

              {/* Detail panel */}
              <div className="card overflow-hidden">
                <PersonDetailView
                  personId={selectedId}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
