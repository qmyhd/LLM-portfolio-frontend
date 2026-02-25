/**
 * TypeScript types for the unified Ideas feature.
 */

export type IdeaSource = 'discord' | 'manual' | 'transcribe';
export type IdeaStatus = 'draft' | 'refined' | 'archived';

export interface UserIdea {
  id: string;
  symbol: string | null;
  symbols: string[];
  content: string;
  source: IdeaSource;
  status: IdeaStatus;
  tags: string[];
  originMessageId: string | null;
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
}

export interface RefineResponse {
  refinedContent: string;
  extractedSymbols: string[];
  suggestedTags: string[];
  changesSummary: string;
}

export interface IdeasFilters {
  symbol?: string;
  tag?: string;
  source?: IdeaSource | '';
  status?: IdeaStatus | '';
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
  dayChangePct: number | null;
  quantity: number;
  equity: number;
}

export interface MoversResponse {
  topGainers: MoverItem[];
  topLosers: MoverItem[];
  source: 'intraday' | 'unrealized';
}
