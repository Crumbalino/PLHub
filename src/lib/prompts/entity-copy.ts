/**
 * AI Prompt Templates for Entity-Specific Content Generation
 * Used for generating marketing copy, FAQs, and descriptions for clubs and topics
 */

/**
 * Layer 1 Club Prompt - Brief introduction/overview for club pages
 */
export function layer1ClubPrompt(clubName: string, manager: string, founded: number, city: string): string {
  return `You are a witty Premier League expert writing a brief, engaging introduction about ${clubName}.

Write a 2-3 sentence description that captures:
- The club's identity and playstyle
- Current manager: ${manager}
- Founded: ${founded}
- Location: ${city}

Keep it punchy, informative, and entertaining. No more than 50 words.`;
}

/**
 * Layer 2 Club Prompt - Deeper analysis for club pages
 */
export function layer2ClubPrompt(clubName: string, manager: string, stadium: string, recentPerformance: string): string {
  return `You are a Premier League analyst writing a detailed analysis of ${clubName}.

Provide a 3-4 paragraph deep dive covering:
- Playing philosophy under ${manager}
- Recent form and performance: ${recentPerformance}
- Key tactical strengths
- Stadium atmosphere: ${stadium}

Be analytical but accessible. Focus on what makes them unique this season.`;
}

/**
 * FAQ Club Prompt - Generate frequently asked questions about a club
 */
export function faqClubPrompt(clubName: string, manager: string): string {
  return `Generate 5 frequently asked questions that ${clubName} fans would ask, with concise answers.

Format each as:
Q: [Question]
A: [Answer]

Focus on:
1. Manager and tactics
2. Key players
3. Stadium and history
4. Recent performance
5. Fan culture

Keep answers to 2-3 sentences. Be accurate and entertaining.`;
}

/**
 * Layer 1 Topic Prompt - Brief content for topic/theme pages
 */
export function layer1TopicPrompt(topic: string, context: string): string {
  return `You are a Premier League correspondent writing about "${topic}".

Write a 2-3 sentence engaging introduction that:
- Defines the topic
- Explains its relevance to the Premier League
- Hooks the reader

Context: ${context}

Keep it punchy and informative. No more than 40 words.`;
}

/**
 * FAQ Topic Prompt - Generate FAQs for a specific topic
 */
export function faqTopicPrompt(topic: string, context: string): string {
  return `Generate 5 frequently asked questions about "${topic}" in the Premier League context.

Format each as:
Q: [Question]
A: [Answer]

Context: ${context}

Keep answers to 2-3 sentences. Focus on practical, fan-relevant information.`;
}

/**
 * Transfer News Prompt - For analyzing transfer rumors and news
 */
export function transferNewsPrompt(playerName: string, fromClub: string, toClub: string): string {
  return `You are a transfer analyst writing about ${playerName}'s potential move from ${fromClub} to ${toClub}.

Provide:
1. Why this transfer makes sense tactically
2. Fit with the new club's system
3. Impact on both squads
4. Realistic outcome prediction

Keep it balanced and analytical. 2-3 paragraphs.`;
}

/**
 * Fixture Preview Prompt - For match previews
 */
export function fixturePreviewPrompt(homeTeam: string, awayTeam: string, context: string): string {
  return `You are a match analyst previewing ${homeTeam} vs ${awayTeam}.

Cover:
- Head-to-head history
- Current form
- Key tactical matchups
- Prediction

Context: ${context}

Keep it engaging and punchy. 2-3 paragraphs.`;
}

/**
 * Match Report Prompt - For post-match analysis
 */
export function matchReportPrompt(homeTeam: string, awayTeam: string, scoreline: string, highlights: string): string {
  return `You are a match reporter summarizing ${homeTeam} vs ${awayTeam}.

Scoreline: ${scoreline}
Key moments: ${highlights}

Write a 3-4 paragraph match report covering:
- How the match unfolded
- Decisive moments
- Standout performances
- Implications

Be balanced, analytical, and entertaining.`;
}
