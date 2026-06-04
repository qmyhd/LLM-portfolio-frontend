'use client';

import { useState } from 'react';
import { useQuotes } from '@/hooks/useResearch';
import { usePeople, useCredibilityCategories } from '@/hooks/useCredibility';
import { Skeleton } from '@/components/ui/Skeleton';
import { QuoteCard } from '@/components/research/QuoteCard';
import type { QuoteFilters } from '@/types/research';

const FIELD = 'bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm';

export function QuoteLibrary() {
  const { people } = usePeople();
  const { categories } = useCredibilityCategories();
  const [q, setQ] = useState('');
  const [personId, setPersonId] = useState('');
  const [category, setCategory] = useState('');
  const [ticker, setTicker] = useState('');
  const [status, setStatus] = useState('active');

  const filters: QuoteFilters = { status };
  if (q.trim()) filters.q = q.trim();
  if (personId) filters.person_id = Number(personId);
  if (category) filters.category = category;
  if (ticker.trim()) filters.ticker = ticker.trim();

  const { quotes, isLoading, refresh } = useQuotes(filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text…" className={FIELD} />
        <select value={personId} onChange={(e) => setPersonId(e.target.value)} className={FIELD}>
          <option value="">All speakers</option>
          {people.map((p) => <option key={p.id} value={String(p.id)}>{p.fullName}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
          <option value="">All buckets</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="Ticker" className={FIELD} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton.Card />
          <Skeleton.Card />
        </div>
      ) : quotes.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground-muted">No saved quotes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quotes.map((qt) => <QuoteCard key={qt.id} quote={qt} onChanged={refresh} />)}
        </div>
      )}
    </div>
  );
}
