'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto text-center py-20">
            <Cog6ToothIcon className="mx-auto h-16 w-16 text-muted" />
            <h1 className="mt-6 text-2xl font-bold text-foreground">Settings</h1>
            <p className="mt-2 text-muted">
              Account preferences, API keys, and display options are coming soon.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
