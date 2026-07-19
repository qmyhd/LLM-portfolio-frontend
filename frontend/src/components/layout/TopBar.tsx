'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { useSession, signOut } from 'next-auth/react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  ArrowPathIcon,
  StarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { FAVORITE_COLOR } from '@/lib/colors';
import { MobileSidebar } from './Sidebar';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';

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
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  // useBucket returns null when no BucketProvider is in scope (Research side)
  // — stockHref(symbol, null) gracefully renders /stock/<symbol> in that case.
  const bucket = useBucket();
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
      router.push(stockHref(ticker, bucket));
      setSearchQuery('');
      setIsSearchFocused(false);
      setSearchResults([]);
    }
  }, [searchQuery, router, selectedIndex, searchResults, bucket]);

  // Navigate to stock
  const navigateToStock = (symbol: string) => {
    router.push(stockHref(symbol, bucket));
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

  // Close the account menu on outside click
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  const userEmail = session?.user?.email ?? '';
  const userRole = session?.user?.role ?? 'viewer';
  const avatarInitial = (userEmail.trim()[0] || 'U').toUpperCase();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate(
        (key: unknown) => typeof key === 'string' && (key.startsWith('/api/portfolio') || key.startsWith('/api/watchlist')),
        undefined,
        { revalidate: true }
      );
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-background-secondary border-b border-border">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-background-hover text-foreground-muted hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
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
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md mx-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search ticker... (⌘K / Ctrl+K)"
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
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
            <div className="absolute mt-2 w-full max-w-md bg-background-secondary border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto" role="listbox" aria-label="Search results">
              {searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((result, index) => {
                    const isFavorite = favorites.includes(result.symbol);
                    // Row is a div (not a button) so the favorite control can be
                    // a real nested button without invalid-HTML / a11y issues.
                    return (
                      <div
                        key={result.symbol}
                        role="option"
                        aria-selected={index === selectedIndex}
                        tabIndex={-1}
                        onClick={() => navigateToStock(result.symbol)}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer',
                          index === selectedIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-background-tertiary'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-foreground">
                            {result.symbol}
                          </span>
                          <span className="text-sm text-foreground-muted truncate max-w-[180px]">
                            {result.name}
                          </span>
                          {result.type === 'etf' && (
                            <span className="px-1.5 py-0.5 text-2xs bg-primary/20 text-primary rounded">
                              ETF
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={isFavorite ? `Unfavorite ${result.symbol}` : `Favorite ${result.symbol}`}
                          onClick={(e) => toggleFavorite(result.symbol, e)}
                          className="p-1 hover:bg-background-tertiary rounded"
                        >
                          {isFavorite ? (
                            <StarIconSolid className={`w-4 h-4 ${FAVORITE_COLOR}`} />
                          ) : (
                            <StarIcon className="w-4 h-4 text-foreground-muted" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 1 && !isSearching ? (
                <div className="p-2">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 border border-border/50 text-left transition-colors"
                  >
                    <div className="p-1 bg-primary/10 rounded">
                      <MagnifyingGlassIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm text-foreground">
                        View stock page for <span className="font-mono font-bold text-primary">{searchQuery}</span>
                      </span>
                      <p className="text-2xs text-foreground-muted mt-0.5">
                        Press Enter to go
                      </p>
                    </div>
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

          {/* Account menu */}
          <div className="relative ml-2" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((o) => !o)}
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium text-white hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              title={userEmail || 'Account'}
            >
              {avatarInitial}
            </button>

            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-background-secondary border border-border rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate" title={userEmail}>
                    {userEmail || 'Signed in'}
                  </p>
                  <span
                    className={clsx(
                      'mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium capitalize',
                      userRole === 'owner'
                        ? 'bg-primary/15 text-primary'
                        : userRole === 'editor'
                        ? 'bg-sky-500/15 text-sky-400'
                        : 'bg-foreground-muted/15 text-foreground-muted',
                    )}
                  >
                    {userRole}
                  </span>
                  {userRole === 'viewer' && (
                    <p className="mt-1.5 text-2xs text-foreground-subtle leading-snug">
                      Read-only access — portfolio sizes are hidden; you&apos;re
                      seeing research, timing, and percentage performance.
                    </p>
                  )}
                </div>
                <button
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-muted hover:text-foreground hover:bg-background-hover transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
