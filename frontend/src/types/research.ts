export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface ResolvedVideo {
  videoId: string;
  url: string;
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  transcriptAvailable: boolean;
  reason: string | null;
  segments: TranscriptSegment[];
  suggestedPersonId: number | null;
  suggestedPersonName: string | null;
}

export interface Quote {
  id: number;
  videoId: string;
  videoUrl: string;
  videoTitle: string | null;
  channelName: string | null;
  channelUrl: string | null;
  quoteText: string;
  startSeconds: number;
  endSeconds: number | null;
  personId: number | null;
  personName: string | null;
  categorySlug: string | null;
  categoryLabel: string | null;
  ticker: string | null;
  stockThesisProfileId: number | null;
  thesisNote: string | null;
  tags: string[];
  notes: string | null;
  status: string;
  savedAt: string | null;
  updatedAt: string | null;
}

export interface QuoteBodyInput {
  videoId: string;
  videoUrl: string;
  videoTitle?: string | null;
  channelName?: string | null;
  channelUrl?: string | null;
  quoteText: string;
  startSeconds: number;
  endSeconds?: number | null;
  personId?: number | null;
  categorySlug?: string | null;
  ticker?: string | null;
  stockThesisProfileId?: number | null;
  thesisNote?: string | null;
  tags?: string[];
  notes?: string | null;
}

export interface QuoteFilters {
  q?: string;
  person_id?: number;
  category?: string;
  ticker?: string;
  video_id?: string;
  status?: string;
}
