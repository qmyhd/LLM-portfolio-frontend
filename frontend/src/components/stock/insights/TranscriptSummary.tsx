'use client';

import { useState } from 'react';
import { useTranscript } from '@/hooks/useOpenBB';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';

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
      <div className="p-4 space-y-3">
        <Skeleton.Line className="h-4 w-40" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-5/6" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-4/5" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Year/Quarter selector */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <Select
          value={String(year)}
          onChange={(v) => setYear(Number(v))}
          options={[...Array(5)].map((_, i) => {
            const y = currentYear - i;
            return { value: String(y), label: String(y) };
          })}
          size="sm"
        />
        <Select
          value={quarter != null ? String(quarter) : ''}
          onChange={(v) => setQuarter(v ? Number(v) : undefined)}
          options={[
            { value: '', label: 'All Quarters' },
            { value: '1', label: 'Q1' },
            { value: '2', label: 'Q2' },
            { value: '3', label: 'Q3' },
            { value: '4', label: 'Q4' },
          ]}
          size="sm"
        />
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
