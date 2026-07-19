'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks';
import { formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReadOnlyNotice } from '@/components/ui/ReadOnlyNotice';
import { usePrivacy } from '@/hooks/usePrivacy';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface NotesPanelProps {
  ticker: string;
}

export function NotesPanel({ ticker }: NotesPanelProps) {
  const { data, error, isLoading, mutate } = useNotes(ticker);
  const { canWrite } = usePrivacy();
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const content = newNote.trim();
    if (!content) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/stocks/${ticker.toUpperCase()}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setNewNote('');
        mutate();
      }
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
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton.Card />
        <Skeleton.Card />
      </div>
    );
  }

  const notes = data?.notes ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <p className="text-sm text-loss">Failed to load notes</p>
        )}
        {notes.length === 0 && !error && (
          <EmptyState icon={PencilSquareIcon} title="No notes yet" description="Add a note to track your thoughts" />
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="card p-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground whitespace-pre-wrap break-words flex-1">
                {note.content}
              </p>
              <button
                onClick={() => handleDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-foreground-muted hover:text-loss transition-all flex-shrink-0"
                title="Delete note"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-foreground-muted mt-2">
              {formatDate(note.createdAt, 'relative')}
            </p>
          </div>
        ))}
      </div>

      {/* New note input — owners/editors only */}
      <div className="border-t border-border p-3">
        {canWrite ? (
          <>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSave();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-foreground-muted">Ctrl+Enter to save</span>
              <button
                onClick={handleSave}
                disabled={!newNote.trim() || saving}
                className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <ReadOnlyNotice hint="Notes are visible to you but only editors can add them." />
        )}
      </div>
    </div>
  );
}
