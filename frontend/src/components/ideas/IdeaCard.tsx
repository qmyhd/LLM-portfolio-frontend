'use client';

import type { UserIdea } from '@/types/ideas';
import { formatRelativeTime } from '@/lib/format';
import { IDEA_STATUS_COLORS, IDEA_SOURCE_COLORS } from '@/lib/colors';

interface IdeaCardProps {
  idea: UserIdea;
  onClick: (idea: UserIdea) => void;
}

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  return (
    <div
      className="card p-4 cursor-pointer hover:border-border-hover transition-all"
      onClick={() => onClick(idea)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(idea);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Header: source + status + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              IDEA_SOURCE_COLORS[idea.source] || IDEA_SOURCE_COLORS._default
            }`}
          >
            {idea.source}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              IDEA_STATUS_COLORS[idea.status] || IDEA_STATUS_COLORS._default
            }`}
          >
            {idea.status}
          </span>
        </div>
        <span className="text-xs text-foreground-subtle">{formatRelativeTime(idea.createdAt)}</span>
      </div>

      {/* Content preview */}
      <p className="text-sm text-foreground line-clamp-3 mb-2">{idea.content}</p>

      {/* Symbol badges */}
      {((idea.symbols ?? []).length > 0 || idea.symbol) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {idea.symbol && !(idea.symbols ?? []).includes(idea.symbol) && (
            <span className="font-mono text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              {idea.symbol}
            </span>
          )}
          {(idea.symbols ?? []).map((s) => (
            <span
              key={s}
              className="font-mono text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {(idea.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(idea.tags ?? []).map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 bg-background-hover text-foreground-muted rounded"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
