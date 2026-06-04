'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { DisplayRow } from '@/lib/transcript';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TranscriptViewerProps {
  rows: DisplayRow[];
  activeRowIndex: number;
  selectedRange: [number, number] | null;
  onSeek: (start: number) => void;
  onRowClick: (index: number, shiftKey: boolean) => void;
}

export function TranscriptViewer({
  rows,
  activeRowIndex,
  selectedRange,
  onSeek,
  onRowClick,
}: TranscriptViewerProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeRowIndex]);

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-muted p-4">No transcript segments.</p>;
  }

  const inSel = (i: number) =>
    selectedRange != null && i >= selectedRange[0] && i <= selectedRange[1];

  return (
    <div className="overflow-y-auto max-h-[68vh] pr-1 space-y-0.5">
      {rows.map((row, i) => {
        const selected = inSel(i);
        const active = i === activeRowIndex;
        return (
          <div
            key={`${row.start}-${i}`}
            ref={active ? activeRef : undefined}
            className={clsx(
              'group flex gap-2 rounded-md px-2 py-1.5 border-l-2 transition-colors',
              selected
                ? 'bg-primary/10 border-primary'
                : active
                  ? 'bg-background-hover/60 border-foreground-subtle/40'
                  : 'border-transparent hover:bg-background-hover',
            )}
          >
            <button
              type="button"
              onClick={() => onSeek(row.start)}
              title="Jump to this moment"
              className="shrink-0 self-start font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-background-secondary text-foreground-subtle hover:text-primary hover:bg-primary/10"
            >
              {active ? '▶ ' : ''}
              {fmt(row.start)}
            </button>
            <button
              type="button"
              onClick={(e) => onRowClick(i, e.shiftKey)}
              title="Click to select; shift-click to extend"
              className={clsx(
                'text-left text-sm leading-relaxed flex-1 cursor-text',
                selected ? 'text-foreground' : 'text-foreground-muted group-hover:text-foreground',
              )}
            >
              {row.text}
            </button>
          </div>
        );
      })}
    </div>
  );
}
