# API-Football Integration

Complete integration with [API-Football.com](https://api-football.com) for Premier League data. Includes caching strategy, endpoint wrappers, and TypeScript interfaces.

## Setup

### Environment Variables

Add to `.env.local`:

```env
API_FOOTBALL_KEY=your_api_key_from_api-football.com
```

### Database Migration

Run the SQL migration to create cache tables:

```sql
-- See migrations/add-api-football-tables.sql
```

## Architecture

### Modules

- **`client.ts`** — Base HTTP client with authentication
- **`cache.ts`** — Generic caching layer (Supabase + TTL)
- **`team-ids.ts`** — Club slug ↔ API team ID mapping
- **`standings.ts`** — League table endpoint
- **`fixtures.ts`** — Matches and fixture scheduling
- **`match-stats.ts`** — Post-match statistics
- **`team-stats.ts`** — Season statistics per team
- **`top-scorers.ts`** — Golden Boot race data
- **`head-to-head.ts`** — Historical meetings between teams
- **`index.ts`** — Unified exports

## Usage Examples

### Get League Standings

```typescript
import { getStandingsTable } from '@/lib/api-football'

const table = await getStandingsTable()
// Returns: TeamStanding[]
```

### Get Today's Matches

```typescript
import { getTodaysMatches } from '@/lib/api-football'

const matches = await getTodaysMatches()
// Returns: Fixture[]
```

### Get Post-Match Stats

```typescript
import { getFixtureStats } from '@/lib/api-football'

const stats = await getFixtureStats(1234567) // fixture ID
// Returns: FixtureStatsResponse
```

### Get Team Season Stats

```typescript
import { getTeamStats, getTeamId } from '@/lib/api-football'

const stats = await getTeamStats(getTeamId('arsenal'))
// Returns: TeamStatsResponse with goals, clean sheets, form, etc.
```

### Get Head-to-Head

```typescript
import { getH2H, getTeamId } from '@/lib/api-football'

const h2h = await getH2H(
  getTeamId('arsenal'),
  getTeamId('manchester-united')
)
// Returns: H2HResponse with last 10 meetings and record
```

## Caching Strategy

### Cache Flow

```
Request → Check Supabase cache → If expired, fetch API
          ↓ If cached and fresh
        Return cached data
```

### TTL by Endpoint

| Endpoint | TTL | Calls/Day | Use Case |
|----------|-----|-----------|----------|
| Standings | 6h | ~4 | League table updates |
| Fixtures | 5m (match days), 6h (quiet) | ~10 | Live scores, upcoming |
| Match Stats | ∞ | ~10 (post-match) | Post-match analysis |
| Team Stats | 12h | ~2 | Season context |
| Top Scorers | 12h | ~2 | Golden Boot race |
| Head-to-Head | 24h | ~2 | Pre-match context |

### Daily Budget

- **Worst case** (match day with 10 fixtures): ~32 calls
- **Quiet day**: ~10-12 calls
- **Limit**: 100/day (free tier)
- **Headroom**: ~60-70% utilization

## Cron Jobs (Recommended)

### Job 1: Stats Refresh (Every 6 hours)

```typescript
// GET /api/cron/refresh-stats
// Refreshes: standings, top scorers
// ~6 API calls
```

### Job 2: Fixture Refresh (Every 15 min on match days, 6h otherwise)

```typescript
// GET /api/cron/refresh-fixtures
// Refreshes: today's fixtures, live scores
// ~2-4 API calls
```

### Job 3: Post-Match Stats (23:00 on match days)

```typescript
// GET /api/cron/post-match-stats
// Fetches: fixture statistics for completed matches
// Generates: By The Numbers tiles via Anthropic API
// ~10-12 API calls + 1 Anthropic call
```

## Team ID Mapping

Maps club slugs to API-Football team IDs:

```typescript
import { TEAM_IDS, getTeamId } from '@/lib/api-football'

getTeamId('arsenal') // → 42
TEAM_IDS['liverpool'] // → 40
```

## Type Safety

Full TypeScript interfaces for all endpoints:

```typescript
import type { Fixture, TeamStanding, H2HResponse } from '@/lib/api-football'

const table: TeamStanding[] = await getStandingsTable()
const matches: Fixture[] = await getTodaysMatches()
const h2h: H2HResponse = await getH2H(42, 40)
```

## Error Handling

All functions throw on error:

```typescript
try {
  const table = await getStandingsTable()
} catch (err) {
  console.error('Failed to fetch standings:', err)
  // Handle gracefully in UI
}
```

## Monitoring

### Cache Statistics

```typescript
import { getCacheStats } from '@/lib/api-football'

const stats = await getCacheStats()
// { total: 15, expired: 2, fresh: 13 }
```

### Clear Cache (Testing)

```typescript
import { clearApiFootballCache } from '@/lib/api-football'

await clearApiFootballCache() // Clears all API-Football cache
```

## Notes

- **Team IDs**: Verify against API when season changes (promotions/relegations)
- **Fixture Rounds**: Grouped by `league.round` value (e.g., "Regular Season - 1")
- **Stats Availability**: Match stats only available for completed fixtures
- **Head-to-Head**: Last 10 meetings by default, customize with `last` parameter
- **Form String**: Returned as "WWDLW" format (wins/draws/losses last 5)

## References

- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [Team IDs Verification](https://api-football.com/league)
- [Supabase Docs](https://supabase.com/docs)
