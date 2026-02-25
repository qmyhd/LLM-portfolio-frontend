'use client';

import type { UserIdea } from '@/types/ideas';

interface IdeaCardProps {
  idea: UserIdea;
  onClick: (idea: UserIdea) => void;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  refined: 'bg-green-500/20 text-green-400',
  archived: 'bg-background-hover text-foreground-subtle',
};

const sourceStyles: Record<string, string> = {
  discord: 'bg-indigo-500/20 text-indigo-400',
  manual: 'bg-primary/20 text-primary',
  transcribe: 'bg-purple-500/20 text-purple-400',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
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
              sourceStyles[idea.source] || sourceStyles.manual
            }`}
          >
            {idea.source}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              statusStyles[idea.status] || statusStyles.draft
            }`}
          >
            {idea.status}
          </span>
        </div>
        <span className="text-xs text-foreground-muted">{timeAgo(idea.createdAt)}</span>
      </div>

      {/* Content preview */}
      <p className="text-sm text-foreground line-clamp-3 mb-2">{idea.content}</p>

      {/* Symbol badges */}
      {(idea.symbols.length > 0 || idea.symbol) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {idea.symbol && !idea.symbols.includes(idea.symbol) && (
            <span className="font-mono text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              {idea.symbol}
            </span>
          )}
          {idea.symbols.map((s) => (
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
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {idea.tags.map((t) => (
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
