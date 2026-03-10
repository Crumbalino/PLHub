'use client';
import { useEffect, useState } from 'react';

const TEAL = '#3AAFA9';
const PINK = '#E84080';
const GOLD = '#D4A843';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';
const W40 = 'rgba(248,249,251,0.4)';

// ── Interfaces (keep exact shapes that /api/snapshot returns) ─────────────────

interface SnapshotStory {
  id: string;
  headline: string;
  summary: string | null;
  source: { name: string; url: string };
  url: string;
  clubs: Array<{ slug: string; shortName: string; code: string; badgeUrl: string }>;
  plhub_index: number | null;
  published_at: string;
  story_card_id: string;
  image_url: string | null;
}

interface SnapshotData {
  metadata: { generatedAt: string; matchday: number; postsCount: number };
  modules: {
    get_caught_up: SnapshotStory[];
    transfers: SnapshotStory[];
    beyond_big_six: SnapshotStory[];
    fantasy_premier_league: SnapshotStory[];
    by_the_numbers: {
      tiles: Array<{ number: string; label: string; context: string; accent: boolean }>;
      matchday: number;
    } | null;
    the_table: {
      standings: Array<{ position: number; club: string; points: number }>;
      highlighted_club: string | null;
    } | null;
    fixture_focus: Array<{
      home: { name: string; slug: string };
      away: { name: string; slug: string };
      kickoff: string;
      status: string;
      score: { home: number; away: number } | null;
      stakes_line: string | null;
    }> | null;
    the_quote: {
      has_quote: boolean;
      quote: string | null;
      attribution: string | null;
      club: string | null;
      context: string | null;
    };
    and_finally: {
      has_content: boolean;
      headline: string | null;
      colour_line: string | null;
      image_url?: string | null;
      plhub_index: number | null;
    };
  };
}

// ── Module: Get Caught Up ─────────────────────────────────────────────────────

