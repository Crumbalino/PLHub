-- ═══════════════════════════════════════════════════════════════════════════
-- Correction to 2026-08-26-referee-provenance.sql, which is already applied.
--
-- Run this in the Supabase SQL editor. It re-asserts all nine definitions, so
-- it is safe to run once or ten times and leaves the live table byte-identical
-- to src/lib/provenance.ts.
--
-- TWO THINGS DRIFTED, both caught by src/lib/__tests__/live-schema.test.ts:
--
-- 1. COVERAGE. The five career rows said 2014/15. Referee data starts 2000/01.
--    football-data.co.uk publishes E0 back to 1993/94 and the backfill reads
--    all 34 files, but the seven oldest carry only Div, Date, HomeTeam,
--    AwayTeam, FTHG, FTAG and FTR — no Referee column, no card columns. The
--    Referee column first appears in 2000/01, measured across the archive.
--
--    So MATCH coverage reaches 1993/94 and REFEREE coverage starts 2000/01.
--    Conflating them had every career figure implying seven seasons it cannot
--    see. 2014/15 was simply the window the first implementation loaded; the
--    backfill widened the data and left the claim behind.
--
-- 2. APOSTROPHES. The formulas used a straight quote where the code uses a
--    typographic one, so five formulas differed from the code by one
--    character. Using ’ throughout also means no SQL escaping, which removes
--    the class of error rather than fixing one instance of it.
--
-- No key is added, renamed or removed. Only text moves.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO metric_definitions
  (metric_key, source_name, source_url, formula, coverage_period, calculated)
VALUES
  ('referee.matches.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Count of rows in the E0 results file where Referee matches the official.',
   'Premier League, 2026/27', TRUE),

  ('referee.matches.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Count of rows across all loaded E0 seasons where Referee matches the official.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.yellow_cards.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY over the official’s matches.',
   'Premier League, 2026/27', TRUE),

  ('referee.yellow_cards.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY over the official’s matches, all loaded seasons.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.red_cards.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HR + AR over the official’s matches.',
   'Premier League, 2026/27', TRUE),

  ('referee.red_cards.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HR + AR over the official’s matches, all loaded seasons.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.cards_per_game.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY + HR + AR divided by matches refereed. A second yellow is counted by the source as both a yellow and a red, and is not deduplicated here.',
   'Premier League, 2026/27', TRUE),

  ('referee.cards_per_game.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY + HR + AR divided by matches refereed, all loaded seasons. A second yellow is counted by the source as both a yellow and a red, and is not deduplicated here.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.club_record.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Wins, draws and losses for one club in matches refereed by the official, from the FTR column, read from the club’s side.',
   'Premier League, 2000/01 to 2026/27', TRUE)
ON CONFLICT (metric_key) DO UPDATE SET
  source_name     = EXCLUDED.source_name,
  source_url      = EXCLUDED.source_url,
  formula         = EXCLUDED.formula,
  coverage_period = EXCLUDED.coverage_period,
  calculated      = EXCLUDED.calculated;

-- Verify: nine rows, five career at 2000/01, four season at 2026/27, no 2014/15.
SELECT metric_key, coverage_period
FROM metric_definitions
ORDER BY metric_key;
