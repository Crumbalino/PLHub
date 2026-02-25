import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateSummary(
  title: string,
  content: string | null,
  club?: string | null
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — skipping summary generation')
    return null
  }

  const clubLine = club ? `\nClub: ${club}` : ''

  const prompt = `You are the editorial voice of PLHub — write in the style of The Guardian's Fiver newsletter. Think Barry Glendenning: dry, sceptical, affectionately cynical about football and everyone in it. You know your stuff but you never take it too seriously.

Write a 2-3 sentence summary of this Premier League story.

Rules:
- Sentence 1: the actual news — specific, factual, names and clubs included
- Sentence 2: context or significance, delivered with mild world-weariness
- Sentence 3: a dry editorial aside — the kind of thing a knowledgeable fan thinks but journalists won't print. Could be a gentle dig, a knowing observation, or a rhetorical question. No exclamation marks. No hyperbole. Deadpan is good.
- If it's a transfer rumour: appropriate scepticism is encouraged
- If it's a Reddit fan thread: capture the mood of the fans, not just the topic
- If it involves Manchester United: restraint is advised but not mandatory
- Never use the word 'crucial'. Never say 'fans will be delighted'. Never be tabloid.
- Maximum 60 words. Punchy. Dry. British.

Story title: ${title}
Story content: ${content ?? ''}${clubLine}`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 200,
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
