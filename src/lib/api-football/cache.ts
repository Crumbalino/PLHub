/**
 * API-Football Cache Utility
 * Generic caching layer using Supabase
 * Implements: check cache -> fetch if expired -> upsert fresh data
 */

import { createServerClient } from '@/lib/supabase'

interface CachedEntry {
  data: unknown
  expires_at: string
}

/**
 * Get cached data or fetch fresh if expired
 * @param cacheKey Unique cache key (e.g., 'standings:39:2025')
 * @param fetchFn Async function that fetches fresh data
 * @param ttlSeconds Time to live in seconds
 * @returns The cached or fresh data
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const supabase = createServerClient()
  const now = new Date()

  // 1. Check cache
  try {
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single()

    // 2. If cached and not expired, return it
    if (cached) {
      const expiresAt = new Date(cached.expires_at)
      if (expiresAt > now) {
        return cached.data as T
      }
    }
  } catch (err) {
    // Cache miss is normal, continue to fetch
  }

  // 3. Fetch fresh data
  const freshData = await fetchFn()

  // 4. Upsert into cache
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000)

  try {
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: freshData,
      cached_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      source: 'api-football',
    })
  } catch (err) {
    console.error(`[Cache] Failed to cache ${cacheKey}:`, err)
    // Continue anyway — fresh data is still valid, just not cached
  }

  return freshData
}

/**
 * Invalidate cache entry immediately
 * Used when fresh data needs to be fetched regardless of TTL
 */
export async function invalidateCache(cacheKey: string): Promise<void> {
  const supabase = createServerClient()
  try {
    await supabase.from('api_cache').delete().eq('cache_key', cacheKey)
  } catch (err) {
    console.error(`[Cache] Failed to invalidate ${cacheKey}:`, err)
  }
}

/**
 * Clear all API-Football cache entries
 * Use with caution — typically only needed for testing
 */
export async function clearApiFootballCache(): Promise<void> {
  const supabase = createServerClient()
  try {
    await supabase
      .from('api_cache')
      .delete()
      .eq('source', 'api-football')
  } catch (err) {
    console.error('[Cache] Failed to clear cache:', err)
  }
}

/**
 * Get cache statistics
 * For monitoring and debugging
 */
export async function getCacheStats(): Promise<{
  total: number
  expired: number
  fresh: number
}> {
  const supabase = createServerClient()
  const now = new Date()

  try {
    const { data } = await supabase
      .from('api_cache')
      .select('expires_at')
      .eq('source', 'api-football')

    if (!data) return { total: 0, expired: 0, fresh: 0 }

    const expired = data.filter((row) => new Date(row.expires_at) <= now).length
    const fresh = data.length - expired

    return { total: data.length, expired, fresh }
  } catch (err) {
    console.error('[Cache] Failed to get stats:', err)
    return { total: 0, expired: 0, fresh: 0 }
  }
}
