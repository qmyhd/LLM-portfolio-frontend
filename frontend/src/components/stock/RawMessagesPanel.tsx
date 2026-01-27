'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface RawMessage {
  id: string;
  content: string;
  author: string;
  channelName: string;
  timestamp: string;
  symbols: string[];
}

interface RawMessagesPanelProps {
  ticker: string;
}

export function RawMessagesPanel({ ticker }: RawMessagesPanelProps) {
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [ticker]);

  const fetchMessages = async () => {
    try {
      // Mock data - would fetch from /api/stocks/[ticker]/messages
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockMessages: RawMessage[] = [];
      const now = new Date();
      const channels = ['trading-ideas', 'market-chat', 'daily-discussion'];
      const authors = ['trader_42', 'chart_master', 'swing_king', 'momentum_joe', 'options_guru'];

      for (let i = 0; i < 15; i++) {
        const hoursAgo = Math.floor(Math.random() * 72);
        const date = new Date(now);
        date.setHours(date.getHours() - hoursAgo);

        mockMessages.push({
          id: `msg_${i}`,
          content: generateMockMessage(ticker, i),
          author: authors[Math.floor(Math.random() * authors.length)],
          channelName: channels[Math.floor(Math.random() * channels.length)],
          timestamp: date.toISOString(),
          symbols: [ticker, ...(Math.random() > 0.7 ? ['SPY'] : [])],
        });
      }

      // Sort by timestamp descending
      mockMessages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
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
        <ChatBubbleLeftIcon className="h-12 w-12 text-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Messages</h3>
        <p className="text-sm text-muted">
          No recent messages mentioning ${ticker}
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
            className="p-3 rounded-lg bg-tertiary hover:bg-tertiary/80 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{msg.author}</span>
                <span className="text-xs text-muted">#{msg.channelName}</span>
              </div>
              <span className="text-xs text-muted">{formatTime(msg.timestamp)}</span>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
              {msg.content}
            </p>

            {/* Symbols */}
            {msg.symbols.length > 1 && (
              <div className="flex gap-1 mt-2">
                {msg.symbols.map((sym) => (
                  <span
                    key={sym}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      sym === ticker
                        ? 'bg-accent/20 text-accent'
                        : 'bg-secondary text-muted'
                    }`}
                  >
                    ${sym}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function generateMockMessage(ticker: string, index: number): string {
  const messages = [
    `$${ticker} looking strong at this level. Support held perfectly.`,
    `Just added to my $${ticker} position. This pullback was the opportunity I was waiting for.`,
    `$${ticker} breaking out of the wedge pattern. Volume confirming the move.`,
    `Anyone else watching $${ticker}? The RSI divergence is interesting here.`,
    `$${ticker} earnings next week. Implied vol is getting spicy.`,
    `Closed half of my $${ticker} calls for 150% gain. Letting the rest ride.`,
    `$${ticker} at key resistance. Needs to break through 180 to confirm the trend.`,
    `$${ticker} consolidating nicely. Building a base for the next leg up.`,
    `Looking at $${ticker} weekly chart - higher lows forming. Bullish setup.`,
    `$${ticker} sector rotation could benefit this name. Watching closely.`,
    `$${ticker} just hit my price target. Taking profits here.`,
    `$${ticker} - the fundamentals support a move higher. Growth story intact.`,
    `Interesting flow in $${ticker} options. Big call buying at the ask.`,
    `$${ticker} filling the gap from last month. Could be a good entry.`,
    `$${ticker} insider buying reported. That's a positive signal.`,
  ];
  
  return messages[index % messages.length];
}
