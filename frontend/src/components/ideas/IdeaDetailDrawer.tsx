'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/format';
import { TickerAutocomplete } from './TickerAutocomplete';
import { TagsInput } from './TagsInput';
import { RefineDiffPreview } from './RefineDiffPreview';
import type { UserIdea, UpdateIdeaRequest, RefineResponse, IdeaStatus } from '@/types/ideas';

interface IdeaDetailDrawerProps {
  idea: UserIdea | null;
  onClose: () => void;
  onSave: (id: string, req: UpdateIdeaRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefine: (id: string) => Promise<RefineResponse | null>;
  refineResult: RefineResponse | null;
  onApplyRefine: (id: string, refined: RefineResponse) => Promise<void>;
  onDismissRefine: () => void;
}

export function IdeaDetailDrawer({
  idea,
  onClose,
  onSave,
  onDelete,
  onRefine,
  refineResult,
  onApplyRefine,
  onDismissRefine,
}: IdeaDetailDrawerProps) {
  const [editContent, setEditContent] = useState('');
  const [editSymbols, setEditSymbols] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<IdeaStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refining, setRefining] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [applying, setApplying] = useState(false);

  // Reset form when idea changes
  useEffect(() => {
    if (idea) {
      setEditContent(idea.content);
      setEditSymbols([...idea.symbols]);
      setEditTags([...idea.tags]);
      setEditStatus(idea.status);
      setShowDeleteConfirm(false);
    }
  }, [idea]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && idea) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [idea, onClose]);

  const handleSave = useCallback(async () => {
    if (!idea || saving) return;
    setSaving(true);
    try {
      const updates: UpdateIdeaRequest = {};
      if (editContent !== idea.content) updates.content = editContent;
      if (JSON.stringify(editSymbols) !== JSON.stringify(idea.symbols))
        updates.symbols = editSymbols;
      if (JSON.stringify(editTags) !== JSON.stringify(idea.tags)) updates.tags = editTags;
      if (editStatus !== idea.status) updates.status = editStatus;
      // Also set primary symbol
      if (editSymbols[0] !== idea.symbol) updates.symbol = editSymbols[0] || '';

      if (Object.keys(updates).length > 0) {
        await onSave(idea.id, updates);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [idea, editContent, editSymbols, editTags, editStatus, saving, onSave, onClose]);

  const handleDelete = useCallback(async () => {
    if (!idea || deleting) return;
    setDeleting(true);
    try {
      await onDelete(idea.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }, [idea, deleting, onDelete, onClose]);

  const handleRefine = useCallback(async () => {
    if (!idea || refining) return;
    setRefining(true);
    try {
      await onRefine(idea.id);
    } finally {
      setRefining(false);
    }
  }, [idea, refining, onRefine]);

  const handleApplyRefine = useCallback(async () => {
    if (!idea || !refineResult || applying) return;
    setApplying(true);
    try {
      await onApplyRefine(idea.id, refineResult);
      // Update local form state with refined data
      setEditContent(refineResult.refinedContent);
      setEditSymbols(refineResult.extractedSymbols);
      setEditTags(refineResult.suggestedTags);
      setEditStatus('refined');
    } finally {
      setApplying(false);
    }
  }, [idea, refineResult, applying, onApplyRefine]);

  if (!idea) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-background-secondary z-50 flex flex-col border-l border-border drawer-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Edit Idea</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-hover text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Close drawer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Content */}
          <div>
            <label className="text-xs text-foreground-muted uppercase tracking-wider mb-1.5 block">
              Content
            </label>
            <textarea
              className="input min-h-[120px] resize-y text-sm"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          </div>

          {/* Symbols */}
          <div>
            <label className="text-xs text-foreground-muted uppercase tracking-wider mb-1.5 block">
              Symbols
            </label>
            <TickerAutocomplete
              selectedSymbols={editSymbols}
              onAdd={(s) => setEditSymbols((prev) => [...prev, s])}
              onRemove={(s) => setEditSymbols((prev) => prev.filter((t) => t !== s))}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-foreground-muted uppercase tracking-wider mb-1.5 block">
              Tags
            </label>
            <TagsInput
              tags={editTags}
              onAdd={(t) => setEditTags((prev) => [...prev, t])}
              onRemove={(t) => setEditTags((prev) => prev.filter((x) => x !== t))}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-foreground-muted uppercase tracking-wider mb-1.5 block">
              Status
            </label>
            <select
              className="input text-sm"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as IdeaStatus)}
            >
              <option value="draft">Draft</option>
              <option value="refined">Refined</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Meta info */}
          <div className="text-xs text-foreground-subtle space-y-1">
            <p>Source: {idea.source}</p>
            <p>Created: {formatDate(idea.createdAt, 'full')}</p>
            <p>Updated: {formatDate(idea.updatedAt, 'full')}</p>
          </div>

          {/* Refine diff preview */}
          {refineResult && (
            <RefineDiffPreview
              original={{
                content: idea.content,
                symbols: idea.symbols,
                tags: idea.tags,
              }}
              refined={refineResult}
              onApply={handleApplyRefine}
              onDismiss={onDismissRefine}
              applying={applying}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div>
            {!showDeleteConfirm ? (
              <button
                className="btn-ghost text-loss text-sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-loss">Confirm?</span>
                <button
                  className="btn-ghost text-loss text-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  className="btn-ghost text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary text-sm"
              onClick={handleRefine}
              disabled={refining}
            >
              {refining ? 'Refining...' : 'Auto-Refine'}
            </button>
            <button
              className="btn-primary text-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
