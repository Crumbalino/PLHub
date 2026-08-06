import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  verifyClaim, verifyClaims, appearsIn, normalise, buildAliasIndex, emptyAliasIndex,
  appearsViaAlias,
} from '@/lib/verify-claim'
import type { RawClaim } from '@/lib/extract-claims'
import { SAMPLE_24 } from '@/lib/__fixtures__/sample-24'
import { LIVE_EXTRACTION } from '@/lib/__fixtures__/live-extraction'
import { CLUB_ALIASES, PLAYER_ALIASES, PLAYER_IDS } from '@/lib/__fixtures__/aliases'

/** Production runs with the alias tables loaded; tests must mirror that. */
const ALIASES = buildAliasIndex(PLAYER_ALIASES, CLUB_ALIASES)

const article = (n: number) => SAMPLE_24.find((a) => a.n === n)!
const claimsFor = (n: number) => LIVE_EXTRACTION.find((e) => e.articleN === n)!.claims

const stub = (over: Partial<RawClaim> = {}): RawClaim => ({
  player_name: 'Bruno Guimaraes', to_club: 'Arsenal', from_club: null,
  type: 'interest', is_completed_event: false, hedge_text: null,
  claim_text: 'x', origin: 'none', origin_raw: null, is_self_reported: false,
  fee_raw: null, fee_amount: null, fee_currency: null, deadline_raw: null,
  ...over,
})

describe('normalise / appearsIn', () => {
  test('folds accents so Vinícius matches Vinicius', () => {
    assert.equal(normalise('Vinícius Júnior'), 'vinicius junior')
    assert.ok(appearsIn('Vinicius Junior', 'we discuss Vinícius Júnior today'))
  })
  test('folds typographic apostrophes', () => {
    assert.ok(appearsIn("Arsenal's interest", 'warding off Arsenal’s interest'))
  })
  test('is case-insensitive and whitespace-tolerant', () => {
    assert.ok(appearsIn('MANCHESTER   UNITED', 'to manchester united today'))
  })
  test('empty string never counts as present', () => {
    assert.equal(appearsIn('', 'anything'), false)
  })
})

describe('the Fulham case — fabricated from_club is caught and nulled', () => {
  const a = article(14)
  const [robinson] = claimsFor(14)

  test('the fixture really is the fabrication (Fulham absent from source)', () => {
    assert.equal(robinson.from_club, 'Fulham')
    assert.ok(
      !`${a.title} ${a.content}`.toLowerCase().includes('fulham'),
      'precondition: the article must not mention Fulham',
    )
  })

  test('from_club is nulled, and the claim survives', () => {
    const r = verifyClaim(robinson, a.title, a.content, ALIASES)
    assert.equal(r.rejected, false, 'a fabricated club nulls a field, it does not kill the claim')
    assert.equal(r.claim!.from_club, null, 'Fulham must be nulled')
    assert.ok(r.nulled.includes('from_club'))
  })

  test('the verifiable fields on the same claim are preserved', () => {
    const r = verifyClaim(robinson, a.title, a.content, ALIASES)
    assert.equal(r.claim!.player_name, 'Antonee Robinson')
    assert.equal(r.claim!.to_club, 'Manchester United', 'resolved via the "Man United" alias')
    assert.equal(r.claim!.hedge_text, 'are looking at')
  })

  test('WITHOUT club aliases the same claim is rejected — the alias table is load-bearing', () => {
    // The article says "Man United", not "Manchester United". With no alias
    // index both club sides null out and claims_club_side_present fails. This
    // is why club_aliases must be populated before the extractor writes.
    const r = verifyClaim(robinson, a.title, a.content, emptyAliasIndex())
    assert.equal(r.rejected, true)
    assert.equal(r.rejectReason, 'no_club_side')
  })
})

describe('player verification', () => {
  test('rejects a player absent from the source', () => {
    const a = article(21)
    const r = verifyClaim(stub({ player_name: 'Erling Haaland' }), a.title, a.content)
    assert.equal(r.rejected, true)
    assert.equal(r.rejectReason, 'player_not_in_text')
    assert.equal(r.claim, null)
  })

  test('rejects an empty player name', () => {
    const a = article(21)
    assert.equal(verifyClaim(stub({ player_name: '  ' }), a.title, a.content).rejectReason, 'empty_player_name')
  })

  test('accepts a player present only under an alias', () => {
    const aliases = buildAliasIndex(
      [{ alias: 'Bruno Guimaraes', player_id: PLAYER_IDS.brunoGuimaraes },
       { alias: 'Bruno G', player_id: PLAYER_IDS.brunoGuimaraes }],
      CLUB_ALIASES,
    )
    // Source says "Bruno Guimaraes"; the model returned the short alias.
    const a = article(21)
    const r = verifyClaim(stub({ player_name: 'Bruno G' }), a.title, a.content, aliases)
    assert.equal(r.rejected, false, 'alias resolution must accept a known variant')
  })
})

