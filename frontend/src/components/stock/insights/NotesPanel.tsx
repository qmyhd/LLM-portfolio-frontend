'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks/useOpenBB';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface NotesPanelProps {
  ticker: string;
}

function formatNoteDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function NotesPanel({ ticker }: NotesPanelProps) {
  const { data, isLoading, error, mutate } = useNotes(ticker);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/stocks/${ticker.toUpperCase()}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent('');
        mutate();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await fetch(`/api/stocks/${ticker.toUpperCase()}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId }),
      });
      mutate();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add note form */}
      <form onSubmit={handleSubmit} className="p-3 border-b border-border/50">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Add a note about ${ticker}...`}
          className="w-full bg-background-tertiary text-foreground text-sm rounded-lg p-3 border border-border focus:border-primary focus:outline-none resize-none placeholder-foreground-subtle"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!content.trim() || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-foreground-muted text-sm py-4">
            Failed to load notes
          </div>
        )}

        {!isLoading && !error && !data?.notes?.length && (
          <div className="text-center text-foreground-muted text-sm py-4">
            No notes yet. Add your first note above.
          </div>
        )}

        {data?.notes?.map((note) => (
          <div
            key={note.id}
            className="p-3 rounded-lg border border-border/50 group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed flex-1">
                {note.content}
              </p>
              <button
                onClick={() => handleDelete(note.id)}
                className="p-1 rounded hover:bg-loss/20 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="Delete note"
              >
                <TrashIcon className="h-3.5 w-3.5 text-foreground-muted hover:text-loss" />
              </button>
            </div>
            <span className="text-2xs text-foreground-subtle mt-1.5 block">
              {formatNoteDate(note.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
