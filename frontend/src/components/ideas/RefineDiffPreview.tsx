'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import type { RefineResponse } from '@/types/ideas';

interface RefineDiffPreviewProps {
  original: { content: string; symbols: string[]; tags: string[] };
  refined: RefineResponse;
  onApply: () => void;
  onDismiss: () => void;
  applying: boolean;
}

export function RefineDiffPreview({
  original,
  refined,
  onApply,
  onDismiss,
  applying,
}: RefineDiffPreviewProps) {
  return (
    <div className="card p-4 border-primary/50 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">AI-Refined Suggestion</h3>
        {refined.reflectionApplied && (
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded font-medium">
            Reflection Applied
          </span>
        )}
      </div>
      <p className="text-xs text-foreground-muted">{refined.changesSummary}</p>

      {/* Side-by-side diff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Original */}
        <div className="p-3 bg-background-hover rounded-lg">
          <h4 className="text-xs text-foreground-muted mb-2 font-medium">Original</h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">{original.content}</p>
          {original.symbols.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {original.symbols.map((s) => (
                <span
                  key={s}
                  className="font-mono text-[10px] px-1.5 py-0.5 bg-background-secondary text-foreground-muted rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {original.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {original.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 bg-background-secondary text-foreground-subtle rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Refined */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="text-xs text-primary mb-2 font-medium">Refined</h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {refined.refinedContent}
          </p>
          {refined.extractedSymbols.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {refined.extractedSymbols.map((s) => (
                <span
                  key={s}
                  className="font-mono text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {refined.suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {refined.suggestedTags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary/80 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button className="btn-ghost text-sm" onClick={onDismiss}>
          Dismiss
        </button>
        <button
          className="btn-primary text-sm"
          onClick={onApply}
          disabled={applying}
        >
          {applying ? 'Applying...' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
}
