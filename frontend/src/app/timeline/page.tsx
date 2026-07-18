'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TimelineFeed } from '@/components/timeline/TimelineFeed';
import { ReviewQueue } from '@/components/timeline/ReviewQueue';

type Tab = 'timeline' | 'review';

/**
 * Imported-content workspace.
 *
 * - Timeline: chronological story view of iMessage/X imports and journal
 *   ideas (GET /ideas/timeline), with per-item curation.
 * - Review queue: work through unreviewed NLP parses and imported ideas —
 *   fix labels, attribution (people / 13F institutions), tags, and review
 *   status. Reviewed items are frozen against NLP reparses.
 */
export default function TimelinePage() {
  const [tab, setTab] = useState<Tab>('timeline');

  const tabClass = (t: Tab) =>
    clsx(
      'px-3 py-2 text-sm',
      tab === t ? 'border-b-2 border-primary text-foreground' : 'text-foreground-muted',
    );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Timeline</h1>
              <p className="text-foreground-muted">
                Imported messages and journal ideas in story order — review, correct
                attribution, and tag as you go.
              </p>
            </div>

            <div className="flex gap-2 border-b border-border">
              <button type="button" onClick={() => setTab('timeline')} className={tabClass('timeline')}>
                Timeline
              </button>
              <button type="button" onClick={() => setTab('review')} className={tabClass('review')}>
                Review queue
              </button>
            </div>

            {tab === 'timeline' ? <TimelineFeed /> : <ReviewQueue />}
          </div>
        </main>
      </div>
    </div>
  );
}
