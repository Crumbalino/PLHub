export const COMPETITIONS = {
  PL: {
    id: 'PL',
    slug: 'premier-league',
    name: 'Premier League',
    shortName: 'Premier League',
    country: 'England',
    footballDataId: 'PL',
    footballDataNumericId: 2021,
    apiSportsId: 39,
    season: '2024/25',
    isActive: true,
    rssKeywords: ['premier league', 'epl', 'prem'],
  },
  UCL: {
    id: 'UCL',
    slug: 'champions-league',
    name: 'UEFA Champions League',
    shortName: 'Champions League',
    country: 'Europe',
    footballDataId: 'CL',
    footballDataNumericId: 2001,
    apiSportsId: 2,
    season: '2024/25',
    isActive: false,
    rssKeywords: ['champions league', 'ucl'],
  },
  FAC: {
    id: 'FAC',
    slug: 'fa-cup',
    name: 'FA Cup',
    shortName: 'FA Cup',
    country: 'England',
    footballDataId: 'FAC',
    footballDataNumericId: 2055,
    apiSportsId: 45,
    season: '2024/25',
    isActive: false,
    rssKeywords: ['fa cup'],
  },
  ELC: {
    id: 'ELC',
    slug: 'league-cup',
    name: 'Carabao Cup',
    shortName: 'League Cup',
    country: 'England',
    footballDataId: 'ELC',
    footballDataNumericId: 2016,
    apiSportsId: 48,
    season: '2024/25',
    isActive: false,
    rssKeywords: ['carabao cup', 'league cup', 'efl cup'],
  },
  EL: {
    id: 'EL',
    slug: 'europa-league',
    name: 'UEFA Europa League',
    shortName: 'Europa League',
    country: 'Europe',
    footballDataId: 'EL',
    footballDataNumericId: 2146,
    apiSportsId: 3,
    season: '2024/25',
    isActive: false,
    rssKeywords: ['europa league', 'uel'],
  },
} as const;

export type CompetitionId = keyof typeof COMPETITIONS;

export function getCompetition(id: CompetitionId) {
  return COMPETITIONS[id];
}

export function getActiveCompetitions() {
  return Object.values(COMPETITIONS).filter(c => c.isActive);
}
