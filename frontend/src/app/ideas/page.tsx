import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { IdeasPageContent } from '@/components/ideas/IdeasPageContent';

export default function IdeasPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <IdeasPageContent />
          </div>
        </main>
      </div>
    </div>
  );
}
