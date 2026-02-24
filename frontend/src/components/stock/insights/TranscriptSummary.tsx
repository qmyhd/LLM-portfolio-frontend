'use client';

import { useState } from 'react';
import { useTranscript } from '@/hooks/useOpenBB';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

interface TranscriptSummaryProps {
  ticker: string;
}

export function TranscriptSummary({ ticker }: TranscriptSummaryProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState<number | undefined>(undefined);

  const { data, isLoading, error } = useTranscript(ticker, year, quarter);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Year/Quarter selector */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-background-tertiary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:border-primary focus:outline-none"
        >
          {[...Array(5)].map((_, i) => {
            const y = currentYear - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <select
          value={quarter ?? ''}
          onChange={(e) => setQuarter(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-background-tertiary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:border-primary focus:outline-none"
        >
          <option value="">All Quarters</option>
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>
      </div>

      {/* Transcript content */}
      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <div className="text-center text-foreground-muted text-sm py-4">
            Failed to load transcript
          </div>
        )}

        {!error && !data?.transcripts?.length && (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
            <MicrophoneIcon className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No transcripts available</p>
            <p className="text-2xs mt-1">Try a different year or quarter</p>
          </div>
        )}

        {data?.transcripts?.map((transcript, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MicrophoneIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {transcript.symbol} — {transcript.year ? `${transcript.year}` : ''}
                {transcript.quarter ? ` Q${transcript.quarter}` : ''}
              </span>
              {transcript.date && (
                <span className="text-2xs text-foreground-subtle">{transcript.date}</span>
              )}
            </div>
            <div className="bg-background-tertiary rounded-lg p-3 max-h-96 overflow-y-auto">
              <p className="text-xs text-foreground-muted whitespace-pre-wrap leading-relaxed">
                {transcript.content.length > 5000
                  ? transcript.content.slice(0, 5000) + '...'
                  : transcript.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
