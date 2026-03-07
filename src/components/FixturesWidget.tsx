'use client'

import Link from 'next/link'

const teamNameToSlug: Record<string, string> = {
  'Arsenal': 'arsenal',
  'Bournemouth': 'bournemouth',
  'Brentford': 'brentford',
  'Brighton': 'brighton',
  'Chelsea': 'chelsea',
  'Crystal Palace': 'crystal-palace',
  'Everton': 'everton',
  'Forest': 'nottingham-forest',
  'Fulham': 'fulham',
  'Ipswich': 'ipswich',
  'Leicester': 'leicester',
  'Liverpool': 'liverpool',
  'Man City': 'manchester-city',
  'Man Utd': 'manchester-united',
  'Newcastle': 'newcastle',
  'Southampton': 'southampton',
  'Spurs': 'tottenham',
  'West Ham': 'west-ham',
  'Wolves': 'wolverhampton',
}

const fixtures = [
  { home: "Arsenal", homeBadge: "t3", away: "Bournemouth", awayBadge: "t91", date: "Sat 1 Mar", time: "15:00" },
  { home: "Liverpool", homeBadge: "t14", away: "Man City", awayBadge: "t43", date: "Sun 2 Mar", time: "16:30" },
  { home: "Chelsea", homeBadge: "t8", away: "Spurs", awayBadge: "t6", date: "Sun 2 Mar", time: "14:00" },
  { home: "Newcastle", homeBadge: "t4", away: "West Ham", awayBadge: "t21", date: "Sat 8 Mar", time: "15:00" },
  { home: "Aston Villa", homeBadge: "t7", away: "Brighton", awayBadge: "t36", date: "Sat 8 Mar", time: "17:30" },
  { home: "Forest", homeBadge: "t17", away: "Everton", awayBadge: "t11", date: "Sun 9 Mar", time: "14:00" },
]

const recentResults = [
  { home: "Man City", homeBadge: "t43", homeScore: 3, away: "Newcastle", awayBadge: "t4", awayScore: 1 },
  { home: "Spurs", homeBadge: "t6", homeScore: 1, away: "Arsenal", awayBadge: "t3", awayScore: 4 },
  { home: "Liverpool", homeBadge: "t14", homeScore: 1, away: "Forest", awayBadge: "t17", awayScore: 0 },
]

export default function FixturesWidget() {
  return (
    <div className="rounded-xl bg-[var(--plh-card)] border border-[var(--plh-border)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--plh-border)]">
        <span className="text-base font-semibold text-[var(--plh-gold)]">Upcoming Fixtures</span>
        <span className="text-[10px] text-[var(--plh-text-50)]">Next 6</span>
      </div>

      <div className="divide-y divide-[var(--plh-border)]">
        {fixtures.map((fixture, idx) => (
          <div key={idx} className="px-4 py-3 hover:bg-[var(--plh-elevated)] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--plh-text-50)]">{fixture.date}</span>
              <span className="text-xs text-[var(--plh-text-50)]">{fixture.time}</span>
            </div>

            <div className="flex items-center gap-2 justify-between">
              <Link
                href={`/?club=${teamNameToSlug[fixture.home] || ''}`}
                className="flex items-center gap-2 flex-1 hover:text-[var(--plh-teal)] transition-colors"
              >
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${fixture.homeBadge}.png`}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
                <span className="text-[15px] text-[var(--plh-text-100)] truncate">{fixture.home}</span>
              </Link>
              <span className="text-xs text-[var(--plh-text-40)] shrink-0 mx-1">vs</span>
              <Link
                href={`/?club=${teamNameToSlug[fixture.away] || ''}`}
                className="flex items-center gap-2 flex-1 justify-end hover:text-[var(--plh-teal)] transition-colors"
              >
                <span className="text-[15px] text-[var(--plh-text-100)] truncate">{fixture.away}</span>
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${fixture.awayBadge}.png`}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--plh-border)] px-4 py-3">
        <div className="text-base font-semibold text-[var(--plh-gold)] mb-3">Recent Results</div>
        <div className="space-y-2">
          {recentResults.map((result, idx) => (
            <div key={idx} className="flex items-center gap-2 justify-between">
              <Link
                href={`/?club=${teamNameToSlug[result.home] || ''}`}
                className="flex items-center gap-1 flex-1 hover:text-[var(--plh-teal)] transition-colors"
              >
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${result.homeBadge}.png`}
                  alt=""
                  className="w-3 h-3 object-contain"
                />
                <span className="text-[14px] text-[var(--plh-text-100)] truncate">{result.home}</span>
              </Link>
              <span className="text-sm font-semibold text-[var(--plh-text-100)] tabular-nums">{result.homeScore}</span>
              <span className="text-[var(--plh-text-40)]">-</span>
              <span className="text-sm font-semibold text-[var(--plh-text-100)] tabular-nums">{result.awayScore}</span>
              <Link
                href={`/?club=${teamNameToSlug[result.away] || ''}`}
                className="flex items-center gap-1 flex-1 justify-end hover:text-[var(--plh-teal)] transition-colors"
              >
                <span className="text-[14px] text-[var(--plh-text-100)] truncate">{result.away}</span>
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${result.awayBadge}.png`}
                  alt=""
                  className="w-3 h-3 object-contain"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
