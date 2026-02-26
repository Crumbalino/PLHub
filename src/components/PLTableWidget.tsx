'use client'

const standings = [
  { pos: 1, name: "Liverpool", short: "Liverpool", badge: "t14", p: 28, w: 22, d: 4, l: 2, pts: 70 },
  { pos: 2, name: "Arsenal", short: "Arsenal", badge: "t3", p: 28, w: 19, d: 5, l: 4, pts: 62 },
  { pos: 3, name: "Nott'm Forest", short: "Forest", badge: "t17", p: 28, w: 17, d: 6, l: 5, pts: 57 },
  { pos: 4, name: "Man City", short: "Man City", badge: "t43", p: 28, w: 16, d: 5, l: 7, pts: 53 },
  { pos: 5, name: "Chelsea", short: "Chelsea", badge: "t8", p: 28, w: 15, d: 7, l: 6, pts: 52 },
  { pos: 6, name: "Aston Villa", short: "Aston Villa", badge: "t7", p: 28, w: 15, d: 5, l: 8, pts: 50 },
  { pos: 7, name: "Brighton", short: "Brighton", badge: "t36", p: 28, w: 14, d: 7, l: 7, pts: 49 },
  { pos: 8, name: "Bournemouth", short: "Bournemouth", badge: "t91", p: 28, w: 14, d: 6, l: 8, pts: 48 },
  { pos: 9, name: "Newcastle", short: "Newcastle", badge: "t4", p: 28, w: 13, d: 7, l: 8, pts: 46 },
  { pos: 10, name: "Fulham", short: "Fulham", badge: "t54", p: 28, w: 12, d: 8, l: 8, pts: 44 },
  { pos: 11, name: "Brentford", short: "Brentford", badge: "t94", p: 28, w: 12, d: 5, l: 11, pts: 41 },
  { pos: 12, name: "Man Utd", short: "Man Utd", badge: "t1", p: 28, w: 10, d: 7, l: 11, pts: 37 },
  { pos: 13, name: "West Ham", short: "West Ham", badge: "t21", p: 28, w: 10, d: 6, l: 12, pts: 36 },
  { pos: 14, name: "Spurs", short: "Spurs", badge: "t6", p: 28, w: 10, d: 4, l: 14, pts: 34 },
  { pos: 15, name: "Everton", short: "Everton", badge: "t11", p: 28, w: 8, d: 9, l: 11, pts: 33 },
  { pos: 16, name: "Crystal Palace", short: "Palace", badge: "t31", p: 28, w: 7, d: 9, l: 12, pts: 30 },
  { pos: 17, name: "Wolves", short: "Wolves", badge: "t39", p: 28, w: 7, d: 7, l: 14, pts: 28 },
  { pos: 18, name: "Leicester", short: "Leicester", badge: "t13", p: 28, w: 6, d: 6, l: 16, pts: 24 },
  { pos: 19, name: "Ipswich", short: "Ipswich", badge: "t40", p: 28, w: 4, d: 8, l: 16, pts: 20 },
  { pos: 20, name: "Southampton", short: "Southampton", badge: "t20", p: 28, w: 3, d: 5, l: 20, pts: 14 },
]

export default function PLTableWidget() {
  return (
    <div className="rounded-xl bg-[#152B2E] border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <span className="text-sm font-semibold text-[#C4A23E]">Premier League</span>
          <span className="text-[10px] text-gray-400 ml-2">2025/26</span>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {standings.map((entry) => (
          <div
            key={entry.pos}
            className="grid grid-cols-[20px_1fr_20px_20px_28px] gap-2 px-4 py-2 hover:bg-white/[0.03] transition-colors items-center text-xs border-l-2"
            style={{
              borderLeftColor: entry.pos <= 4 ? '#22c55e' : entry.pos >= 18 ? '#ef4444' : 'transparent',
            }}
          >
            <span className="tabular-nums font-semibold text-white">{entry.pos}</span>

            <div className="flex items-center gap-2 min-w-0">
              <img
                src={`https://resources.premierleague.com/premierleague/badges/${entry.badge}.png`}
                alt=""
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="text-white/80 truncate text-xs">{entry.short}</span>
            </div>

            <span className="text-white/50 tabular-nums text-center">{entry.p}</span>
            <span className="text-white/50 tabular-nums text-center">{entry.w}</span>
            <span className="text-white font-bold tabular-nums text-center">{entry.pts}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 px-4 py-2 border-t border-white/5 text-[10px]">
        <span className="text-green-400/70">■ UCL</span>
        <span className="text-red-400/70">■ Relegation</span>
      </div>
    </div>
  )
}
