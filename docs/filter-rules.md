# The Football Hub — Content Filter Rules

**Location in repo:** `docs/filter-rules.md`
**Last updated:** March 2026
**Purpose:** Living record of what the content filter covers, why, and when decisions were made. Read this before changing `src/lib/content-filter.ts`.

---

## What We Cover

### Tier 1 — Always covered
- Premier League (all clubs, all stories)
- FA Cup (any round involving English clubs)
- League Cup / Carabao Cup (any round involving English clubs)
- Champions League (English clubs only)
- Europa League (English clubs only)
- Conference League (English clubs only)
- UK national teams: England, Scotland, Wales, Northern Ireland

### Tier 2 — Covered when directly relevant to PL
- Championship: promotion/relegation stories only, or transfers directly involving a PL club (buying, selling)
- Championship loans: not covered
- England players at foreign clubs: covered if story is about PL transfer or international call-up

### Tier 3 — Out of scope
- Scottish Premiership (Celtic, Rangers etc.) as standalone stories
- League One, League Two, National League
- La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie etc. as standalone stories
- Saudi Pro League (Al-Nassr, Al-Hilal etc.)
- MLS, Concacaf, other non-European competitions
- All non-football sport

---

## Active Filter Rules

### ALWAYS_HIDE — fires regardless of source or PL club mention

**Gambling/betting:** bet365, betfair, paddy power, william hill, ladbrokes, coral, skybet, sky bet, betway, unibet, betfred, 888sport, super boost, price boost, enhanced odds, money back, betting tips, free bets, odds boost, accumulator, best football bets, betting offer, bet £10, get £, acca

**Darts:** darts, darts night, darts live, premier league darts, oche, stephen bunting, luke humphries, luke littler

**Boxing/MMA:** boxing, mma, ufc, conor benn, tyson fury, undercard, fury-, fight night, ring walk, dana white, usyk, canelo, weigh-in, bout, ronda rousey, farewell fight, trilogy fight

**Other sport:** cricket, rugby, nfl, nba, wnba, mlb, nhl, nascar, golf, tennis, swimming, athletics, olympic, commonwealth games, six nations, premiership rugby, t20 world cup, ashes, test match, indian premier league, super bowl, quarterback, touchdown

**Non-PL football leagues:** saudi pro league, al-nassr, al-hilal, al-ittihad, al-fayha, qatar league, ligue 1, serie a, la liga, eredivisie, liga nos, bundesliga, segunda division, el clasico, copa del rey, dfb pokal, coupe de france, swiss super league, mls cup, concacaf, celtic, rangers, scottish, league one, league two, vanarama, national league, efl, plymouth, charlton

**Horse racing:** horse racing, racing tips, grand national, cheltenham, horse race, jockey, flat racing, jump racing

**Snooker:** snooker, world snooker, crucible

**F1:** formula 1, formula one, grand prix, f1 race

**Women's football (non-PL):** women's super league, wsl, women's fa cup

**Youth football:** under-21, u21 championship, youth cup

**Streaming/broadcast noise:** nbc network, nbc shakeup, premflix, singapore streaming, screen all premier league, direct-to-consumer

**World Cup:** world cup
*(National team stories pass via national team keywords, not world cup mentions)*

**Misc noise:** biggest loss in english football, greatest loss in english football, biggest defeat in english football, record defeat in english football, ronaldo buys, ronaldo live, al-fayha vs, cameron trilogy, red bull chief, sprinkler pitch, eric ramsay, american football, champions league cash

---

### PL_COMPETITIONS allow-list — stories pass if any of these appear

- premier league
- fa cup
- league cup
- carabao cup
- champions league
- europa league
- conference league *(English clubs only — relies on PL club name also appearing)*
- community shield
- premier league promotion
- promotion to the premier league
- england squad
- england international
- england manager
- three lions
- scotland squad
- wales squad
- northern ireland squad

---

### PL_CLUBS allow-list — stories pass if any club name appears

Arsenal, Aston Villa, Bournemouth, Brentford, Brighton, Chelsea, Crystal Palace, Everton, Fulham, Ipswich, Leicester, Liverpool, Man City, Manchester City, Man Utd, Manchester United, Newcastle, Nottingham Forest, Forest, Southampton, Spurs, Tottenham, West Ham, Wolves

---

## Decisions Log

**March 2026 — Filter rules doc created**
- Defined Tier 1/2/3 scope based on editorial direction session
- Removed `carabao cup` from ALWAYS_HIDE (it was blocking league cup stories — bug)
- Removed `conference league` and `europa conference` from ALWAYS_HIDE (English clubs in these competitions should be covered; gated by PL club name appearing)
- Added `conference league` to PL_COMPETITIONS allow-list
- Added national team terms to PL_COMPETITIONS allow-list: england squad, england international, england manager, three lions, scotland squad, wales squad, northern ireland squad
- Added `premier league promotion` and `promotion to the premier league` to PL_COMPETITIONS allow-list for Championship stories about PL promotion
- Kept `world cup` in ALWAYS_HIDE (national team stories should enter via squad/manager keywords, not world cup references which are too noisy)
- Championship loans explicitly out of scope
- Women's football, youth football remain out of scope for now

---

## Notes for Future Changes

- Before adding a new keyword to ALWAYS_HIDE, check it won't catch legitimate PL stories (e.g. `championship` would block legitimate content — use `championship goal` as a specific phrase instead)
- Conference League English clubs stories rely on both the competition name AND a PL club name appearing — if a story only mentions the competition without naming the club, it may still slip through. Monitor.
- `forest` as a club shortname could theoretically catch non-football stories — watch for false positives
- If The Football Hub expands scope beyond English football (La Liga etc.), this document and the filter need a significant rethink before touching the code
