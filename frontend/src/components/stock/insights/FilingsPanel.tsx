'use client';

import { useState } from 'react';
import { useFilings } from '@/hooks/useOpenBB';
import { DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface FilingsPanelProps {
  ticker: string;
}

const FORM_TYPES = [
  { value: '', label: 'All' },
  { value: '10-K', label: '10-K' },
  { value: '10-Q', label: '10-Q' },
  { value: '8-K', label: '8-K' },
  { value: '4', label: 'Form 4' },
];

const FORM_COLORS: Record<string, string> = {
  '10-K': 'bg-primary/20 text-primary',
  '10-Q': 'bg-purple-500/20 text-purple-400',
  '8-K': 'bg-amber-500/20 text-amber-400',
  '4': 'bg-cyan-500/20 text-cyan-400',
};

export function FilingsPanel({ ticker }: FilingsPanelProps) {
  const [formType, setFormType] = useState('');
  const { data, isLoading, error } = useFilings(ticker, formType || undefined, 20);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex gap-1 p-2 overflow-x-auto">
        {FORM_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFormType(value)}
            className={`px-2.5 py-1 text-2xs font-medium rounded-md whitespace-nowrap transition-colors ${
              formType === value
                ? 'bg-background-hover text-foreground'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filings list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {error && (
          <div className="text-center text-foreground-muted text-sm py-4">
            Failed to load filings
          </div>
        )}

        {!error && !data?.filings?.length && (
          <div className="text-center text-foreground-muted text-sm py-4">
            No filings found for {ticker}
          </div>
        )}

        {data?.filings?.map((filing, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <DocumentTextIcon className="h-4 w-4 text-foreground-muted flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 text-2xs font-medium rounded ${
                  FORM_COLORS[filing.formType] || 'bg-background-hover text-foreground-muted'
                }`}>
                  {filing.formType}
                </span>
                {filing.filingDate && (
                  <span className="text-2xs text-foreground-subtle">{filing.filingDate}</span>
                )}
              </div>
              {filing.description && (
                <p className="text-xs text-foreground-muted mt-1 line-clamp-2">{filing.description}</p>
              )}
            </div>
            {filing.reportUrl && (
              <a
                href={filing.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-background-tertiary transition-colors flex-shrink-0"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-foreground-muted hover:text-primary" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
