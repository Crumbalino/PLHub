/**
 * API-Football Base Client
 * Handles authentication and request/response wrapping
 * Base URL: https://v3.football.api-sports.io
 */

const BASE_URL = 'https://v3.football.api-sports.io'

interface ApiFootballResponse<T> {
  get: string
  parameters: Record<string, unknown>
  errors: unknown[]
  results: number
  paging: {
    current: number
    total: number
  }
  response: T
}

/**
 * Make an authenticated request to API-Football
 * @param endpoint The endpoint path (e.g., '/standings')
 * @param params Query parameters as record
 * @returns The response data
 * @throws Error on API errors or network failure
 */
export async function fetchFromApiFootball<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY not configured in environment')
  }

  // Build query string
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value))
  })

  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(
        `API-Football request failed: ${response.status} ${response.statusText}`
      )
    }

    const data = (await response.json()) as ApiFootballResponse<T>

    // Check for API errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('[API-Football] API returned errors:', data.errors)
      throw new Error('API-Football returned errors')
    }

    return data.response
  } catch (err) {
    console.error('[API-Football] Error fetching', endpoint, err)
    throw err
  }
}
