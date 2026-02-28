import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SummaryAndHook {
  summary: string | null
  hook: string | null
}

export async function generateSummary(
  title: string,
  content: string | null,
  club?: string | null
): Promise<SummaryAndHook> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — skipping summary generation')
    return { summary: null, hook: null }
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

Also provide a punchy 4-6 word hook that teases your take without giving it away. It should create curiosity and make the reader want to expand and read more. Write it as if you're a mate leaning over and starting a sentence they can't help but want to hear the end of. Examples of good hooks: 'Blaming everyone but himself...', 'The fee tells you everything...', 'And it's not who you think...', 'One moment changed everything...'. The hook should be specific to THIS story, not generic. End it with '...' to create intrigue.

Return the response in this exact format:
HOOK: [4-6 word hook with ... at the end]
SUMMARY: [the 2-3 sentence summary]

Story title: ${title}
Story content: ${content ?? ''}${clubLine}`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const block = message.content[0]
    if (block.type !== 'text') {
      return { summary: null, hook: null }
    }

    const text = block.text.trim()

    // Parse HOOK and SUMMARY from response
    const hookMatch = text.match(/HOOK:\s*(.+?)(?:\nSUMMARY:|$)/)
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)$/s)

    const hook = hookMatch ? hookMatch[1].trim() : null
    const summary = summaryMatch ? summaryMatch[1].trim() : null

    return { summary: summary || null, hook: hook || null }
  } catch (err) {
    console.error('Claude summary generation failed:', err)
    return { summary: null, hook: null }
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
