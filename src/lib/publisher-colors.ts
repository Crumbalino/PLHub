import { PUB_COLORS } from "./tokens";

/**
 * Returns the left-border / source-label colour for a publisher.
 * Normalises to uppercase before lookup.
 * Returns teal for unknown sources.
 */
export function getPublisherColor(publisher: string): string {
  const key = publisher.toUpperCase().trim() as keyof typeof PUB_COLORS;
  return PUB_COLORS[key] ?? PUB_COLORS.DEFAULT;
}

/**
 * Derives publisher name from URL domain.
 * Used for "Read on [Publisher] →" link text.
 */
export function getPublisherName(url: string): string {
  if (!url) return 'Source';
  const lower = url.toLowerCase();
  if (lower.includes('bbc.com') || lower.includes('bbc.co.uk')) return 'BBC Sport';
  if (lower.includes('skysports.com')) return 'Sky Sports';
  if (lower.includes('theguardian.com')) return 'The Guardian';
  if (lower.includes('talksport.com')) return 'talkSPORT';
  if (lower.includes('goal.com')) return 'Goal';
  if (lower.includes('90min.com')) return '90min';
  if (lower.includes('football365.com')) return 'Football365';
  if (lower.includes('independent.co.uk')) return 'The Independent';
  if (lower.includes('espn.com')) return 'ESPN';
  if (lower.includes('fourfourtwo.com')) return 'FourFourTwo';
  if (lower.includes('theathletic.com')) return 'The Athletic';
  if (lower.includes('reddit.com')) return 'Reddit';
  return 'Source';
}

/**
 * Gets publisher color from URL domain.
 * Used for "Read on [Publisher] →" link and left border colors.
 */
export function getPublisherColorFromUrl(url: string): string {
  if (!url) return PUB_COLORS.DEFAULT;
  const lower = url.toLowerCase();
  if (lower.includes('bbc.com') || lower.includes('bbc.co.uk')) return '#D4A843';
  if (lower.includes('skysports.com')) return '#E84080';
  if (lower.includes('theguardian.com')) return '#6B9E78';
  if (lower.includes('talksport.com')) return '#8AACCC';
  if (lower.includes('goal.com')) return '#C084FC';
  if (lower.includes('90min.com')) return '#E8622A';
  if (lower.includes('football365.com')) return '#6B9E78';
  if (lower.includes('independent.co.uk')) return '#6B9E78';
  if (lower.includes('espn.com')) return '#E84080';
  if (lower.includes('theathletic.com')) return '#8AACCC';
  return PUB_COLORS.DEFAULT;
}
