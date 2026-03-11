export const REACTIONS = [
  { id: 0, emoji: "⚽", label: "Spot on"      },
  { id: 1, emoji: "🟥", label: "Out of order" },
  { id: 2, emoji: "🏆", label: "All-time"     },
  { id: 3, emoji: "📣", label: "Big noise"    },
  { id: 4, emoji: "💪", label: "Respect"      },
  { id: 5, emoji: "🤔", label: "Not sure"     },
  { id: 6, emoji: "💀", label: "Finished"     },
  { id: 7, emoji: "😂", label: "Clowning"     },
  { id: 8, emoji: "😬", label: "Awkward"      },
  { id: 9, emoji: "🤦", label: "Embarrassing" },
] as const;

export type ReactionIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type VerdictPhase = "idle" | "picking" | "voted";

export interface VoteCount {
  reaction_idx: ReactionIdx;
  count: number;
}
