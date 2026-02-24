'use client';

import { useNews } from '@/hooks/useOpenBB';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface NewsPanelProps {
  ticker: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffH < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function NewsPanel({ ticker }: NewsPanelProps) {
  const { data, isLoading, error } = useNews(ticker, 15);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-foreground-muted text-sm">
        Failed to load news
      </div>
    );
  }

  if (!data?.articles?.length) {
    return (
      <div className="p-4 text-center text-foreground-muted text-sm">
        No news available for {ticker}
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {data.articles.map((article, i) => (
        <a
          key={i}
          href={article.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-lg border border-border/50 hover:border-border hover:bg-background-tertiary transition-colors group"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>
            {article.url && (
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-foreground-muted flex-shrink-0 mt-0.5" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {article.source && (
              <span className="text-2xs text-foreground-muted">{article.source}</span>
            )}
            {article.source && article.date && (
              <span className="text-2xs text-foreground-subtle">&middot;</span>
            )}
            {article.date && (
              <span className="text-2xs text-foreground-subtle">{formatDate(article.date)}</span>
            )}
          </div>
          {article.text && (
            <p className="text-xs text-foreground-muted mt-1.5 line-clamp-2 leading-relaxed">
              {article.text}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
