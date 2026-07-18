'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  LightBulbIcon as LightBulbIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
  ClockIcon as ClockIconSolid,
} from '@heroicons/react/24/solid';
import { formatNumber } from '@/lib/format';
import { useBucket } from '@/contexts/BucketContext';
import { stockHref } from '@/lib/bucket';

// Research-first nav. The home page (`/`) hosts the ideas feed and
// quick-jump tiles. Portfolio is a separate tab so trading data stays
// separated from research/analysis. Positions / Orders / Activity live
// under /portfolio and inherit the bucket switcher set by that layout.
const researchNav = [
  { name: 'Research', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid, exact: true },
  { name: 'Ideas', href: '/ideas', icon: LightBulbIcon, activeIcon: LightBulbIconSolid },
  { name: 'Timeline', href: '/timeline', icon: ClockIcon, activeIcon: ClockIconSolid },
  { name: 'Profiles', href: '/profiles', icon: ClipboardDocumentListIcon, activeIcon: ClipboardDocumentListIconSolid },
  { name: 'Credibility', href: '/credibility', icon: ShieldCheckIcon, activeIcon: ShieldCheckIconSolid },
  { name: 'Videos', href: '/research', icon: VideoCameraIcon, activeIcon: VideoCameraIconSolid },
];

// "Overview" instead of "Portfolio" to avoid duplicating the section
// header right above it — the section is already labeled "Portfolio".
const portfolioNav = [
  { name: 'Overview', href: '/portfolio', icon: BriefcaseIcon, activeIcon: BriefcaseIconSolid, exact: true },
  { name: 'Positions', href: '/portfolio/positions', icon: ChartBarIcon, activeIcon: ChartBarIconSolid },
  { name: 'Orders', href: '/portfolio/orders', icon: ClipboardDocumentListIcon, activeIcon: ClipboardDocumentListIconSolid },
  { name: 'Activity', href: '/portfolio/activity', icon: ArrowsRightLeftIcon, activeIcon: ArrowsRightLeftIconSolid },
];

interface FavoriteStock {
  ticker: string;
  change: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const [favorites, setFavorites] = useState<FavoriteStock[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Bucket flows through to favorite stock links so the user keeps the
  // active filter when jumping to a stock from the sidebar. Returns null
  // on the Research side, in which case stockHref renders a plain URL.
  const bucket = useBucket();

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
            const items: Array<{ symbol: string; changePercent: number }> = data.items || [];
            setFavorites(
              items.slice(0, 5).map((item) => ({
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

        {/* Navigation — Research group first (the focus of the site), then Portfolio */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          <NavGroup
            title="Research"
            items={researchNav}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />
          <NavGroup
            title="Portfolio"
            items={portfolioNav}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />

          {/* Favorites section - hidden when collapsed */}
          {!isCollapsed && (
            <div className="pt-6">
              <h3 className="px-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                Favorites
              </h3>
              <div className="mt-2 space-y-1">
                {favorites.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-foreground-muted">
                    No favorites yet. Use ⌘K / Ctrl+K to search and star tickers.
                  </p>
                ) : (
                  favorites.map((stock) => (
                    <Link
                      key={stock.ticker}
                      href={stockHref(stock.ticker, bucket)}
                      className={clsx(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                        pathname === `/stock/${stock.ticker}`
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground-muted hover:text-foreground hover:bg-background-hover'
                      )}
                      aria-current={pathname === `/stock/${stock.ticker}` ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{stock.ticker}</span>
                      </div>
                      <span
                        className={clsx(
                          'text-xs font-mono',
                          stock.change > 0 ? 'text-profit' :
                          stock.change < 0 ? 'text-loss' : 'text-foreground-muted'
                        )}
                      >
                        {stock.change === 0
                          ? '\u2014'
                          : `${stock.change >= 0 ? '+' : ''}${formatNumber(stock.change)}%`}
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

// ---------------------------------------------------------------------------
// Nav group helper — renders a labeled section of nav items.
// ---------------------------------------------------------------------------

interface NavItem {
  name: string;
  href: string;
  icon: typeof HomeIcon;
  activeIcon: typeof HomeIconSolid;
  exact?: boolean;
}

interface NavGroupProps {
  title: string;
  items: NavItem[];
  pathname: string;
  isCollapsed: boolean;
}

function NavGroup({ title, items, pathname, isCollapsed }: NavGroupProps) {
  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <h3 className="px-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
          {title}
        </h3>
      )}
      {items.map((item) => {
        // `exact` items only highlight on exact match (so /portfolio doesn't
        // light up when on /portfolio/positions). Others use prefix match.
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              isCollapsed && 'justify-center px-0',
            )}
            title={isCollapsed ? item.name : undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && item.name}
          </Link>
        );
      })}
    </div>
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
            className="p-2 rounded-lg hover:bg-background-hover text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        
        <nav className="px-3 py-4 space-y-4">
          {[
            { title: 'Research', items: researchNav },
            { title: 'Portfolio', items: portfolioNav },
          ].map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
                {group.title}
              </h3>
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
