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
  onSeek: (start: number) => void;
}

export function TranscriptViewer({ segments, activeIndex, onSeek }: TranscriptViewerProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  if (segments.length === 0) {
    return <p className="text-sm text-foreground-muted p-4">No transcript segments.</p>;
  }

  return (
    <div className="space-y-0.5 overflow-y-auto max-h-[70vh] pr-1">
      {segments.map((seg, i) => (
        <button
          key={`${seg.start}-${i}`}
          ref={i === activeIndex ? activeRef : undefined}
          onClick={() => onSeek(seg.start)}
          className={clsx(
            'w-full text-left flex gap-2 px-2 py-1 rounded text-sm transition-colors',
            i === activeIndex
              ? 'bg-primary/15 text-foreground'
              : 'text-foreground-muted hover:bg-background-hover',
          )}
        >
          <span className="font-mono text-xs text-foreground-subtle shrink-0 tabular-nums">{fmt(seg.start)}</span>
          <span>{seg.text}</span>
        </button>
      ))}
    </div>
  );
}
