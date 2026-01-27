'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const WATCHLIST_KEY = 'portfolio-watchlist';

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickers, setTickers] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [addingTicker, setAddingTicker] = useState(false);
  const [error, setError] = useState('');

  // Load tickers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      try {
        setTickers(JSON.parse(stored));
      } catch {
        setTickers(['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA']);
      }
    } else {
      // Default watchlist
      setTickers(['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA']);
    }
  }, []);

  // Fetch data when tickers change
  useEffect(() => {
    if (tickers.length > 0) {
      fetchWatchlistData();
      // Save to localStorage
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers));
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [tickers]);

  const fetchWatchlistData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/watchlist?tickers=${tickers.join(',')}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTicker = async () => {
    if (!newTicker.trim()) return;
    
    const symbol = newTicker.toUpperCase().trim();
    
    // Check if already in list
    if (tickers.includes(symbol)) {
      setError('Symbol already in watchlist');
      return;
    }
    
    setAddingTicker(true);
    setError('');
    
    try {
      // Validate ticker
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: symbol }),
      });
      const data = await res.json();
      
      if (data.valid) {
        setTickers([...tickers, symbol]);
        setNewTicker('');
      } else {
        setError(data.message || 'Invalid symbol');
      }
    } catch {
      setError('Failed to validate symbol');
    } finally {
      setAddingTicker(false);
    }
  };

  const removeTicker = (symbol: string) => {
    setTickers(tickers.filter(t => t !== symbol));
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Watchlist</h1>
          <p className="text-muted">Track your favorite stocks</p>
        </div>
        
        {/* Add Ticker */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add symbol..."
            value={newTicker}
            onChange={(e) => {
              setNewTicker(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && addTicker()}
            className="input w-32 uppercase"
            maxLength={6}
          />
          <button
            onClick={addTicker}
            disabled={addingTicker || !newTicker.trim()}
            className="btn-primary px-3"
          >
            {addingTicker ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-loss/10 px-4 py-2 text-sm text-loss">
          {error}
        </div>
      )}

      {/* Watchlist Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton mb-3 h-6 w-16 rounded" />
              <div className="skeleton mb-2 h-8 w-24 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <StarIcon className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No stocks in watchlist</h3>
          <p className="mt-2 text-muted">Add some symbols to start tracking</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <a
              key={item.symbol}
              href={`/stock/${item.symbol}`}
              className="card group relative p-4 transition-all hover:border-accent"
            >
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeTicker(item.symbol);
                }}
                className="absolute right-2 top-2 rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-tertiary hover:text-foreground group-hover:opacity-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>

              {/* Symbol */}
              <div className="flex items-center gap-2">
                <StarIconSolid className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-foreground">{item.symbol}</span>
              </div>

              {/* Price */}
              <div className="mt-2">
                <span className="text-2xl font-bold text-foreground">
                  ${item.price.toFixed(2)}
                </span>
              </div>

              {/* Change */}
              <div className={`mt-1 flex items-center gap-1 ${
                item.change >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                {item.change >= 0 ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" />
                )}
                <span className="text-sm font-medium">
                  ${Math.abs(item.change).toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </span>
              </div>

              {/* Volume */}
              <div className="mt-2 text-xs text-muted">
                Vol: {formatVolume(item.volume)}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-4">
        <h3 className="mb-3 font-medium text-foreground">Quick Add</h3>
        <div className="flex flex-wrap gap-2">
          {['SPY', 'QQQ', 'AMD', 'META', 'AMZN', 'NFLX'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => {
                if (!tickers.includes(symbol)) {
                  setTickers([...tickers, symbol]);
                }
              }}
              disabled={tickers.includes(symbol)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                tickers.includes(symbol)
                  ? 'bg-accent/20 text-accent cursor-not-allowed'
                  : 'bg-tertiary text-muted hover:bg-accent hover:text-white'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
