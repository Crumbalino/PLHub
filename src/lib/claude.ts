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

  const prompt = `You write for The Football Hub — a football news aggregator for knowledgeable fans who don't have time to read everything. Your job is to produce summary and headline from each article.

VOICE RULES:
- Dry. Informed. Pub conversation, not press conference.
- Assigns motive to stupidity. Formal language for comic effect. Lands and walks away.
- Transfer rumours: scepticism is the correct default.
- Tragedy or serious news: different register entirely — facts only, no wit, no hook.
- Numbers stay as digits.

BANNED PHRASES AND PATTERNS — producing any of these is a failure:
- "it remains to be seen"
- "fans will be delighted / hoping / devastated"
- "massive blow", "crucial", "masterclass"
- "however" used as a pivot
- Any sentence commenting on the article itself — e.g. "the article does not specify", "no timeline was given", "the piece offers little detail", "further details are sparse"
- Restating the headline in the summary
- Any conclusion that just says the headline again in different words
- Exclamation marks

GOOD EXAMPLES:
Input: Leeds beat Norwich 3-0 in the FA Cup. Norwich had 0.73 xG. First shot on target came midway through the second half.
Headline: Leeds beat Norwich 3-0 to reach FA Cup quarter-finals
Summary: Leeds beat Norwich 3-0 at home to reach the FA Cup quarters for the first time since 2003. Norwich managed 0.73 xG with their first shot on target coming midway through the second half — suggesting several players may not have been fully across all the rules before kick-off.

Input: Southampton beat Fulham 1-0. Joachim Andersen fouled Finn Azaz in the box in the 90th minute. Marco Silva made 9 changes.
Headline: Andersen's last-minute penalty gift sends Southampton past Fulham
Summary: Southampton surprised Fulham with a narrow 1-0 win at Craven Cottage. Joachim Andersen decided he didn't fancy extra time, so with the 90 up he upended the immensely named Finn Azaz in the box — penalty, goal. Marco Silva made 9 changes and whilst they dominated the stats, they didn't affect the one that mattered.

Article title: ${title}
Article content: ${content}

Return ONLY valid JSON in this exact format, no other text:
{
  "summary": "2-4 sentence summary. Specific facts. No padding. Structure: fact first, then why it matters. End with the most interesting detail.",
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
