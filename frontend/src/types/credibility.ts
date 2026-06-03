export interface CredibilityCategory {
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
}

export interface PersonTier {
  categorySlug: string;
  tier: string; // S/A/B/C/D
  muted: boolean;
  rationale: string | null;
}

export interface SourceIdentity {
  id: number;
  platform: string; // twitter/discord/youtube
  platformUserId: string;
  handle: string | null;
  matchStatus: string; // confirmed/suggested/unmatched/conflict
}

export interface PersonDetail {
  id: number;
  fullName: string;
  displayName: string | null;
  role: string | null;
  bio: string | null;
  notes: string | null;
  status: string;
  updatedAt: string | null;
  tiers: PersonTier[];
  identities: SourceIdentity[];
}

export interface PersonListItem {
  id: number;
  fullName: string;
  displayName: string | null;
  role: string | null;
  status: string;
  updatedAt: string | null;
  needsAttention: boolean;
}

export interface PersonRevision {
  snapshot: unknown;
  createdAt: string | null;
}

export interface UnmatchedIdentity {
  kind: string; // "flagged" | "discord_unattributed"
  id: number | null;
  personId: number | null;
  platform: string;
  platformUserId: string;
  handle: string | null;
  matchStatus: string | null;
}

export interface TopicTag {
  categorySlug: string;
  weight: number;
}

export interface PersonBodyInput {
  fullName: string;
  displayName?: string | null;
  role?: string | null;
  bio?: string | null;
  notes?: string | null;
  status?: string;
  tiers: PersonTier[];
}

// Sentiment-agent credibility breakdown (from analysis metrics.credibility)
export interface CredibilityContributor {
  author_id: string;
  person: string | null;
  tiers: Record<string, string>;
  effective_mult: number;
}

export interface CredibilityBreakdown {
  baseline_score: number;
  adjusted_score: number;
  delta: number;
  contributors: CredibilityContributor[];
}
