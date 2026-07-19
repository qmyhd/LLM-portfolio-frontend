'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useResolveVideo } from '@/hooks/useResearch';
import { VideoPlayer } from '@/components/research/VideoPlayer';
import { TranscriptViewer } from '@/components/research/TranscriptViewer';
import { CaptureDrawer, type QuoteDraft } from '@/components/research/CaptureDrawer';
import { QuoteLibrary } from '@/components/research/QuoteLibrary';
import { groupSegments } from '@/lib/transcript';
import { usePrivacy } from '@/hooks/usePrivacy';
import type { ResolvedVideo } from '@/types/research';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ResearchWorkspacePage() {
  const { canWrite } = usePrivacy();
  const { resolve, isResolving, error } = useResolveVideo();
  const [tab, setTab] = useState<'watch' | 'library'>('watch');
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState<ResolvedVideo | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1); // original segment index
  const seekRef = useRef<((s: number) => void) | null>(null);

  // Selection is over DISPLAY ROWS (grouped); anchor/range are row indexes.
  const [anchor, setAnchor] = useState<number | null>(null);
  const [range, setRange] = useState<[number, number] | null>(null);
  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  // Grouped, readable rows derived from the raw caption segments.
  const rows = useMemo(() => (video ? groupSegments(video.segments) : []), [video]);

  // Map the active original-segment index to its display row.
  const activeRowIndex = useMemo(() => {
    if (activeIndex < 0) return -1;
    return rows.findIndex((r) => activeIndex >= r.startIdx && activeIndex <= r.endIdx);
  }, [rows, activeIndex]);

  const clearSel = useCallback(() => {
    setAnchor(null);
    setRange(null);
  }, []);

  const load = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setActiveIndex(-1);
    seekRef.current = null;
    clearSel();
    setDraft(null);
    const v = await resolve(trimmed);
    if (v) setVideo(v);
  };

  const registerSeek = useCallback((fn: (s: number) => void) => {
    seekRef.current = fn;
  }, []);

  const onTime = useCallback((t: number) => {
    setVideo((cur) => {
      if (!cur) return cur;
      let idx = -1;
      for (let i = 0; i < cur.segments.length; i++) {
        if (cur.segments[i].start <= t) idx = i;
        else break;
      }
      setActiveIndex(idx);
      return cur;
    });
  }, []);

  // Click a row: plain click selects (or toggles off a sole selection);
  // shift-click extends the range from the anchor.
  const onRowClick = (i: number, shiftKey: boolean) => {
    if (shiftKey && anchor !== null) {
      setRange([Math.min(anchor, i), Math.max(anchor, i)]);
      return;
    }
    if (range && range[0] === i && range[1] === i) {
      clearSel();
      return;
    }
    setAnchor(i);
    setRange([i, i]);
  };

  // Escape clears the current selection.
  useEffect(() => {
    if (!range) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [range, clearSel]);

  const openDrawer = () => {
    if (!range) return;
    const selectedRows = rows.slice(range[0], range[1] + 1);
    if (selectedRows.length === 0) return;
    const first = selectedRows[0];
    const last = selectedRows[selectedRows.length - 1];
    setDraft({
      quoteText: selectedRows.map((r) => r.text).join(' '),
      startSeconds: first.start, // = video.segments[first.startIdx].start
      endSeconds: last.end, // = video.segments[last.endIdx].start + duration
    });
  };

  const onSaved = () => {
    setDraft(null);
    clearSel();
    setSavedMsg(true);
    window.setTimeout(() => setSavedMsg(false), 2500);
  };

  const selCount = range ? range[1] - range[0] + 1 : 0;
  const selStart = range ? rows[range[0]]?.start : undefined;
  const selEnd = range ? rows[range[1]]?.end : undefined;
  const tabClass = (t: 'watch' | 'library') =>
    clsx('px-3 py-2 text-sm', tab === t ? 'border-b-2 border-primary text-foreground' : 'text-foreground-muted');

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Video Research</h1>
              <p className="text-foreground-muted">
                Paste a YouTube URL, then highlight transcript passages to save as quotes.
              </p>
            </div>

            <div className="flex gap-2 border-b border-border">
              <button type="button" onClick={() => setTab('watch')} className={tabClass('watch')}>Watch</button>
              <button type="button" onClick={() => setTab('library')} className={tabClass('library')}>Library</button>
            </div>

            {tab === 'watch' && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') load();
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-background-secondary border border-border rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={load}
                    disabled={isResolving || !url.trim()}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isResolving ? 'Loading…' : 'Load'}
                  </button>
                </div>

                {error && <p className="text-sm text-loss">{error.message}</p>}
                {savedMsg && <p className="text-sm text-primary">Quote saved.</p>}

                {!video && !isResolving && (
                  <div className="card p-8 text-center">
                    <p className="text-sm text-foreground-muted">Paste a YouTube URL above to begin.</p>
                  </div>
                )}

                {video && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <VideoPlayer videoId={video.videoId} onTime={onTime} registerSeek={registerSeek} />
                      {video.title && <p className="text-sm font-medium text-foreground">{video.title}</p>}
                      {video.channelName && <p className="text-xs text-foreground-muted">{video.channelName}</p>}
                    </div>

                    {/* Transcript reader + floating selection toolbar */}
                    <div className="card p-0 flex flex-col relative overflow-hidden">
                      <div className="p-3">
                        {video.transcriptAvailable ? (
                          <TranscriptViewer
                            rows={rows}
                            activeRowIndex={activeRowIndex}
                            selectedRange={range}
                            onSeek={(s) => seekRef.current?.(s)}
                            onRowClick={onRowClick}
                          />
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-sm font-medium text-foreground-muted">No transcript available.</p>
                            {video.reason && (
                              <p className="text-xs text-foreground-subtle mt-1">({video.reason})</p>
                            )}
                          </div>
                        )}
                      </div>

                      {selCount > 0 && (
                        <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-background/95 backdrop-blur">
                          <span className="text-xs text-foreground-muted tabular-nums">
                            {selStart != null && selEnd != null ? `${fmt(selStart)}–${fmt(selEnd)}` : ''}
                            <span className="text-foreground-subtle"> · {selCount} line{selCount > 1 ? 's' : ''}</span>
                          </span>
                          <div className="flex gap-2">
                            {canWrite && (
                              <button type="button" onClick={openDrawer} className="btn-primary text-xs">
                                Save quote
                              </button>
                            )}
                            <button type="button" onClick={clearSel} className="btn-ghost text-xs">
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'library' && <QuoteLibrary />}
          </div>
        </main>
      </div>

      {draft && video && (
        <CaptureDrawer video={video} draft={draft} onClose={() => setDraft(null)} onSaved={onSaved} />
      )}
    </div>
  );
}
