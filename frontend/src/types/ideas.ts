/**
 * TypeScript types for the unified Ideas feature.
 */

export type IdeaSource = 'discord' | 'manual' | 'transcribe' | 'imessage' | 'twitter' | 'x';
export type IdeaStatus = 'draft' | 'refined' | 'archived';
export type ReviewStatus = 'unreviewed' | 'reviewed' | 'needs_review';
export type AttributionKind = 'self' | 'external_person' | 'institution' | 'unknown';

export interface UserIdea {
  id: string;
  symbol: string | null;
  symbols: string[];
  content: string;
  source: IdeaSource;
  status: IdeaStatus;
  tags: string[];
  originMessageId: string | null;
  // Provenance (imported iMessage/X content)
  title: string | null;
  sourceUrl: string | null;
  sourceCreatedAt: string | null;
  author: string | null;
  authorId: string | null;
  platformMessageId: string | null;
  threadKey: string | null;
  sourceMetadata: Record<string, unknown>;
  // Curation
  reviewStatus: ReviewStatus;
  reviewNotes: string | null;
  attributedPersonId: number | null;
  attributionKind: AttributionKind;
  filingType: string | null;
  filingPeriod: string | null;
  institutionName: string | null;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserIdeasResponse {
  ideas: UserIdea[];
  total: number;
  hasMore: boolean;
}

export interface CreateIdeaRequest {
  content: string;
  symbol?: string;
  symbols?: string[];
  tags?: string[];
  status?: IdeaStatus;
  source?: IdeaSource;
}

export interface UpdateIdeaRequest {
  content?: string;
  symbol?: string;
  symbols?: string[];
  tags?: string[];
  status?: IdeaStatus;
  title?: string | null;
  reviewStatus?: ReviewStatus;
  reviewNotes?: string | null;
  attributedPersonId?: number | null;
  attributionKind?: AttributionKind;
  filingType?: string | null;
  filingPeriod?: string | null;
  institutionName?: string | null;
}

// ---------------------------------------------------------------------------
// Timeline + review queue (imported content workflow)
// ---------------------------------------------------------------------------

export interface TimelineResponse {
  ideas: UserIdea[];
  total: number;
}

export interface TimelineFilters {
  source?: IdeaSource | '';
  thread_key?: string;
  author?: string;
  symbol?: string;
  limit?: number;
}

/** A parsed Discord idea plus its source message, from GET /api/parsed-ideas. */
export interface ParsedIdeaReviewItem {
  id: string;
  messageId: string;
  ideaText: string | null;
  ideaSummary: string | null;
  primarySymbol: string | null;
  symbols: string[];
  labels: string[];
  direction: string | null;
  action: string | null;
  isNoise: boolean;
  confidence: number | null;
  parsedAt: string | null;
  reviewStatus: ReviewStatus;
  reviewNotes: string | null;
  attributionKind: AttributionKind;
  attributedPersonId: number | null;
  thesisBucket: string | null;
  filingType: string | null;
  filingPeriod: string | null;
  institutionName: string | null;
  messageContent: string | null;
  messageAuthor: string | null;
  messageChannel: string | null;
  messageCreatedAt: string | null;
}

export interface ParsedIdeasListResponse {
  items: ParsedIdeaReviewItem[];
  total: number;
}

export interface ParsedIdeaCurationRequest {
  labels?: string[];
  primarySymbol?: string | null;
  symbols?: string[];
  ideaSummary?: string | null;
  direction?: string | null;
  action?: string | null;
  reviewStatus?: ReviewStatus;
  reviewNotes?: string | null;
  attributedPersonId?: number | null;
  attributionKind?: AttributionKind;
  thesisBucket?: string | null;
  filingType?: string | null;
  filingPeriod?: string | null;
  institutionName?: string | null;
}

export interface RefineResponse {
  refinedContent: string;
  extractedSymbols: string[];
  suggestedTags: string[];
  changesSummary: string;
  reflectionApplied: boolean;
}

export interface IdeasFilters {
  symbol?: string;
  tag?: string;
  source?: IdeaSource | '';
  status?: IdeaStatus | '';
  review_status?: ReviewStatus | '';
  thread_key?: string;
  attribution_kind?: AttributionKind | '';
  q?: string;
  limit?: number;
  offset?: number;
}

// Movers types
export interface MoverItem {
  symbol: string;
  currentPrice: number;
  previousClose: number | null;
  dayChange: number | null;
  dayChangePct: number | null; // null = no intraday data
  openPnlPct: number; // always present (0.0 if no cost basis)
  quantity: number;
  equity: number;
}

export interface MoversResponse {
  topGainers: MoverItem[];
  topLosers: MoverItem[];
  source: 'intraday' | 'unrealized';
}

// Context types for viewing surrounding Discord messages
export interface ContextMessage {
  messageId: string;
  content: string;
  author: string;
  sentAt: string;
  channel: string;
  isParent: boolean;
}

export interface IdeaContextResponse {
  idea: UserIdea;
  parentMessage: ContextMessage | null;
  contextMessages: ContextMessage[];
}

// Sync response from POST /portfolio/sync (always HTTP 200, stable shape)
export interface SyncResponse {
  status: 'success' | 'partial' | 'error';
  message: string;
  accounts: number;
  balances: number;
  positions: number;
  orders: number;
  activities: number;
  errorCount: number;
  errors: string[];
  accountIdUsed: string | null;
  authError: boolean;
}
