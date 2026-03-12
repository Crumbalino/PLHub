// ─────────────────────────────────────────────────────────────────
// Main feed page.
// Fetches real data from existing API routes.
// Falls back to placeholder data if API returns empty.
// Feed order: Snapshot → [news 1,2,3] → StatCard → [news 4,5]
//             → TriviaCard → OnThisDayCard → QuoteCard → FixtureCard
//             → remaining news cards
// ─────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import SnapshotBlock from "@/components/SnapshotBlock";
import NewsCard from "@/components/NewsCard";
import StatCard from "@/components/StatCard";
import TriviaCard from "@/components/TriviaCard";
import OnThisDayCard from "@/components/OnThisDayCard";
import QuoteCard from "@/components/QuoteCard";
import FixtureCard from "@/components/FixtureCard";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, SPACE } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

// ── Placeholder data (used when real API returns empty) ──
const PLACEHOLDER_FEED = [
  {
    id: "n0", pub: "BBC SPORT", score: 94, time: "1h ago",
    img: "https://picsum.photos/seed/tfh1/600/320",
    thumb: "https://picsum.photos/seed/tfh1/120/80",
    headline: "Gravenberch signs new long-term contract at Liverpool",
    summary: "Midfield signing of the season commits his future to Anfield. At this point Liverpool's squad feels deliberately assembled.",
    content: "Midfield signing of the season commits his future to Anfield.",
    url: "https://bbc.com/sport/football/example1",
  },
  {
    id: "n1", pub: "SKY SPORTS", score: 91, time: "2h ago",
    img: "https://picsum.photos/seed/tfh2/600/320",
    thumb: "https://picsum.photos/seed/tfh2/120/80",
    headline: "Atlético thrash Spurs 5–2 in Champions League first leg",
    summary: "Spurs were taken apart in Madrid. Solanke confirmed afterwards they have 'no more excuses', which is one way to put it.",
    content: "Spurs were taken apart in Madrid.",
    url: "https://skysports.com/football/example2",
  },
  {
    id: "n2", pub: "THE GUARDIAN", score: 88, time: "3h ago",
    img: "https://picsum.photos/seed/tfh3/600/320",
    thumb: "https://picsum.photos/seed/tfh3/120/80",
    headline: "Tudor's job under serious threat as Spurs consider replacements",
    summary: "The results have made the decision for them. The question now is timing.",
    content: "The results have made the decision for them.",
    url: "https://theguardian.com/football/example3",
  },
  {
    id: "n3", pub: "ESPN", score: 85, time: "4h ago",
    img: "https://picsum.photos/seed/tfh4/600/320",
    thumb: "https://picsum.photos/seed/tfh4/120/80",
    headline: "Edu asked to stay away from Nottingham Forest, sources say",
    summary: "Whatever is happening at the City Ground has the unmistakable energy of things that will become a documentary.",
    content: "Whatever is happening at the City Ground has the unmistakable energy of things that will become a documentary.",
    url: "https://espn.com/football/example4",
  },
  {
    id: "n4", pub: "TALKSPORT", score: 82, time: "5h ago",
    img: "https://picsum.photos/seed/tfh5/600/320",
    thumb: "https://picsum.photos/seed/tfh5/120/80",
    headline: "Haaland fitness doubt: Guardiola cautious ahead of Real Madrid",
    summary: "The words 'hopes' and 'we'll see' were both deployed. City fans refreshing injury trackers every 40 minutes know the drill.",
    content: "The words 'hopes' and 'we'll see' were both deployed.",
    url: "https://talksport.com/football/example5",
  },
];

// Day/date header helper
function getTodayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).toUpperCase();
}

export default function FeedPage() {
  const { tokens } = useTheme();
  const [feedItems, setFeedItems] = useState(PLACEHOLDER_FEED);

  // Attempt to load real data from existing API
  useEffect(() => {
    fetch("/api/feed?sort=pulse&page=1&limit=10")
      .then(r => r.json())
      .then(data => {
        if (data?.posts?.length > 0) {
          setFeedItems(
            data.posts.map((p: any) => ({
              id: p.id,
              pub: (p.sourceInfo?.name || "Unknown").toUpperCase(),
              score: p.indexScore ?? 50,
              time: p.timeDisplay || "",
              img: p.imageUrl ?? `https://picsum.photos/seed/${p.id}/600/320`,
              thumb: p.imageUrl ?? `https://picsum.photos/seed/${p.id}/120/80`,
              headline: p.title ?? "",
              summary: p.summary ?? null,
              content: p.content ?? null,
              url: p.url ?? null,
            }))
          );
        }
      })
      .catch(() => {
        // Stay on placeholder data — fail silently
      });
  }, []);

  // Build snapshot stories from top 5 feed items
  const snapshotStories = feedItems.slice(0, 5).map((item, i) => ({
    id: item.id,
    rank: i + 1,
    pub: item.pub,
    score: item.score,
    headline: item.headline,
    url: item.url,
  }));

  return (
    <div
      style={{
        background: tokens.bg,
        minHeight: "100vh",
        transition: "background 300ms ease",
      }}
    >
      <Navbar />

      <main className="tfh-page">
        {/* ── Page header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: SPACE[5],
            paddingBottom: 14,
            borderBottom: `1px solid ${'#FFFFFF'}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: SIZE.label2xs,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: tokens.teal,
                marginBottom: 3,
              }}
            >
              The Football Hub
            </div>
            <div
              style={{
                fontFamily: FONT.sora,
                fontSize: SIZE.headXl,
                fontWeight: WEIGHT.extrabold,
                color: '#FFFFFF',
                letterSpacing: "-0.5px",
              }}
            >
              Today's Feed
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.labelXs,
              color: '#FFFFFF',
              letterSpacing: "1px",
            }}
          >
            {getTodayLabel()}
          </div>
        </div>

        {/* ── Snapshot block ── */}
        <SnapshotBlock stories={snapshotStories} gameweek="GW29" />

        {/* ── Feed divider ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, height: 1, background: '#FFFFFF' }} />
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.label2xs,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: '#FFFFFF',
            }}
          >
            The Feed
          </div>
          <div style={{ flex: 1, height: 1, background: '#FFFFFF' }} />
        </div>

        {/* ── Feed cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* News 1, 2, 3 */}
          {feedItems.slice(0, 3).map(item => (
            <NewsCard
              key={item.id}
              id={item.id}
              publisher={item.pub}
              headline={item.headline}
              summary={item.summary}
              content={item.content}
              score={item.score}
              time={item.time}
              imgSrc={item.img}
              articleUrl={item.url ?? undefined}
              breaking={false}
            />
          ))}

          {/* Interstitial: By The Numbers */}
          <StatCard />

          {/* News 4, 5 */}
          {feedItems.slice(3, 5).map(item => (
            <NewsCard
              key={item.id}
              id={item.id}
              publisher={item.pub}
              headline={item.headline}
              summary={item.summary}
              content={item.content}
              score={item.score}
              time={item.time}
              imgSrc={item.img}
              articleUrl={item.url ?? undefined}
              breaking={false}
            />
          ))}

          {/* Interstitials */}
          <TriviaCard />
          <OnThisDayCard />
          <QuoteCard />
          <FixtureCard />

          {/* Remaining news cards */}
          {feedItems.slice(5).map(item => (
            <NewsCard
              key={item.id}
              id={item.id}
              publisher={item.pub}
              headline={item.headline}
              summary={item.summary}
              content={item.content}
              score={item.score}
              time={item.time}
              imgSrc={item.img}
              articleUrl={item.url ?? undefined}
              breaking={false}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
