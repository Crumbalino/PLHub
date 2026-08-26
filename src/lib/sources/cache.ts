/**
 * Shared caching + fail-soft fetch for the §6 source adapters.
 *
 * Every adapter in this directory obeys two rules from the build brief:
 *
 *   1. Cache aggressively. These are public endpoints with no key and no quota
 *      contract, so the polite ceiling is our own. A cold page build touches
 *      each upstream once; everything after that is served from memory until
 *      the TTL lapses.
 *   2. Fail soft. Nothing here throws. A dead upstream returns null and the
 *      block does not render (PAGE_SPEC §15). A source adapter must never be
 *      able to 500 the page.
 *
 * The cache is a per-process Map. On Vercel that means per warm lambda, which
 * is exactly the right granularity: it collapses the fan-out inside a single
 * request (the snapshot route reads bootstrap-static four times) and survives
 * across requests on a warm instance. It is deliberately not Supabase-backed —
 * a cache that can fail is a second failure mode for no benefit.
 */

interface Entry<T> {
  value: T
  /** Epoch ms after which this entry is stale. */
  expires: number
}

const store = new Map<string, Entry<unknown>>()

/** In-flight requests, so N concurrent callers cause one upstream hit. */
const inflight = new Map<string, Promise<unknown>>()

/** Read a live entry, or undefined if absent or expired. Pure w.r.t. `now`. */
export function cacheGet<T>(key: string, now: number = Date.now()): T | undefined {
  const hit = store.get(key)
  if (!hit) return undefined
  if (hit.expires <= now) {
    store.delete(key)
    return undefined
  }
  return hit.value as T
}

/** Write an entry with a TTL. Pure w.r.t. `now`. */
export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs: number,
  now: number = Date.now()
): void {
  store.set(key, { value, expires: now + ttlMs })
}

/** Drop everything. Tests use this to force a cold read. */
export function cacheClear(): void {
  store.clear()
  inflight.clear()
}

/** Entry count, for assertions about cache behaviour. */
export function cacheSize(): number {
  return store.size
}

export interface FetchOptions {
  /** How long a successful response stays warm. */
  ttlMs: number
  /** Extra request headers — pulselive needs an Origin, FPL wants a UA. */
  headers?: Record<string, string>
  /** Abort after this long. Default 8s: slower than that and the block is better off absent. */
  timeoutMs?: number
  /** Override the cache key. Defaults to the URL. */
  key?: string
  /**
   * How to read the body. Defaults to JSON.
   *
   * 'text' returns the raw string, for sources that are not JSON —
   * football-data.co.uk serves CSV. The caching, single-flight and fail-soft
   * behaviour is identical either way, which is the point of putting it here
   * rather than writing a second fetcher.
   */
  parse?: 'json' | 'text'
}

/**
 * GET JSON, cached, never throwing.
 *
 * Returns null for every failure mode — network error, timeout, non-2xx,
 * malformed body. Callers branch on null; they never try/catch.
 *
 * Failures are deliberately NOT cached. A 503 is usually transient and a
 * negative cache would extend a blip into a TTL-long outage of the block.
 */
export async function fetchJson<T>(url: string, opts: FetchOptions): Promise<T | null> {
  const key = opts.key ?? url

  const cached = cacheGet<T>(key)
  if (cached !== undefined) return cached

  const pending = inflight.get(key)
  if (pending) return pending as Promise<T | null>

  const request = (async (): Promise<T | null> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000)
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...opts.headers },
        signal: controller.signal,
        cache: 'no-store',
      })
      // Always read the body to completion, including on a failure path.
      // `res.json()` on a non-JSON body throws mid-stream and leaves the
      // response undrained, which holds the underlying socket open — Reddit
      // answers a block with a 190KB HTML page, and leaking one connection per
      // blocked request is how a warm lambda runs out of them.
      const text = await res.text()

      if (!res.ok) {
        console.error(`[sources] ${res.status} from ${url}`)
        return null
      }

      const body = (opts.parse === 'text' ? text : JSON.parse(text)) as T
      cacheSet(key, body, opts.ttlMs)
      return body
    } catch (err) {
      console.error(`[sources] fetch failed for ${url}:`, err)
      return null
    } finally {
      clearTimeout(timer)
      inflight.delete(key)
    }
  })()

  inflight.set(key, request)
  return request
}
