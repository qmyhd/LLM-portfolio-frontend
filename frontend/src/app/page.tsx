import Link from 'next/link';
import {
  LightBulbIcon,
  StarIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { IdeasPageContent } from '@/components/ideas/IdeasPageContent';

/**
 * Research home — the new primary landing page.
 *
 * Hosts the trading ideas feed prominently. Portfolio data has moved to
 * /portfolio. This separation matches the project goal: research and
 * analysis are the main focus, portfolio metrics live in their own tab.
 */
export default function ResearchHome() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick-jump tiles for top-level destinations */}
            <section
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              aria-label="Quick navigation"
            >
              <QuickTile
                href="/ideas"
                icon={LightBulbIcon}
                label="Ideas"
                hint="Discord-parsed trading ideas"
              />
              <QuickTile
                href="/watchlist"
                icon={StarIcon}
                label="Watchlist"
                hint="Tracked tickers"
              />
              <QuickTile
                href="/portfolio"
                icon={BriefcaseIcon}
                label="Portfolio"
                hint="Positions, trades, risk"
              />
              <QuickTile
                href="/portfolio/activity"
                icon={ChartBarIcon}
                label="Activity"
                hint="Trade history"
              />
            </section>

            {/* Primary research surface: ideas feed */}
            <section aria-label="Trading ideas">
              <IdeasPageContent />
            </section>
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
      className="card group p-4 hover:bg-background-hover transition-colors flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-foreground-muted truncate">{hint}</p>
      </div>
      <ArrowRightIcon className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors flex-shrink-0" />
    </Link>
  );
}
