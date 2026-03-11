"use client";

import { useState, useEffect } from "react";
import { FONT, SIZE, WEIGHT, RADIUS, REACTIONS, SEED_VOTES } from "@/lib/tokens";
import { hexToRgba, getTopReactions, formatReactions, storage } from "@/lib/utils";

interface YourVerdictProps {
  accent: string;
  cardId: string;
}

type Phase = "idle" | "picking" | "voted";

export default function YourVerdict({ accent, cardId }: YourVerdictProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [votes, setVotes] = useState<Record<number, number>>({ ...SEED_VOTES });
  const [picked, setPicked] = useState<number | null>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const prior = storage.get(`tfh_voted_${cardId}`);
    if (prior !== null) {
      setPicked(Number(prior));
      setPhase("voted");
    }
  }, [cardId]);

  useEffect(() => {
    if (phase === "voted") {
      setTimeout(() => setBarsVisible(true), 80);
    }
  }, [phase]);

  const handlePick = (idx: number) => {
    const next = { ...votes, [idx]: (votes[idx] || 0) + 1 };
    setVotes(next);
    setPicked(idx);
    setPhase("voted");
    storage.set(`tfh_voted_${cardId}`, String(idx));
  };

  const top5 = getTopReactions(votes, REACTIONS, 5);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxCount = top5[0]?.count || 1;

  return (
    <div
      style={{
        borderTop: `1px solid ${hexToRgba(accent, 0.07)}`,
        paddingTop: 12,
        marginTop: 12,
      }}
    >
      {phase === "idle" && (
        <button
          onClick={() => setPhase("picking")}
          style={{
            width: "100%",
            background: hexToRgba(accent, 0.05),
            border: `1px solid ${hexToRgba(accent, 0.12)}`,
            borderRadius: RADIUS.md,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: FONT.mono,
            fontSize: SIZE.labelXs,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: hexToRgba(accent, 0.5),
            minHeight: 44,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = hexToRgba(accent, 0.10);
            e.currentTarget.style.borderColor = hexToRgba(accent, 0.25);
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = hexToRgba(accent, 0.05);
            e.currentTarget.style.borderColor = hexToRgba(accent, 0.12);
            e.currentTarget.style.color = hexToRgba(accent, 0.5);
          }}
        >
          <span>Your Verdict</span>
          <span style={{ fontSize: SIZE.bodyLg, lineHeight: 1, opacity: 0.6 }}>→</span>
        </button>
      )}

      {phase === "picking" && (
        <div style={{ animation: "fadeUp 0.25s ease" }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.labelXs,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: hexToRgba(accent, 0.4),
              marginBottom: 12,
            }}
          >
            Your Verdict
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            {REACTIONS.map((reaction, i) => (
              <button
                key={reaction.id}
                onClick={() => handlePick(reaction.id)}
                style={{
                  background: hexToRgba(accent, 0.04),
                  border: `1px solid ${hexToRgba(accent, 0.10)}`,
                  borderRadius: RADIUS.lg,
                  padding: "11px 4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  animation: `emojiIn 0.3s ease ${i * 0.04}s both`,
                  minHeight: 44,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = hexToRgba(accent, 0.14);
                  e.currentTarget.style.transform = "scale(1.18) translateY(-2px)";
                  e.currentTarget.style.borderColor = hexToRgba(accent, 0.3);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = hexToRgba(accent, 0.04);
                  e.currentTarget.style.transform = "scale(1) translateY(0)";
                  e.currentTarget.style.borderColor = hexToRgba(accent, 0.10);
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "voted" && (
        <div style={{ animation: "fadeUp 0.2s ease" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: SIZE.labelXs,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: hexToRgba(accent, 0.4),
              }}
            >
              Your Verdict
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: SIZE.labelXs,
                color: hexToRgba(accent, 0.3),
                letterSpacing: "0.5px",
              }}
            >
              {formatReactions(total)}
            </div>
          </div>

          {top5.map((item, rank) => {
            const pct = (item.count / total) * 100;
            const barPct = (item.count / maxCount) * 100;
            const isWinner = rank === 0;
            const isPicked = item.idx === picked;
            const delay = rank * 0.09;

            return (
              <div
                key={item.idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: rank < 4 ? 10 : 0,
                  opacity: barsVisible ? 1 : 0,
                  transform: barsVisible ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.35s ease ${delay}s, transform 0.4s ease ${delay}s`,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    flexShrink: 0,
                    width: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: isPicked ? 19 : 16, lineHeight: 1 }}>
                    {item.emoji}
                  </span>
                  {isPicked && (
                    <div
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -3,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    style={{
                      height: isWinner ? 6 : 4,
                      borderRadius: 3,
                      background: hexToRgba(accent, 0.07),
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: barsVisible ? `${barPct}%` : "0%",
                        background: isWinner
                          ? `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.7)})`
                          : isPicked
                          ? hexToRgba(accent, 0.45)
                          : hexToRgba(accent, 0.2),
                        transition: `width 0.55s cubic-bezier(0.25,1,0.5,1) ${delay + 0.1}s`,
                        boxShadow: isWinner
                          ? `0 0 8px ${hexToRgba(accent, 0.4)}`
                          : "none",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: SIZE.labelSm,
                    fontWeight: isWinner ? WEIGHT.bold : WEIGHT.regular,
                    color: isWinner ? accent : hexToRgba(accent, 0.35),
                    minWidth: 32,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {Math.round(pct)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
