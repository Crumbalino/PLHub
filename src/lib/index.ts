// ============================================================
// PLHub Shared Library — Barrel Export
// import { transformPost, sortPosts, COLORS } from '@/lib'
// ============================================================

// Types
export type {
  Club,
  Post,
  FeedPost,
  TrendingPost,
  ClubBadge,
  HeatLabel,
  SortMode,
  SourceInfo,
  FeedResponse,
  TrendingResponse,
  DigestResponse,
  Digest,
} from './types'

// Scoring
export {
  calculatePLHubIndex,
  calculateRecencyScore,
  calculateHeatLabel,
  sortPosts,
  getIndexColor,
  getIndexComponents,
} from './scoring'

// Clubs
export {
  CLUBS,
  CLUBS_BY_SLUG,
  CLUBS_BY_SUBREDDIT,
  CLUB_CODES,
  getClubCode,
  detectAllClubs,
  toClubBadges,
} from './clubs'

// Sources
export { getSourceInfo, getSourceBorderColor } from './sources'

// Formatting
export {
  decodeHtmlEntities,
  stripMarkdown,
  getTimeDisplay,
  getReadTimeLabel,
  getPreviewBlurb,
  formatSummaryForDisplay,
  isValidImageUrl,
  upgradeImageUrl,
} from './formatting'

// Content Filter
export { filterPLContent, deduplicatePosts, ALWAYS_HIDE, PL_CLUBS } from './content-filter'

// Transform
export { transformPost, transformPosts, transformTrendingPosts } from './transform'

// Constants & Design Tokens
export { COLORS, SOURCE_COLORS, SOURCE_LOGOS, FEED, SCORING, ANIMATION } from './constants'
