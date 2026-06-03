'use client';

import { useCallback, useRef, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useResolveVideo } from '@/hooks/useResearch';
import { VideoPlayer } from '@/components/research/VideoPlayer';
import { TranscriptViewer } from '@/components/research/TranscriptViewer';
import type { ResolvedVideo } from '@/types/research';

export default function ResearchWorkspacePage() {
  const { resolve, isResolving, error } = useResolveVideo();
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState<ResolvedVideo | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const seekRef = useRef<((s: number) => void) | null>(null);

  const load = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setActiveIndex(-1);
    seekRef.current = null;
    const v = await resolve(trimmed);
    if (v) setVideo(v);
  };

  const registerSeek = useCallback((fn: (s: number) => void) => {
    seekRef.current = fn;
  }, []);

  const onTime = useCallback(
    (t: number) => {
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
    },
    [],
  );

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
                Paste a YouTube URL to watch alongside its transcript.
              </p>
            </div>

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

            {!video && !isResolving && (
              <div className="card p-8 text-center">
                <p className="text-sm text-foreground-muted">
                  Paste a YouTube URL above to begin.
                </p>
              </div>
            )}

            {video && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <VideoPlayer videoId={video.videoId} onTime={onTime} registerSeek={registerSeek} />
                  {video.title && <p className="text-sm font-medium text-foreground">{video.title}</p>}
                  {video.channelName && (
                    <p className="text-xs text-foreground-muted">{video.channelName}</p>
                  )}
                </div>
                <div className="card p-3">
                  {video.transcriptAvailable ? (
                    <TranscriptViewer
                      segments={video.segments}
                      activeIndex={activeIndex}
                      onSeek={(s) => seekRef.current?.(s)}
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
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
