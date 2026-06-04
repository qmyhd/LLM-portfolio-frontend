'use client';

import { useState } from 'react';
import { useCredibilityCategories } from '@/hooks/useCredibility';
import type { Quote, QuoteBodyInput } from '@/types/research';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const FIELD = 'w-full bg-background-secondary border border-border rounded-md px-2 py-1 text-sm';

interface QuoteCardProps {
  quote: Quote;
  onChanged: () => void;
}

export function QuoteCard({ quote, onChanged }: QuoteCardProps) {
  const { categories } = useCredibilityCategories();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(quote.categorySlug ?? '');
  const [ticker, setTicker] = useState(quote.ticker ?? '');
  const [thesisNote, setThesisNote] = useState(quote.thesisNote ?? '');
  const [tagsText, setTagsText] = useState((quote.tags || []).join(', '));
  const [notes, setNotes] = useState(quote.notes ?? '');

  const deepLink = `https://www.youtube.com/watch?v=${quote.videoId}&t=${Math.floor(quote.startSeconds)}s`;

  const saveEdit = async () => {
    setBusy(true);
    setError(null);
    const body: QuoteBodyInput = {
      videoId: quote.videoId,
      videoUrl: quote.videoUrl,
      videoTitle: quote.videoTitle,
      channelName: quote.channelName,
      channelUrl: quote.channelUrl,
      quoteText: quote.quoteText,
      startSeconds: quote.startSeconds,
      endSeconds: quote.endSeconds,
      personId: quote.personId,
      categorySlug: category || null,
      ticker: ticker.trim() || null,
      stockThesisProfileId: quote.stockThesisProfileId,
      thesisNote: thesisNote.trim() || null,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || null,
    };
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Save failed (${res.status})`);
      }
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Archive failed (${res.status})`);
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Archive failed');
      setBusy(false);
    }
  };

  return (
    <div className="card p-4 space-y-2">
      <p className="text-sm text-foreground">{quote.quoteText}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {quote.personName && <span className="text-foreground-muted">{quote.personName}</span>}
        {quote.categoryLabel && (
          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{quote.categoryLabel}</span>
        )}
        {quote.ticker && (
          <span className="font-mono px-1.5 py-0.5 rounded bg-background-hover">{quote.ticker}</span>
        )}
        {(quote.tags || []).map((t) => (
          <span key={t} className="px-1.5 py-0.5 rounded bg-background-hover text-foreground-muted">{t}</span>
        ))}
      </div>
      {quote.thesisNote && <p className="text-xs text-foreground-muted italic">{quote.thesisNote}</p>}
      {quote.notes && <p className="text-xs text-foreground-subtle">{quote.notes}</p>}
      <div className="flex items-center justify-between text-xs text-foreground-subtle gap-2">
        <a href={deepLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
          {quote.videoTitle || quote.videoId} · {fmt(quote.startSeconds)}
        </a>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => setEditing((v) => !v)} className="hover:text-foreground">Edit</button>
          <button type="button" onClick={archive} disabled={busy} className="hover:text-loss disabled:opacity-50">Archive</button>
        </div>
      </div>
      {editing && (
        <div className="space-y-2 pt-2 border-t border-border">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
            <option value="">(no bucket)</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="ticker" className={FIELD} />
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="tags, comma-separated" className={FIELD} />
          <textarea value={thesisNote} onChange={(e) => setThesisNote(e.target.value)} placeholder="thesis note" rows={2} className={FIELD} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="notes" rows={2} className={FIELD} />
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} disabled={busy} className="btn-primary text-xs disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}
