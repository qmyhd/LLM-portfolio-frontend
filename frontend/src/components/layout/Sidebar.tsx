'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
  { name: 'Watchlist', href: '/watchlist', icon: StarIcon, activeIcon: StarIconSolid },
  { name: 'Positions', href: '/positions', icon: ChartBarIcon, activeIcon: ChartBarIconSolid },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon, activeIcon: ClipboardDocumentListIconSolid },
];

interface FavoriteStock {
  ticker: string;
  change: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const [favorites, setFavorites] = useState<FavoriteStock[]>([]);

  // Load favorites from localStorage and fetch prices
  useEffect(() => {
    const loadFavorites = async () => {
      const stored = localStorage.getItem('portfolio-watchlist');
      if (stored) {
        try {
          const tickers = JSON.parse(stored) as string[];
          if (tickers.length > 0) {
            // Fetch current prices for favorites
            const res = await fetch(`/api/watchlist?tickers=${tickers.join(',')}`);
            const data = await res.json();
            setFavorites(
              (data.items || []).slice(0, 5).map((item: any) => ({
                ticker: item.symbol,
                change: item.changePercent,
              }))
            );
          }
        } catch {
          setFavorites([]);
        }
      }
    };

    loadFavorites();

    // Listen for storage changes (when favorites are updated elsewhere)
    const handleStorageChange = () => loadFavorites();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]); // Reload when navigating

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-background-secondary border-r border-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Portfolio</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.activeIcon : item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-hover'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Favorites section */}
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
              Favorites
            </h3>
            <div className="mt-2 space-y-1">
              {favorites.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">
                  No favorites yet. Use ⌘K to search and star tickers.
                </p>
              ) : (
                favorites.map((stock) => (
                  <Link
                    key={stock.ticker}
                    href={`/stock/${stock.ticker}`}
                    className={clsx(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    pathname === `/stock/${stock.ticker}`
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-hover'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{stock.ticker}</span>
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-mono',
                      stock.change >= 0 ? 'text-profit' : 'text-loss'
                    )}
                  >
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </span>
                </Link>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-border">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-background-hover transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}

// Mobile sidebar (drawer)
export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-background-secondary z-50 md:hidden animate-slide-up">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Portfolio</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-hover"
          >
            ✕
          </button>
        </div>
        
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-hover'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
