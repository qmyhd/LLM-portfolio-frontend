'use client';

import { useEffect, useRef, useState } from 'react';

// Minimal typings for the YouTube IFrame Player API (avoid `any`).
interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}
interface YTPlayerCtor {
  new (el: HTMLElement, opts: {
    videoId: string;
    events?: { onReady?: () => void };
  }): YTPlayer;
}
interface YTApi {
  Player: YTPlayerCtor;
  PlayerState: { PLAYING: number };
}
type YTWindow = Window & {
  YT?: YTApi;
  onYouTubeIframeAPIReady?: () => void;
};

let _apiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  const w = window as YTWindow;
  if (w.YT && w.YT.Player) return Promise.resolve();
  if (_apiPromise) return _apiPromise;
  _apiPromise = new Promise<void>((resolve, reject) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => reject(new Error('YT API failed to load'));
    document.body.appendChild(tag);
    window.setTimeout(() => reject(new Error('YT API timeout')), 8000);
  });
  return _apiPromise;
}

interface VideoPlayerProps {
  videoId: string;
  onTime?: (seconds: number) => void;
  registerSeek?: (seek: (seconds: number) => void) => void;
}

export function VideoPlayer({ videoId, onTime, registerSeek }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onTimeRef = useRef(onTime);
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    onTimeRef.current = onTime;
  }, [onTime]);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    loadYouTubeAPI()
      .then(() => {
        const w = window as YTWindow;
        if (cancelled || !containerRef.current || !w.YT) return;
        playerRef.current = new w.YT.Player(containerRef.current, {
          videoId,
          events: {
            onReady: () => {
              registerSeek?.((s: number) => {
                try {
                  playerRef.current?.seekTo(s, true);
                } catch {
                  /* ignore */
                }
              });
              poll = setInterval(() => {
                try {
                  const p = playerRef.current;
                  if (p && p.getPlayerState() === w.YT?.PlayerState.PLAYING) {
                    onTimeRef.current?.(p.getCurrentTime());
                  }
                } catch {
                  /* ignore */
                }
              }, 250);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setDegraded(true);
      });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, registerSeek]);

  if (degraded) {
    // Graceful fallback: plain embed (no JS sync/seek), still watchable.
    return (
      <iframe
        className="w-full aspect-video rounded-lg border border-border"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden border border-border">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
