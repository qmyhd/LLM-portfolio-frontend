'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface RawMessage {
  id: number;
  messageId: string;
  ticker: string;
  direction: string;
  ideaText: string;
  author: string;
  channel: string;
  createdAt: string | null;
  labels: string[];
}

interface RawMessagesPanelProps {
  ticker: string;
}

export function RawMessagesPanel({ ticker }: RawMessagesPanelProps) {
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMessages = useCallback(async (append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const offset = append ? cursor : 0;
      const res = await fetch(`/api/sentiment/messages?ticker=${encodeURIComponent(ticker)}&limit=20&cursor=${offset}`);
      if (!res.ok) return;
      const data = await res.json();

      const newMessages: RawMessage[] = (data.messages || []).map((m: Record<string, unknown>) => ({
        id: m.id as number,
        messageId: m.messageId as string,
        ticker: m.ticker as string,
        direction: m.direction as string,
        ideaText: m.ideaText as string,
        author: (m.author as string) || 'Unknown',
        channel: (m.channel as string) || 'unknown',
        createdAt: (m.createdAt as string) || null,
        labels: (m.labels as string[]) || [],
      }));

      if (append) {
        setMessages(prev => [...prev, ...newMessages]);
      } else {
        setMessages(newMessages);
      }

      setHasMore(data.nextCursor != null);
      setCursor(data.nextCursor ?? 0);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [ticker, cursor]);

  useEffect(() => {
    setCursor(0);
    setMessages([]);
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="skeleton h-3 w-24 mb-2 rounded" />
            <div className="skeleton h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ChatBubbleLeftIcon className="h-12 w-12 text-foreground-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Messages</h3>
        <p className="text-sm text-foreground-muted">
          {`No recent messages mentioning ${ticker}`}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="p-3 rounded-lg bg-background-tertiary hover:bg-background-tertiary/80 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{msg.author}</span>
                <span className="text-xs text-foreground-muted">#{msg.channel}</span>
              </div>
              <span className="text-xs text-foreground-muted">{formatTime(msg.createdAt)}</span>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
              {msg.ideaText}
            </p>

            {/* Direction badge */}
            {msg.direction && (
              <div className="flex gap-1 mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  msg.direction === 'bullish' ? 'bg-profit/20 text-profit' :
                  msg.direction === 'bearish' ? 'bg-loss/20 text-loss' :
                  'bg-foreground-muted/20 text-foreground-muted'
                }`}>
                  {msg.direction}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="p-4 text-center">
          <button
            onClick={() => fetchMessages(true)}
            disabled={loadingMore}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load more messages'}
          </button>
        </div>
      )}
    </div>
  );
}
