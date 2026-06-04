'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { TranscriptSegment } from '@/types/research';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  activeIndex: number;
  selectedRange: [number, number] | null;
  onSeek: (start: number) => void;
  onToggleSelect: (index: number) => void;
}

export function TranscriptViewer({
  segments,
  activeIndex,
  selectedRange,
  onSeek,
  onToggleSelect,
}: TranscriptViewerProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  if (segments.length === 0) {
    return <p className="text-sm text-foreground-muted p-4">No transcript segments.</p>;
  }

  const inSel = (i: number) =>
    selectedRange != null && i >= selectedRange[0] && i <= selectedRange[1];

  return (
    <div className="space-y-0.5 overflow-y-auto max-h-[70vh] pr-1">
      {segments.map((seg, i) => (
        <div
          key={`${seg.start}-${i}`}
          ref={i === activeIndex ? activeRef : undefined}
          className={clsx(
            'flex gap-2 px-1 py-1 rounded items-start',
            inSel(i) && 'bg-primary/10 border-l-2 border-primary',
            i === activeIndex && !inSel(i) && 'bg-background-hover',
          )}
        >
          <button
            type="button"
            aria-label={inSel(i) ? 'Deselect line' : 'Select line'}
            onClick={() => onToggleSelect(i)}
            className={clsx(
              'mt-1 h-4 w-4 shrink-0 rounded-sm border transition-colors',
              inSel(i) ? 'bg-primary border-primary' : 'border-border hover:border-primary',
            )}
          />
          <button
            type="button"
            onClick={() => onSeek(seg.start)}
            className="text-left flex gap-2 text-sm text-foreground-muted hover:text-foreground"
          >
            <span className="font-mono text-xs text-foreground-subtle shrink-0 tabular-nums">
              {fmt(seg.start)}
            </span>
            <span>{seg.text}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
