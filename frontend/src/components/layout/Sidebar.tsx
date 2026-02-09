'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { formatNumber } from '@/lib/format';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

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
      <div className={clsx(
        'flex flex-col bg-background-secondary border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo + Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-border">
          <Link href="/" className={clsx('flex items-center gap-3', isCollapsed && 'justify-center w-full')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && <span className="font-semibold text-lg">Portfolio</span>}
          </Link>
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg hover:bg-background-hover text-foreground-muted hover:text-foreground transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="px-3 py-2">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-background-hover text-foreground-muted hover:text-foreground transition-colors"
              title="Expand sidebar"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

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
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
                    isCollapsed && 'justify-center px-0'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </div>

          {/* Favorites section - hidden when collapsed */}
          {!isCollapsed && (
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
                        {stock.change >= 0 ? '+' : ''}{formatNumber(stock.change)}%
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-border">
          <Link
            href="/settings"
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-background-hover transition-colors',
              isCollapsed && 'justify-center px-0'
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && 'Settings'}
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
