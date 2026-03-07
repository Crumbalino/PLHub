import { NextResponse } from 'next/server'
import { BY_THE_NUMBERS_API_CONFIG, BY_THE_NUMBERS_SYSTEM_PROMPT, type ByTheNumbersResponse } from '@/lib/prompts/by-the-numbers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, any> = {}

  // Check env vars
  results.hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  results.hasFootballKey = !!process.env.FOOTBALL_DATA_API_KEY
  results.modelInConfig = BY_THE_NUMBERS_API_CONFIG.model

  // Test football-data API
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '' },
    })
    results.footballDataStatus = res.status
    results.footballDataOk = res.ok
  } catch (e: any) {
    results.footballDataError = e.message
  }

  // Test Anthropic API with tiny payload
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: BY_THE_NUMBERS_API_CONFIG.model,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Reply with just: {"test": true}' }],
      }),
    })
    results.anthropicStatus = res.status
    results.anthropicOk = res.ok
    const data = await res.json()
    results.anthropicResponse = JSON.stringify(data).substring(0, 300)
  } catch (e: any) {
    results.anthropicError = e.message
  }

  return NextResponse.json(results)
}
