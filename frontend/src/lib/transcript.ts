import type { TranscriptSegment } from '@/types/research';

/**
 * A readable display row built from one or more adjacent transcript segments.
 * Original segment indexes are preserved so saved quotes use accurate timings.
 */
export interface DisplayRow {
  text: string;
  start: number; // first segment's start
  end: number; // last segment's start + duration
  startIdx: number; // original segment index (first)
  endIdx: number; // original segment index (last)
}

const MAX_CHARS = 160;
const MAX_DURATION_S = 12;
// Sentence-ending punctuation, allowing a trailing quote/bracket.
const ENDS_SENTENCE = /[.!?]["')\]]?\s*$/;

/**
 * Group very short caption segments into readable rows. A row closes once the
 * grouped text ends a sentence, exceeds ~160 chars, or spans more than ~12s.
 */
export function groupSegments(segments: TranscriptSegment[]): DisplayRow[] {
  const rows: DisplayRow[] = [];
  let parts: string[] = [];
  let start = 0;
  let end = 0;
  let startIdx = 0;

  const flush = (endIdx: number) => {
    if (parts.length === 0) return;
    rows.push({
      text: parts.join(' ').replace(/\s+/g, ' ').trim(),
      start,
      end,
      startIdx,
      endIdx,
    });
    parts = [];
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (parts.length === 0) {
      start = seg.start;
      startIdx = i;
    }
    parts.push(seg.text);
    end = seg.start + seg.duration;

    const joined = parts.join(' ');
    const dur = end - start;
    if (ENDS_SENTENCE.test(seg.text.trim()) || joined.length > MAX_CHARS || dur > MAX_DURATION_S) {
      flush(i);
    }
  }
  flush(segments.length - 1);
  return rows;
}
