// Alias fixture for tests, shaped like the player_aliases / club_aliases tables.
//
// Not decoration. Outlets write "Man United" and "Newcastle" where the model
// returns "Manchester United" and "Newcastle United", so without these the
// guard rejects legitimate claims as unverifiable. The alias index is what
// separates "the outlet used a short form" from "the model made it up".

export const CLUB_ALIASES: { alias: string; club_slug: string }[] = [
  { alias: 'Manchester United', club_slug: 'man-utd' },
  { alias: 'Man United',        club_slug: 'man-utd' },
  { alias: 'Man Utd',           club_slug: 'man-utd' },
  { alias: 'United',            club_slug: 'man-utd' },

  { alias: 'Manchester City',   club_slug: 'man-city' },
  { alias: 'Man City',          club_slug: 'man-city' },

  { alias: 'Newcastle United',  club_slug: 'newcastle' },
  { alias: 'Newcastle',         club_slug: 'newcastle' },

  { alias: 'Tottenham Hotspur', club_slug: 'tottenham' },
  { alias: 'Tottenham',         club_slug: 'tottenham' },
  { alias: 'Spurs',             club_slug: 'tottenham' },

  { alias: 'Arsenal',           club_slug: 'arsenal' },
  { alias: 'Gunners',           club_slug: 'arsenal' },
  { alias: 'Wolves',            club_slug: 'wolves' },
  { alias: 'Wolverhampton Wanderers', club_slug: 'wolves' },
  { alias: 'Liverpool',         club_slug: 'liverpool' },
  { alias: 'Chelsea',           club_slug: 'chelsea' },
  { alias: 'Fulham',            club_slug: 'fulham' },

  // Non-PL clubs exist as rows so they can be a from_club (clubs.in_scope=false).
  { alias: 'Real Madrid',       club_slug: 'real-madrid' },
  { alias: 'Barcelona',         club_slug: 'barcelona' },
  { alias: 'RB Leipzig',        club_slug: 'rb-leipzig' },
  { alias: 'Paris Saint-Germain', club_slug: 'psg' },
  { alias: 'PSG',               club_slug: 'psg' },
]

export const PLAYER_ALIASES: { alias: string; player_slug: string }[] = [
  { alias: 'Vinícius Júnior',   player_slug: 'vinicius-junior' },
  { alias: 'Vinicius Jr.',      player_slug: 'vinicius-junior' },
  { alias: 'Vinicius',          player_slug: 'vinicius-junior' },
  { alias: 'Bruno Guimaraes',   player_slug: 'bruno-guimaraes' },
  { alias: 'Bruno Guimarães',   player_slug: 'bruno-guimaraes' },
  { alias: 'Antonee Robinson',  player_slug: 'antonee-robinson' },
  { alias: 'Yan Diomandé',      player_slug: 'yan-diomande' },
  { alias: 'Yan Diomande',      player_slug: 'yan-diomande' },
  { alias: 'Ferran Torres',     player_slug: 'ferran-torres' },
  { alias: 'Raul Jimenez',      player_slug: 'raul-jimenez' },
  { alias: 'Rodri',             player_slug: 'rodri' },
]
