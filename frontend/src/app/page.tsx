import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ResearchFeed } from '@/components/research/ResearchFeed';
import { HomeSummary } from '@/components/dashboard/HomeSummary';

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
            {/* Personalized "today" strip: performance %, top mover,
                awaiting-review (owner/editor), capture shortcut. */}
            <HomeSummary />

            {/* Primary surface: recent Discord ideas + research */}
            <ResearchFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