function ModuleGetCaughtUp({ stories }: { stories: SnapshotStory[] }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  if (!stories.length) return null;
  const story = stories[Math.min(selected, stories.length - 1)];

  return (
    <div>
      <div style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.12em', color: TEAL, textTransform: 'uppercase', marginBottom: '8px' }}>
        Get Caught Up
      </div>
      <a href={story.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ background: hovered ? 'rgba(58,175,169,0.1)' : 'rgba(58,175,169,0.06)', border: `1px solid rgba(58,175,169,0.2)`, borderLeft: `3px solid ${TEAL}`, borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', transition: 'background 0.15s ease' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: '14px', color: WHITE, margin: '0 0 6px 0', lineHeight: 1.35 }}>{story.headline}</p>
          {story.summary && (
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '12px', color: W70, margin: '0 0 8px 0', lineHeight: 1.5 }}>{story.summary}</p>
          )}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{story.source.name} →</span>
        </div>
      </a>
      {stories.length > 1 && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
          {stories.slice(0, 5).map((_, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{ width: i === selected ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === selected ? TEAL : 'rgba(58,175,169,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s ease' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Module: By The Numbers ────────────────────────────────────────────────────

function ModuleByTheNumbers({ tiles, matchday }: { tiles: Array<{ number: string; label: string; context: string; accent: boolean }>; matchday: number }) {
  if (!tiles?.length) return null;
  const hero = tiles.find(t => t.accent) ?? tiles[0];
  const supporting = tiles.filter(t => t !== hero).slice(0, 3);

  return (
    <div>
      <div style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.12em', color: W40, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>By The Numbers</span>
        <span>MD {matchday}</span>
      </div>
      <div style={{ background: `rgba(232,64,128,0.08)`, border: `1px solid rgba(232,64,128,0.2)`, borderRadius: '8px', padding: '14px', marginBottom: supporting.length ? '8px' : 0, textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '40px', lineHeight: 1, color: WHITE, letterSpacing: '-2px', marginBottom: '4px' }}>{hero.number}</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '12px', fontWeight: 600, color: WHITE, marginBottom: '4px' }}>{hero.label}</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '11px', color: W70, lineHeight: 1.5 }}>{hero.context}</div>
      </div>
      {supporting.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${supporting.length}, 1fr)`, gap: '6px' }}>
          {supporting.map((tile, i) => (
            <div key={i} style={{ background: 'rgba(58,175,169,0.06)', border: '1px solid rgba(58,175,169,0.12)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '22px', lineHeight: 1, color: TEAL, letterSpacing: '-1px', marginBottom: '3px' }}>{tile.number}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '10px', color: W70, lineHeight: 1.4 }}>{tile.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Module: Story row (Transfers, Beyond Big Six) ─────────────────────────────

function ModuleStoryRow({ label, story }: { label: string; story: SnapshotStory }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={story.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: hovered ? 'rgba(248,249,251,0.06)' : 'var(--plh-card)', border: '1px solid var(--plh-border)', borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', transition: 'background 0.15s ease' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.12em', color: W40, textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
        <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: '13px', color: WHITE, margin: '0 0 4px 0', lineHeight: 1.35 }}>{story.headline}</p>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{story.source.name} →</span>
      </div>
    </a>
  );
}

// ── Module: The Quote ─────────────────────────────────────────────────────────

function ModuleQuote({ quote, attribution, context }: { quote: string; attribution: string; context: string | null }) {
  return (
    <div style={{ background: 'rgba(232,64,128,0.07)', border: '1px solid rgba(232,64,128,0.2)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '36px', lineHeight: 0.8, color: PINK, opacity: 0.35, marginBottom: '8px', userSelect: 'none' }}>"</div>
      <p style={{ fontFamily: "'Sora', sans-serif", fontStyle: 'italic', fontSize: '13px', color: WHITE, lineHeight: 1.55, margin: '0 0 8px 0', fontWeight: 500 }}>{quote}</p>
      <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '11px', color: W70, margin: 0 }}>
        — {attribution}{context && <span style={{ color: W40 }}> · {context}</span>}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SnapshotContainer({ club = null }: { club?: string | null }) {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const url = new URL('/api/snapshot', window.location.origin);
        if (club) url.searchParams.set('club', club);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (json.success && json.data) setData(json.data);
        else throw new Error(json.error || 'Invalid response');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [club]);

  const matchday = data ? `Matchday ${data.metadata.matchday}` : '—';

  return (
    <div style={{ background: 'var(--plh-card)', border: '1px solid var(--plh-border)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(248,249,251,0.06)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '20px', color: WHITE, margin: 0 }}>The Snapshot</h2>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: W40 }}>P.302</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: W70 }}>{matchday}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading && (
          <>
            {[120, 80, 80, 100].map((h, i) => (
              <div key={i} style={{ height: `${h}px`, borderRadius: '8px', background: 'rgba(248,249,251,0.04)', animation: 'tfhPulse 1.8s ease-in-out infinite', animationDelay: `${i * 150}ms` }} />
            ))}
            <style>{`@keyframes tfhPulse { 0%,100%{opacity:0.5} 50%{opacity:0.15} }`}</style>
          </>
        )}

        {!loading && error && (
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '12px', color: W40, textAlign: 'center', padding: '24px 0' }}>Snapshot unavailable right now.</p>
        )}

        {!loading && !error && data && (
          <>
            <ModuleGetCaughtUp stories={data.modules.get_caught_up ?? []} />

            {data.modules.transfers?.[0] && (
              <ModuleStoryRow label="Transfers & Contracts" story={data.modules.transfers[0]} />
            )}

            {data.modules.by_the_numbers?.tiles?.length && (
              <ModuleByTheNumbers tiles={data.modules.by_the_numbers.tiles} matchday={data.modules.by_the_numbers.matchday} />
            )}

            {data.modules.beyond_big_six?.[0] && (
              <ModuleStoryRow label="Beyond Big Six" story={data.modules.beyond_big_six[0]} />
            )}

            {data.modules.the_quote?.has_quote && data.modules.the_quote.quote && data.modules.the_quote.attribution && (
              <ModuleQuote quote={data.modules.the_quote.quote} attribution={data.modules.the_quote.attribution} context={data.modules.the_quote.context ?? null} />
            )}
          </>
        )}
      </div>

      {/* Pink footer bar */}
      <div style={{ height: '2px', background: `linear-gradient(to right, ${PINK}, transparent)` }} />
    </div>
  );
}
