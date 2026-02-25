'use client';

import { useState, useRef, useCallback } from 'react';
import { TickerAutocomplete } from './TickerAutocomplete';
import { TagsInput } from './TagsInput';
import type { CreateIdeaRequest } from '@/types/ideas';

interface IdeaCaptureFormProps {
  onSubmit: (req: CreateIdeaRequest) => Promise<void>;
}

export function IdeaCaptureForm({ onSubmit }: IdeaCaptureFormProps) {
  const [content, setContent] = useState('');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        content: content.trim(),
        symbols: symbols.length > 0 ? symbols : undefined,
        symbol: symbols[0] || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      // Clear form on success
      setContent('');
      setSymbols([]);
      setTags([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Capture Idea</h2>

      <textarea
        ref={textareaRef}
        className="input min-h-[100px] resize-y text-sm"
        placeholder="What's your trade thesis? Paste notes, type thoughts..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          autoGrow();
        }}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <TickerAutocomplete
          selectedSymbols={symbols}
          onAdd={(s) => setSymbols((prev) => [...prev, s])}
          onRemove={(s) => setSymbols((prev) => prev.filter((t) => t !== s))}
          placeholder="Attach tickers..."
          className="flex-1"
        />
        <TagsInput
          tags={tags}
          onAdd={(t) => setTags((prev) => [...prev, t])}
          onRemove={(t) => setTags((prev) => prev.filter((x) => x !== t))}
          placeholder="Add tags..."
          className="flex-1"
        />
      </div>

      <div className="flex justify-end">
        <button
          className="btn-primary"
          disabled={!content.trim() || saving}
          onClick={handleSubmit}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
      </div>
    </div>
  );
}
