'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ChatWidgetProps {
  ticker: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  'Summarize recent ideas',
  'Technical analysis outlook',
  'What\'s the sentiment?',
  'Key price levels',
];

export function ChatWidget({ ticker }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I can help you analyze ${ticker}. Ask me about technical analysis, sentiment, recent ideas, or anything else about this stock.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(ticker, content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={clsx(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={clsx(
                'max-w-[85%] rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-background-elevated border border-border'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Assistant</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <p className={clsx(
                'text-2xs mt-1',
                message.role === 'user' ? 'text-white/70' : 'text-foreground-subtle'
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background-elevated border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-foreground-muted">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map(action => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="px-3 py-1.5 text-xs bg-background-hover hover:bg-border rounded-full text-foreground-muted hover:text-foreground transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${ticker}...`}
            disabled={isLoading}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={clsx(
              'btn-primary px-3',
              (!input.trim() || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

// Mock response generator (will be replaced with actual AI)
function generateMockResponse(ticker: string, query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('sentiment')) {
    return `Based on 45 recent mentions of ${ticker}, the overall sentiment is **bullish** with a score of 0.72.\n\n• 68% of mentions are bullish\n• 18% are bearish\n• 14% are neutral\n\nRecent catalysts include strong earnings and positive analyst upgrades.`;
  }
  
  if (lowerQuery.includes('technical') || lowerQuery.includes('analysis')) {
    return `**Technical Analysis for ${ticker}:**\n\n📈 **Trend:** Bullish (above 50 & 200 EMA)\n📊 **RSI (14):** 62 (neutral-bullish)\n📉 **MACD:** Bullish crossover\n\n**Key Levels:**\n• Resistance: $185, $195\n• Support: $170, $165\n\nThe stock is consolidating after a breakout. Watch for a move above $185 for continuation.`;
  }
  
  if (lowerQuery.includes('summarize') || lowerQuery.includes('ideas')) {
    return `**Recent Ideas Summary for ${ticker}:**\n\n1. **Bullish Trade Plan** (85% conf) - Breakout play targeting $195, stop at $168\n\n2. **Earnings Catalyst** (72% conf) - Beat expectations, guidance raised\n\n3. **Bearish TA** (65% conf) - Expecting pullback to $160 (RSI overbought)\n\nMost ideas lean bullish with an average confidence of 75%.`;
  }
  
  if (lowerQuery.includes('price') || lowerQuery.includes('level')) {
    return `**Key Price Levels for ${ticker}:**\n\n🟢 **Strong Support:** $165 (50 EMA + high volume node)\n🟢 **Support:** $170 (recent swing low)\n\n🔴 **Resistance:** $185 (previous high)\n🔴 **Strong Resistance:** $195 (all-time high)\n\n📍 **Current Price:** $178.52\n📊 **Fair Value Estimate:** $190-200`;
  }
  
  return `I analyzed your question about ${ticker}. Based on the available data:\n\n• Current price is $178.52 (+1.88% today)\n• Overall sentiment is bullish (0.72 score)\n• You hold 100 shares with +22.86% unrealized gain\n\nWould you like more details on technical analysis, sentiment, or recent ideas?`;
}
