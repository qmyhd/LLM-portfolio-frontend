'use client';

import { useState } from 'react';
import { TranscriptSummary } from './insights/TranscriptSummary';
import { ManagementTeam } from './insights/ManagementTeam';
import { FilingsPanel } from './insights/FilingsPanel';
import { NewsPanel } from './insights/NewsPanel';
import { NotesPanel } from './insights/NotesPanel';

type InsightTab = 'news' | 'filings' | 'transcript' | 'management' | 'notes';

interface OpenBBInsightsPanelProps {
  ticker: string;
}

const TABS: { key: InsightTab; label: string }[] = [
  { key: 'news', label: 'News' },
  { key: 'filings', label: 'Filings' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'management', label: 'Mgmt' },
  { key: 'notes', label: 'Notes' },
];

export function OpenBBInsightsPanel({ ticker }: OpenBBInsightsPanelProps) {
  const [subTab, setSubTab] = useState<InsightTab>('news');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tab pill row */}
      <div className="flex gap-1 p-2 overflow-x-auto border-b border-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              subTab === key
                ? 'bg-primary/20 text-primary'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto">
        {subTab === 'news' && <NewsPanel ticker={ticker} />}
        {subTab === 'filings' && <FilingsPanel ticker={ticker} />}
        {subTab === 'transcript' && <TranscriptSummary ticker={ticker} />}
        {subTab === 'management' && <ManagementTeam ticker={ticker} />}
        {subTab === 'notes' && <NotesPanel ticker={ticker} />}
      </div>
    </div>
  );
}
