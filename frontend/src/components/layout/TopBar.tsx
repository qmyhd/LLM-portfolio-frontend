'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  BellIcon,
  ArrowPathIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { MobileSidebar } from './Sidebar';

interface SearchResult {
  symbol: string;
  name: string;
  sector: string;
  type: 'stock' | 'etf';
}

interface TopBarProps {
  currentTicker?: string;
}

export function TopBar({ currentTicker }: TopBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('portfolio-watchlist');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Handle search submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const ticker = selectedIndex >= 0 && searchResults[selectedIndex]
      ? searchResults[selectedIndex].symbol
      : searchQuery.trim().toUpperCase();
    if (ticker) {
      router.push(`/stock/${ticker}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      setSearchResults([]);
    }
  }, [searchQuery, router, selectedIndex, searchResults]);

  // Navigate to stock
  const navigateToStock = (symbol: string) => {
    router.push(`/stock/${symbol}`);
    setSearchQuery('');
    setIsSearchFocused(false);
    setSearchResults([]);
  };

  // Toggle favorite
  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem('portfolio-watchlist');
    let watchlist: string[] = [];
    if (stored) {
      try {
        watchlist = JSON.parse(stored);
      } catch {
        watchlist = [];
      }
    }

    if (watchlist.includes(symbol)) {
      watchlist = watchlist.filter((t) => t !== symbol);
    } else {
      watchlist.push(symbol);
    }

    localStorage.setItem('portfolio-watchlist', JSON.stringify(watchlist));
    setFavorites(watchlist);
  };

  // Keyboard navigation in results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchFocused || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setSearchResults([]);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mock refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-background-secondary border-b border-border">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-background-hover"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Current ticker badge (if on stock page) */}
          {currentTicker && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-background-hover rounded-lg">
              <span className="font-mono font-semibold text-lg">{currentTicker}</span>
            </div>
          )}
        </div>

        {/* Center - Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search ticker... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={handleKeyDown}
              className={clsx(
                'input pl-10 pr-4 py-2',
                isSearchFocused && 'ring-2 ring-primary'
              )}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isSearching && searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-2xs font-mono text-foreground-subtle bg-background-elevated rounded">
                  Enter
                </kbd>
              </div>
            )}
          </div>
          
          {/* Search results dropdown */}
          {isSearchFocused && (searchQuery.length >= 1 || searchResults.length > 0) && (
            <div className="absolute mt-2 w-full max-w-md bg-secondary border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((result, index) => {
                    const isFavorite = favorites.includes(result.symbol);
                    return (
                      <button
                        key={result.symbol}
                        type="button"
                        onClick={() => navigateToStock(result.symbol)}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-2 text-left transition-colors',
                          index === selectedIndex
                            ? 'bg-accent/10 text-accent'
                            : 'hover:bg-tertiary'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-foreground">
                            {result.symbol}
                          </span>
                          <span className="text-sm text-muted truncate max-w-[180px]">
                            {result.name}
                          </span>
                          {result.type === 'etf' && (
                            <span className="px-1.5 py-0.5 text-2xs bg-accent/20 text-accent rounded">
                              ETF
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => toggleFavorite(result.symbol, e)}
                          className="p-1 hover:bg-tertiary rounded"
                        >
                          {isFavorite ? (
                            <StarIconSolid className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <StarIcon className="w-4 h-4 text-muted" />
                          )}
                        </button>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 1 && !isSearching ? (
                <div className="p-3">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary text-left"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 text-muted" />
                    <span className="text-muted">
                      Go to <span className="font-mono font-semibold text-foreground">{searchQuery}</span>
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </form>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-background-hover disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={clsx('w-5 h-5', isRefreshing && 'animate-spin')} />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-background-hover relative">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-loss rounded-full" />
          </button>

          {/* Profile */}
          <button className="ml-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium text-white">
            Q
          </button>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
