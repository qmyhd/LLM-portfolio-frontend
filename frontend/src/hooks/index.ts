/**
 * Custom hooks for data fetching with polling support.
 */

export { usePortfolio, type PortfolioData } from './usePortfolio';
export { useIdeas, type IdeasData } from './useIdeas';
export { useUserIdeas } from './useUserIdeas';
export { useMovers } from './useMovers';
export { useActivities } from './useActivities';
export { useSparklines } from './useSparklines';
export { useStockProfile } from './useStockProfile';
export { useThesisProfile } from './useThesisProfile';
export { useOrders } from './useOrders';
export { useSentiment } from './useSentiment';
export { useStockActivities } from './useStockActivities';
export { useTimeRange, type TimeRange } from './useTimeRange';
export { useLiveUpdates } from './useLiveUpdates';
export {
  useTranscript, useManagement, useFundamentals,
  useFilings, useNews, useNotes,
} from './useOpenBB';
export {
  usePeople, usePerson, usePersonRevisions, useUnmatchedIdentities,
  useCredibilityCategories, useTierMultipliers, useTopicTags,
} from './useCredibility';
export { useResolveVideo, useQuotes } from './useResearch';
