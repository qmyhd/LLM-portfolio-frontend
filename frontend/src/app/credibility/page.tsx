'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { usePeople, useCredibilityCategories, useUnmatchedIdentities } from '@/hooks/useCredibility';
import { Skeleton } from '@/components/ui/Skeleton';
import { TierBoard } from '@/components/credibility/TierBoard';
import { PersonDetailView } from '@/components/credibility/PersonDetailView';
import { PersonProfileEditor } from '@/components/credibility/PersonProfileEditor';
import { ReviewQueue } from '@/components/credibility/ReviewQueue';
import { usePrivacy } from '@/hooks/usePrivacy';
import type { PersonDetail } from '@/types/credibility';

// `editor` describes the right-hand panel mode: closed (read-only detail),
// creating a new person, or editing an existing one.
type EditorMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; id: number };

export default function CredibilityWorkspacePage() {
  const { canWrite } = usePrivacy();
  const { people, error: peopleError, isLoading: peopleLoading, refresh: refreshPeople } = usePeople();
  const { categories, isLoading: catsLoading } = useCredibilityCategories();
  const { unmatched } = useUnmatchedIdentities();

  const [category, setCategory] = useState<string>('');
  const [showQueue, setShowQueue] = useState(false);
  const [details, setDetails] = useState<PersonDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editor, setEditor] = useState<EditorMode>({ kind: 'closed' });

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
  }, [people, reloadKey]);

  const attentionIds = useMemo(
    () => new Set(people.filter((p) => p.needsAttention).map((p) => p.id)),
    [people],
  );

  const isLoading = peopleLoading || catsLoading;

  // After a create/edit save: close the editor, refresh the people list, and
  // bump reloadKey so the per-person detail fetch re-runs.
  const handleSaved = () => {
    setEditor({ kind: 'closed' });
    refreshPeople();
    setReloadKey((k) => k + 1);
  };

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
                {canWrite && (
                <button
                  type="button"
                  onClick={() => setShowQueue((s) => !s)}
                  className="btn-ghost text-sm"
                >
                  Review queue ({unmatched.length})
                </button>
                )}
                {canWrite && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setEditor({ kind: 'create' });
                  }}
                  className="btn-primary"
                >
                  Add person
                </button>
                )}
              </div>
            </div>

            {peopleError && (
              <p className="text-sm text-loss">{peopleError.message}</p>
            )}

            {showQueue && (
              <ReviewQueue
                people={people}
                onLinked={() => {
                  refreshPeople();
                  setReloadKey((k) => k + 1);
                }}
              />
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
                    onSelect={(id) => {
                      setEditor({ kind: 'closed' });
                      setSelectedId(id);
                    }}
                  />
                )}
              </div>

              {/* Detail / editor panel */}
              <div className="card overflow-hidden">
                {editor.kind === 'closed' ? (
                  <PersonDetailView
                    personId={selectedId}
                    onEdit={
                      canWrite && selectedId != null
                        ? () => setEditor({ kind: 'edit', id: selectedId })
                        : undefined
                    }
                    onClose={() => setSelectedId(null)}
                  />
                ) : (
                  <PersonProfileEditor
                    personId={editor.kind === 'edit' ? editor.id : null}
                    onSaved={handleSaved}
                    onCancel={() => setEditor({ kind: 'closed' })}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
