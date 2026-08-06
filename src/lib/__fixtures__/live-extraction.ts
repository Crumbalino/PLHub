// The 10 claims returned by a real claude-opus-5 extraction over SAMPLE_24 on
// 2026-08-06, recorded verbatim from the API response.
//
// Frozen so the verification guard is tested against genuine model output
// rather than hand-written stubs. Claim #4 (Antonee Robinson) contains the
// Fulham fabrication: the model supplied from_club "Fulham" from its own
// knowledge for text reading only "Man United are looking at USMNT's Antonee
// Robinson." That row is the reason verify-claim.ts exists.

import type { RawClaim } from '@/lib/extract-claims'

export interface LiveExtraction {
  /** Index into SAMPLE_24. */
  articleN: number
  claims: RawClaim[]
}

const base = {
  is_completed_event: false,
  is_self_reported: false,
  fee_raw: null,
  fee_amount: null,
  fee_currency: null,
  deadline_raw: null,
} as const

export const LIVE_EXTRACTION: LiveExtraction[] = [
  {
    articleN: 3,
    claims: [{
      ...base,
      player_name: 'Ferran Torres',
      to_club: null,
      from_club: 'Barcelona',
      type: 'exit_sought',
      hedge_text: 'leaving the door open to a potential move away from the club',
      claim_text: 'Ferran Torres has come under fire from Barcelona supporters after leaving the door open to a potential move away from the club.',
      origin: 'none',
      origin_raw: null,
    }],
  },
  {
    articleN: 6,
    claims: [{
      ...base,
      player_name: 'Raul Jimenez',
      to_club: 'Wolves',
      from_club: null,
      type: 'deal_agreed',
      is_completed_event: true,
      hedge_text: null,
      claim_text: 'Raul Jimenez is back at Wolves.',
      origin: 'none',
      origin_raw: null,
    }],
  },
  {
    articleN: 11,
    claims: [
      {
        ...base,
        player_name: 'Yan Diomandé',
        to_club: 'Real Madrid',
        from_club: 'RB Leipzig',
        type: 'deal_agreed',
        hedge_text: 'It is understood that',
        claim_text: 'Real Madrid have agreed a club-record fee of €135m (£115.7m) with RB Leipzig for Yan Diomande',
        origin: 'none',
        origin_raw: null,
        fee_raw: '€135m',
        fee_amount: 135000000,
        fee_currency: 'EUR',
      },
      {
        ...base,
        player_name: 'Vinícius Júnior',
        to_club: 'Arsenal',
        from_club: 'Real Madrid',
        type: 'interest',
        hedge_text: 'are confident of warding off Arsenal’s interest',
        claim_text: 'confident of warding off Arsenal’s interest in Vinícius Júnior',
        origin: 'none',
        origin_raw: null,
      },
      {
        ...base,
        player_name: 'Yan Diomandé',
        to_club: 'Paris Saint-Germain',
        from_club: 'RB Leipzig',
        type: 'deal_off',
        hedge_text: null,
        claim_text: 'several weeks of negotiations that saw Paris Saint-Germain pull out of the race',
        origin: 'none',
        origin_raw: null,
      },
    ],
  },
  {
    // THE FULHAM CASE. "Fulham" appears nowhere in the article text.
    articleN: 14,
    claims: [{
      ...base,
      player_name: 'Antonee Robinson',
      to_club: 'Manchester United',
      from_club: 'Fulham',
      type: 'interest',
      hedge_text: 'are looking at',
      claim_text: "Man United are looking at USMNT's Antonee Robinson.",
      origin: 'vague',
      origin_raw: 'Transfer Talk',
    }],
  },
  {
    articleN: 17,
    claims: [{
      ...base,
      player_name: 'Rodri',
      to_club: 'Real Madrid',
      from_club: 'Manchester City',
      type: 'interest',
      hedge_text: 'looked set to',
      claim_text: 'Rodri looked set to join Real Madrid this summer',
      origin: 'vague',
      origin_raw: 'report',
    }],
  },
  {
    articleN: 19,
    claims: [{
      ...base,
      player_name: 'Vinicius Jr.',
      to_club: 'Arsenal',
      from_club: 'Real Madrid',
      type: 'interest',
      hedge_text: 'but does the Brazilian really have any intention of leaving Spain?',
      claim_text: 'Vinicius Jr. is the at the centre of a tug-of-war between Arsenal and Real Madrid',
      origin: 'none',
      origin_raw: null,
    }],
  },
  {
    articleN: 21,
    claims: [{
      ...base,
      player_name: 'Bruno Guimaraes',
      to_club: 'Arsenal',
      from_club: 'Newcastle United',
      type: 'bid_accepted',
      hedge_text: 'moved a step closer to',
      claim_text: 'they moved a step closer to signing Newcastle captain and midfielder Bruno Guimaraes',
      origin: 'none',
      origin_raw: null,
    }],
  },
  {
    articleN: 22,
    claims: [{
      ...base,
      player_name: 'Bruno Guimaraes',
      to_club: 'Arsenal',
      from_club: null,
      type: 'deal_agreed',
      is_completed_event: true,
      hedge_text: null,
      claim_text: 'Why Arsenal had to sign Bruno Guimaraes',
      origin: 'none',
      origin_raw: null,
    }],
  },
]
