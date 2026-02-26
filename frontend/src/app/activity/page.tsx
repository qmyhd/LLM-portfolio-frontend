import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ActivityFeed } from '@/components/activity/ActivityFeed';

export default function ActivityPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Activity</h1>
              <p className="text-sm text-foreground-muted mt-1">
                Trade history, dividends, and fees
              </p>
            </div>

            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
