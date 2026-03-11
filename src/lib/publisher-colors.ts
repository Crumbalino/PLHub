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
