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

// player_aliases keys on player_id (uuid FK to players.id), not on a slug --
// players.slug could not dedupe 'zubimendi' from 'martin-zubimendi', and that
// split corrupts the hit rate. The values are opaque to the matcher, which
// only compares them for equality.
export const PLAYER_IDS = {
  viniciusJunior:  '0f4a1c2e-1111-4a00-9c01-000000000001',
  brunoGuimaraes:  '0f4a1c2e-1111-4a00-9c01-000000000002',
  antoneeRobinson: '0f4a1c2e-1111-4a00-9c01-000000000003',
  yanDiomande:     '0f4a1c2e-1111-4a00-9c01-000000000004',
  ferranTorres:    '0f4a1c2e-1111-4a00-9c01-000000000005',
  raulJimenez:     '0f4a1c2e-1111-4a00-9c01-000000000006',
  rodri:           '0f4a1c2e-1111-4a00-9c01-000000000007',
  bernardoSilva:   '0f4a1c2e-1111-4a00-9c01-000000000008',
  thiagoSilva:     '0f4a1c2e-1111-4a00-9c01-000000000009',
} as const

export const PLAYER_ALIASES: { alias: string; player_id: string }[] = [
  { alias: 'Vinícius Júnior',   player_id: PLAYER_IDS.viniciusJunior },
  { alias: 'Vinicius Jr.',      player_id: PLAYER_IDS.viniciusJunior },
  { alias: 'Vinicius',          player_id: PLAYER_IDS.viniciusJunior },
  { alias: 'Bruno Guimaraes',   player_id: PLAYER_IDS.brunoGuimaraes },
  { alias: 'Bruno Guimarães',   player_id: PLAYER_IDS.brunoGuimaraes },
  { alias: 'Antonee Robinson',  player_id: PLAYER_IDS.antoneeRobinson },
  { alias: 'Yan Diomandé',      player_id: PLAYER_IDS.yanDiomande },
  { alias: 'Yan Diomande',      player_id: PLAYER_IDS.yanDiomande },
  { alias: 'Ferran Torres',     player_id: PLAYER_IDS.ferranTorres },
  { alias: 'Raul Jimenez',      player_id: PLAYER_IDS.raulJimenez },
  { alias: 'Rodri',             player_id: PLAYER_IDS.rodri },

  // THE AMBIGUOUS CASE. 'Silva' names two people, which the table now permits
  // and the old global UNIQUE forbade. Each also has an unambiguous short form,
  // which is the only thing allowed to corroborate one of them specifically.
  { alias: 'Bernardo Silva',    player_id: PLAYER_IDS.bernardoSilva },
  { alias: 'Silva',             player_id: PLAYER_IDS.bernardoSilva },
  { alias: 'Bernardo',          player_id: PLAYER_IDS.bernardoSilva },
  { alias: 'Thiago Silva',      player_id: PLAYER_IDS.thiagoSilva },
  { alias: 'Silva',             player_id: PLAYER_IDS.thiagoSilva },
  { alias: 'Thiago',            player_id: PLAYER_IDS.thiagoSilva },
]
