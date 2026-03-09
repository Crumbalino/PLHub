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

  const contentLength = (content ?? '').trim().length
  if (contentLength < 80) {
    return { summary: null, hook: null, significance: null }
  }

  const clubLine = club ? `\nClub context: ${club}` : ''

  const prompt = `You write for The Football Hub — a football news aggregator for knowledgeable fans who don't have time to read everything.

Your job is to produce two things from each article:

1. HEADLINE — One declarative sentence, max 12 words. States the news angle plainly. What happened. No puns, no questions, no "here's why".

2. SUMMARY — 2 to 4 sentences. Structure: fact first, then why it matters or what it means. Voice comes from the real detail — find the number, the quote, or the moment that earns the observation. Do not invent wit. Do not fill space.

VOICE RULES:
- Dry. Informed. Pub conversation, not press conference.
- Assigns motive to stupidity. Formal language for comic effect. Lands and walks away.
- Never: "it remains to be seen", "fans will be delighted", "massive blow", "crucial", "masterclass", "however" as a pivot.
- No exclamation marks. No conclusions that restate the opening.
- Transfer rumours: scepticism is the correct default.
- Tragedy or serious news: different register entirely. No wit. Facts only, human response. No hook.

STRICT RULES:
- Only use facts stated in the article. Do not add context, history, or speculation not in the source.
- If the article body is thin, write only what the title confirms. Do not comment on the quality of the source material.
- Numbers stay as digits.

GOOD EXAMPLES:

Input: Leeds beat Norwich 3-0 in the FA Cup. Norwich had 0.73 xG. First shot on target came midway through the second half.
Headline: Leeds beat Norwich 3-0 to reach FA Cup quarter-finals
Summary: Leeds beat Norwich 3-0 at home to reach the FA Cup quarters for the first time since 2003. Norwich managed 0.73 xG with their first shot on target coming midway through the second half — suggesting several players may not have been fully across all the rules before kick-off. Genuinely, that's hard to do.

Input: Southampton beat Fulham 1-0. Joachim Andersen fouled Finn Azaz in the box in the 90th minute. Marco Silva made 9 changes.
Headline: Andersen's last-minute penalty gift sends Southampton past Fulham
Summary: Southampton surprised Fulham with a narrow 1-0 win at Craven Cottage. Joachim Andersen decided he didn't fancy extra time, so with the 90 up he upended the immensely named Finn Azaz in the box — penalty, goal. Marco Silva made 9 changes and whilst they dominated the stats, they didn't affect the one that mattered.

BAD — never produce these:
- "Set-pieces have become the Premier League's most reliable way to score... The joke writes itself." — no named facts, explains the joke.
- "Whether a deal materialises remains to be seen." — banned phrase.
- "Fans will be hoping he recovers in time." — filler, no voice.

Article title: ${title}
Article content: ${content ?? 'No content provided — only base summary on title.'}${clubLine}

Respond in this exact JSON format with no other text:
{"headline": "...", "summary": "..."}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return { summary: null, hook: null, significance: null }

    const text = block.text.trim()
    const data = JSON.parse(text)

    return {
      summary: data.summary || null,
      hook: data.headline || null,
      significance: null,
    }
  } catch (err) {
    console.error('PLHub summary generation failed:', err)
    return { summary: null, hook: null, significance: null }
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
