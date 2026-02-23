import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateSummary(
  title: string,
  content: string | null
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — skipping summary generation')
    return null
  }

  const prompt = `Summarize this Premier League news in 2-3 sentences for a fan: ${title}. ${content ?? ''}`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const block = message.content[0]
    if (block.type === 'text') {
      return block.text.trim()
    }
    return null
  } catch (err) {
    console.error('Claude summary generation failed:', err)
    return null
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
