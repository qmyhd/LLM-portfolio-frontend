'use client';

import { useState } from 'react';
import { usePeople, useCredibilityCategories } from '@/hooks/useCredibility';
import type { QuoteBodyInput, ResolvedVideo } from '@/types/research';

export interface QuoteDraft {
  quoteText: string;
  startSeconds: number;
  endSeconds: number | null;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CaptureDrawerProps {
  video: ResolvedVideo;
  draft: QuoteDraft;
  onClose: () => void;
  onSaved: () => void;
}

const LABEL = 'block text-xs font-medium text-foreground-muted mb-1';
const FIELD = 'w-full bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm';

export function CaptureDrawer({ video, draft, onClose, onSaved }: CaptureDrawerProps) {
  const { people } = usePeople();
  const { categories } = useCredibilityCategories();

  const [quoteText, setQuoteText] = useState(draft.quoteText);
  const [personId, setPersonId] = useState(
    video.suggestedPersonId != null ? String(video.suggestedPersonId) : '',
  );
  const [categorySlug, setCategorySlug] = useState('');
  const [ticker, setTicker] = useState('');
  const [thesisNote, setThesisNote] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = Boolean(quoteText.trim()) && Boolean(video.videoId) && Boolean(video.url);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const body: QuoteBodyInput = {
      videoId: video.videoId,
      videoUrl: video.url,
      videoTitle: video.title,
      channelName: video.channelName,
      channelUrl: video.channelUrl,
      quoteText: quoteText.trim(),
      startSeconds: draft.startSeconds,
      endSeconds: draft.endSeconds,
      personId: personId ? Number(personId) : null,
      categorySlug: categorySlug || null,
      ticker: ticker.trim() || null,
      thesisNote: thesisNote.trim() || null,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || null,
    };
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Save failed (${res.status})`);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md h-full bg-background border-l border-border overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Save quote</h2>
          <button type="button" onClick={onClose} className="text-foreground-muted hover:text-foreground">
            Close
          </button>
        </div>
        <p className="text-xs text-foreground-subtle">
          {fmt(draft.startSeconds)}
          {draft.endSeconds != null ? ` – ${fmt(draft.endSeconds)}` : ''} ·{' '}
          {video.title || video.videoId}
        </p>

        <div>
          <label className={LABEL}>Quote</label>
          <textarea value={quoteText} onChange={(e) => setQuoteText(e.target.value)} rows={4} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Speaker</label>
          <select value={personId} onChange={(e) => setPersonId(e.target.value)} className={FIELD}>
            <option value="">(none)</option>
            {people.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Bucket</label>
          <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className={FIELD}>
            <option value="">(none)</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Ticker</label>
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} className={FIELD} placeholder="optional" />
        </div>
        <div>
          <label className={LABEL}>Thesis note</label>
          <textarea value={thesisNote} onChange={(e) => setThesisNote(e.target.value)} rows={2} className={FIELD} placeholder="optional" />
        </div>
        <div>
          <label className={LABEL}>Tags (comma-separated)</label>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={FIELD} placeholder="macro, prediction" />
        </div>
        <div>
          <label className={LABEL}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={FIELD} placeholder="optional" />
        </div>

        {error && <p className="text-sm text-loss">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={save} disabled={!canSave || saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save quote'}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
}