describe('ambiguous aliases — two players, one shared short form', () => {
  // player_aliases.alias is not globally unique: 'Silva' names two people.
  // A Map<string, string> index would keep only whichever row loaded last, so
  // every future 'Silva' would resolve to that one — the bug dropping the DB
  // constraint removes, reappearing in the index built from it.
  const named = (who: string) =>
    `Arsenal are close to signing ${who} from Manchester City.`

  test('the index keeps BOTH owners of a shared alias', () => {
    const owners = ALIASES.players.get('silva')
    assert.equal(owners?.length, 2, 'a shared alias must not be overwritten')
    assert.ok(owners!.includes(PLAYER_IDS.bernardoSilva))
    assert.ok(owners!.includes(PLAYER_IDS.thiagoSilva))
  })

  test('an unambiguous second alias resolves to the right player', () => {
    // Text names Bernardo only. The model returned the full name.
    const r = verifyClaim(
      stub({ player_name: 'Bernardo Silva', to_club: 'Arsenal' }),
      named('Bernardo'), null, ALIASES,
    )
    assert.equal(r.rejected, false, '"Bernardo" is unambiguous and corroborates')
  })

  test('and does NOT silently pick the other one', () => {
    // Same text. Thiago is not in it, and must not inherit Bernardo's evidence.
    const r = verifyClaim(
      stub({ player_name: 'Thiago Silva', to_club: 'Arsenal' }),
      named('Bernardo'), null, ALIASES,
    )
    assert.equal(r.rejected, true)
    assert.equal(r.rejectReason, 'player_not_in_text')
  })

  test('a shared alias alone corroborates neither', () => {
    // "Silva" proves a Silva is discussed, not which. Attributing it to one of
    // them is a coin flip, and a wrong attribution corrupts that player's
    // ledger. Rejecting is the safe direction; the resolver can revisit.
    for (const who of ['Bernardo Silva', 'Thiago Silva']) {
      const r = verifyClaim(
        stub({ player_name: who, to_club: 'Arsenal' }),
        named('Silva'), null, ALIASES,
      )
      assert.equal(r.rejected, true, `${who} must not be confirmed by "Silva" alone`)
      assert.equal(r.rejectReason, 'player_not_in_text')
    }
  })

  test('a full name written out still matches directly', () => {
    assert.ok(appearsViaAlias('Thiago Silva', named('Thiago Silva'), ALIASES.players))
    assert.ok(!appearsViaAlias('Bernardo Silva', named('Thiago'), ALIASES.players))
  })
})

describe('club verification', () => {
  test('rejects when nulling leaves no club on either side', () => {
    const a = article(21)
    const r = verifyClaim(stub({ to_club: 'Juventus', from_club: 'Ajax' }), a.title, a.content)
    assert.equal(r.rejected, true)
    assert.equal(r.rejectReason, 'no_club_side')
  })

  test('keeps the claim when one side survives', () => {
    const a = article(21)
    const r = verifyClaim(stub({ to_club: 'Arsenal', from_club: 'Ajax' }), a.title, a.content)
    assert.equal(r.rejected, false)
    assert.equal(r.claim!.to_club, 'Arsenal')
    assert.equal(r.claim!.from_club, null)
  })
})

describe('verbatim fields', () => {
  test('every hedge in the live extraction is an exact substring of its source', () => {
    const bad: string[] = []
    for (const { articleN, claims } of LIVE_EXTRACTION) {
      const a = article(articleN)
      for (const c of claims) {
        if (c.hedge_text && !appearsIn(c.hedge_text, `${a.title}\n${a.content}`)) {
          bad.push(`#${articleN}: ${JSON.stringify(c.hedge_text)}`)
        }
      }
    }
    assert.deepEqual(bad, [], 'a paraphrased hedge destroys the evidence and must fail')
  })

  test('a paraphrased hedge is nulled', () => {
    const a = article(21)
    const r = verifyClaim(stub({ hedge_text: 'is close to completing a move for' }), a.title, a.content)
    assert.equal(r.claim!.hedge_text, null)
    assert.ok(r.nulled.includes('hedge_text'))
  })

  test('a fabricated fee is nulled together with its parsed values', () => {
    const a = article(21)
    const r = verifyClaim(
      stub({ fee_raw: '£80m', fee_amount: 80000000, fee_currency: 'GBP' }),
      a.title, a.content,
    )
    assert.equal(r.claim!.fee_raw, null)
    assert.equal(r.claim!.fee_amount, null, 'parsed fee is derived — it must not survive its source')
    assert.equal(r.claim!.fee_currency, null)
  })

  test('a real printed fee survives', () => {
    const a = article(11)
    const r = verifyClaim(
      stub({ player_name: 'Yan Diomandé', to_club: 'Real Madrid',
             fee_raw: '€135m', fee_amount: 135000000, fee_currency: 'EUR' }),
      a.title, a.content,
    )
    assert.equal(r.claim!.fee_raw, '€135m')
    assert.equal(r.claim!.fee_amount, 135000000)
  })
})

describe('audit trail', () => {
  test('verifiedAt is stamped on accept AND on reject', () => {
    const a = article(21)
    const ok = verifyClaim(stub(), a.title, a.content)
    const no = verifyClaim(stub({ player_name: 'Nobody At All' }), a.title, a.content)
    for (const r of [ok, no]) {
      assert.ok(!Number.isNaN(Date.parse(r.verifiedAt)), 'verifiedAt must be a valid timestamp')
    }
  })
})

describe('whole live extraction through the guard', () => {
  test('exactly one field is nulled across all 10 claims — the Fulham from_club', () => {
    let nulled = 0
    let accepted = 0
    for (const { articleN, claims } of LIVE_EXTRACTION) {
      const a = article(articleN)
      const r = verifyClaims(claims, a.title, a.content, ALIASES)
      nulled += r.nulledFieldCount
      accepted += r.accepted.length
    }
    assert.equal(accepted, 10, 'all 10 real claims should survive verification')
    assert.equal(nulled, 1, 'exactly the Fulham fabrication should be nulled')
  })
})
