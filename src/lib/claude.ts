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

  const prompt = `You're writing a 2-3 sentence summary for PLHub, a Premier League news site. The reader is a football fan, 35+, sharp, short on time. They want to know: what happened, why it matters, and whether it's worth clicking.

Tone: dry, slightly cheeky, like a well-informed mate. No hype, no filler, no corporate speak. Be direct.

Format: 2-3 short punchy sentences max. No bullet points. No intro phrases like 'This article...' or 'In this post...'. Just get straight to it.

If it's a Reddit thread and there are comments available, factor in what fans are actually saying — the mood, the debate, the funny take. If it's a video post with no description, say what you can reasonably infer from the title.

Content to summarise:
Title: ${title}
Content: ${content ?? ''}`

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
