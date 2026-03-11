import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SummaryAndHook {
  summary: string | null
  hook: string | null
  significance: number | null
  cardTypeHint?: 'story' | 'stat' | 'quote' | 'result' | 'lol' | 'rumour' | null
}

export async function generateSummary(
  title: string,
  content: string | null,
): Promise<SummaryAndHook> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set')
    return { summary: null, hook: null, significance: null }
  }

  // Require real article content — minimum 300 chars means we have something to work with
  const contentLength = (content ?? '').trim().length
  if (contentLength < 300) {
    return { summary: null, hook: null, significance: null }
  }

  const prompt = `You are writing for The Football Hub — a no-nonsense Premier League news aggregator for football fans aged 35+. British English. Never use exclamation marks. Never use emojis. No gambling content under any circumstances.

Given this article:
Title: ${title}
Source: (inferred from article)
Content: ${content}

Return ONLY valid JSON in this exact format, no other text:
{
  "summary": "2-4 sentence summary. Specific facts. No padding. TFH voice: confident, dry, occasionally wry. End with the most interesting detail.",
  "generated_headline": "Rewritten headline. Max 12 words. Present tense. No clickbait. The fact is the headline.",
  "card_type_hint": "one of: story | stat | quote | result | lol | rumour"
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return { summary: null, hook: null, significance: null, cardTypeHint: null }

    const text = block.text.trim()
    const data = JSON.parse(text)

    return {
      summary: data.summary || null,
      hook: data.generated_headline || null,
      significance: null,
      cardTypeHint: data.card_type_hint || null,
    }
  } catch (err) {
    console.error('TFH summary generation failed:', err)
    return { summary: null, hook: null, significance: null }
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
