import Link from 'next/link';
import {
  LightBulbIcon,
  BriefcaseIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ResearchFeed } from '@/components/research/ResearchFeed';

/**
 * Research home — primary landing page.
 *
 * Surfaces recent parsed Discord ideas across all tickers so the user
 * sees "what's been said lately" without picking a stock first. A small
 * quick-tile strip provides one-click navigation to the main destinations.
 *
 * The manual idea-capture form lives at /ideas; the watchlist concept
 * was removed in favor of the dynamic "trending tickers" strip inside
 * ResearchFeed (derived from whichever tickers Discord has been talking
 * about recently).
 */
export default function ResearchHome() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Compact 3-tile quick-jump strip */}
            <section
              className="grid grid-cols-3 gap-3"
              aria-label="Quick navigation"
            >
              <QuickTile
                href="/ideas"
                icon={LightBulbIcon}
                label="Capture"
                hint="Save a new trade thesis"
              />
              <QuickTile
                href="/portfolio"
                icon={BriefcaseIcon}
                label="Portfolio"
                hint="Positions, risk, equity curve"
              />
              <QuickTile
                href="/portfolio/activity"
                icon={ArrowsRightLeftIcon}
                label="Activity"
                hint="Trade history, dividends, fees"
              />
            </section>

            {/* Primary surface: recent Discord ideas */}
            <ResearchFeed />
          </div>
        </main>
      </div>
    </div>
  );
}

interface QuickTileProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}

function QuickTile({ href, icon: Icon, label, hint }: QuickTileProps) {
  return (
    <Link
      href={href}
      className="card group p-3 sm:p-4 hover:bg-background-hover hover:border-primary/30 transition-all flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-foreground-muted truncate">{hint}</p>
      </div>
      <ArrowRightIcon className="w-3.5 h-3.5 text-foreground-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}
