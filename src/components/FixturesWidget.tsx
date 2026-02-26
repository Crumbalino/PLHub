'use client'

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
    <div className="rounded-xl bg-[#152B2E] border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm font-semibold text-[#C4A23E]">Upcoming</span>
        <span className="text-[10px] text-gray-400">Next 6</span>
      </div>

      <div className="divide-y divide-white/5">
        {fixtures.map((fixture, idx) => (
          <div key={idx} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{fixture.date}</span>
              <span className="text-xs text-gray-400">{fixture.time}</span>
            </div>

            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-1">
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${fixture.homeBadge}.png`}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
                <span className="text-sm text-white truncate">{fixture.home}</span>
              </div>
              <span className="text-xs text-white/30 shrink-0 mx-1">vs</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm text-white truncate">{fixture.away}</span>
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${fixture.awayBadge}.png`}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 px-4 py-3">
        <div className="text-sm font-semibold text-[#C4A23E] mb-3">Recent Results</div>
        <div className="space-y-2">
          {recentResults.map((result, idx) => (
            <div key={idx} className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1 flex-1">
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${result.homeBadge}.png`}
                  alt=""
                  className="w-3 h-3 object-contain"
                />
                <span className="text-xs text-white truncate">{result.home}</span>
              </div>
              <span className="text-sm font-semibold text-white tabular-nums">{result.homeScore}</span>
              <span className="text-white/30">-</span>
              <span className="text-sm font-semibold text-white tabular-nums">{result.awayScore}</span>
              <div className="flex items-center gap-1 flex-1 justify-end">
                <span className="text-xs text-white truncate">{result.away}</span>
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/${result.awayBadge}.png`}
                  alt=""
                  className="w-3 h-3 object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
