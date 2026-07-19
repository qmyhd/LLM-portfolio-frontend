'use client';

import { useState, useEffect } from 'react';
import { useTopicTags, useCredibilityCategories } from '@/hooks/useCredibility';
import { usePrivacy } from '@/hooks/usePrivacy';
import type { TopicTag } from '@/types/credibility';

interface StockTopicTagsEditorProps {
  ticker: string;
}

export function StockTopicTagsEditor({ ticker }: StockTopicTagsEditorProps) {
  const { canWrite } = usePrivacy();
  const { tags, refresh } = useTopicTags(ticker);
  const { categories } = useCredibilityCategories();

  const [rows, setRows] = useState<TopicTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Seed local editable state from the hook's tags.
  useEffect(() => {
    setRows(tags.map((t) => ({ ...t })));
  }, [tags]);

  const defaultCategory = categories[0]?.slug ?? '';

  const updateRow = (idx: number, patch: Partial<TopicTag>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((rs) => [...rs, { categorySlug: defaultCategory, weight: 1 }]);
  };

  const removeRow = (idx: number) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setErr(null);
    if (rows.some((r) => r.weight < 0)) {
      setErr('Weights must be greater than or equal to 0.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/stocks/${ticker}/topic-tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: rows }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectCls =
    'bg-background-secondary border border-border rounded-md px-2 py-1 text-sm';

  // Topic tags are an internal credibility-routing control — hidden from viewers.
  if (!canWrite) return null;

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-foreground-muted">Topic tags</p>
        <button onClick={addRow} className="text-xs text-primary hover:underline">
          + Add tag
        </button>
      </div>

      {err && <p className="text-sm text-loss">{err}</p>}

      {rows.length === 0 ? (
        <p className="text-xs text-foreground-subtle">
          No topic tags — add categories to route source credibility for this stock.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={r.categorySlug}
                onChange={(e) => updateRow(i, { categorySlug: e.target.value })}
                className={selectCls}
              >
                {categories.length === 0 && (
                  <option value={r.categorySlug}>{r.categorySlug}</option>
                )}
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={0.1}
                value={r.weight}
                onChange={(e) => updateRow(i, { weight: Number(e.target.value) })}
                className="w-20 bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
              />
              <button
                onClick={() => removeRow(i)}
                className="text-xs text-loss hover:underline"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary w-full text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
