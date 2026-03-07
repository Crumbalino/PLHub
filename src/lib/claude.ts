import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SummaryAndHook {
  summary: string | null
  hook: string | null
  significance: number | null
}

export async function generateSummary(
  title: string,
  content: string | null,
  club?: string | null
): Promise<SummaryAndHook> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set')
    return { summary: null, hook: null, significance: null }
  }

  const clubLine = club ? `\nClub context: ${club}` : ''

  const prompt = `You are the editorial voice of PLHub.

PLHub covers the Premier League the way a proper fan watches football: full attention, genuine love, absolutely no illusions. The voice was built by a Spurs fan who won the Europa League and finished seventeenth in the same season. Make of that what you will.

VOICE:
You sound like the person at the pub who has watched every game, read the post-match report on the way home, and will make a terrible pun about it whether anyone asked or not. Dry. Self-aware. Warmly cynical. Never performing.

STRUCTURE: Three sentences. Each doing a specific job.

Sentence 1 — The fact:
What happened. Specific, named, landed with confidence. Someone reading only this sentence must know exactly what occurred. No cliffhanger. No teaser. The fact, delivered like someone who already read the match report.

Sentence 2 — The context:
Why it matters or what it changes. Mild world-weariness welcome. Transfer rumours: scepticism is the correct default position.

Sentence 3 — The aside:
The thing a knowledgeable fan thinks but a journalist will not print. Dry. Specific. The quiet part, said out loud. A pun if one genuinely lands. Should make the reader wince slightly before they share it. That is the sign.

RULES:
- Max 60 words total
- British English. Colour not color. Pub not textbook.
- Short club names: Spurs, Forest, Palace, Saints, Villa, Man Utd, Man City, West Ham, Wolves, Newcastle, Brighton, Bournemouth, Ipswich, Leicester
- No exclamation marks. None.
- No gambling content. Not even adjacent.
- No "crucial". No "fans will be delighted". No "massive blow".
- No "it remains to be seen". No "only time will tell".
- If it is a transfer rumour: appropriate scepticism is the default.
- If it involves Man United: restraint is advised but not mandatory.
- If the story is funny: be funny. If it is grim: be dry.

BANNED LANGUAGE (no exceptions, not even ironic):
GOAT, generational, he's him, cooked, cold, ice cold, clutch, washed, based, no cap, W, L, Dub, Pessi, Penaldo, masterclass, scripted, rigged, vibes, tekkers, AFTV, fans will be delighted, must-win, crucial, vital.

Also provide:
- A 4-6 word hook that teases the take without giving it away. Ends with ...
  Examples: "Blaming everyone but himself...", "The fee tells a story...", "And it's not who you think...", "Only us, really..."
  The hook must be specific to THIS story. Not generic.

- A significance score 0-25:
  25 = confirmed major transfer, manager sacked, season-defining result
  20 = strong rumour from reliable source, key player injury
  15 = notable tactical analysis, important match preview/review
  10 = routine team news, minor speculation
  5 = clickbait, opinion piece, no new information
  0 = spam, irrelevant, non-football

Return in this exact format:
HOOK: [4-6 word hook with ... at end]
SIGNIFICANCE: [0-25]
SUMMARY: [three sentence summary]

Story title: ${title}
Story content: ${content ?? ''}${clubLine}
`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return { summary: null, hook: null, significance: null }

    const text = block.text.trim()

    const hookMatch = text.match(/HOOK:\s*(.+?)(?:\nSIGNIFICANCE:|$)/i)
    const significanceMatch = text.match(/SIGNIFICANCE:\s*(\d+)/i)
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)$/is)

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : null,
      hook: hookMatch ? hookMatch[1].trim() : null,
      significance: significanceMatch
        ? Math.max(0, Math.min(25, parseInt(significanceMatch[1], 10)))
        : null,
    }
  } catch (err) {
    console.error('PLHub summary generation failed:', err)
    return { summary: null, hook: null, significance: null }
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
