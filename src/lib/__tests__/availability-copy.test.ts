/**
 * PAGE_SPEC §7.4 — the availability detail line.
 *
 * The whole point of this function is a line it must not cross: it may drop a
 * null marker or a phrase the status label already carries, and it may not
 * touch the club's description of the injury. Most of these tests exist to hold
 * that line, not to check the formatting.
 *
 * The input strings are the ones FPL actually publishes, taken from live
 * bootstrap-static data for Tottenham on 25 Aug 2026.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { availabilityDetail } from '@/app/tottenham/blocks'

describe('§7.4 return date', () => {
  test('an unknown return date does not render', () => {
    assert.equal(availabilityDetail('Knee injury - Unknown return date'), 'Knee injury')
    assert.equal(
      availabilityDetail('Hamstring injury - Unknown return date'),
      'Hamstring injury'
    )
  })

  test('the marker is matched whatever its case', () => {
    assert.equal(availabilityDetail('Illness - Unknown Return Date'), 'Illness')
    assert.equal(availabilityDetail('Illness - UNKNOWN RETURN DATE'), 'Illness')
  })

  test("FPL's other null markers are dropped too", () => {
    for (const marker of ['TBC', 'TBA', 'N/A', 'Unknown', 'No return date']) {
      assert.equal(
        availabilityDetail(`Knee injury - ${marker}`),
        'Knee injury',
        `marker: ${marker}`
      )
    }
  })

  test('a real return date renders', () => {
    assert.equal(
      availabilityDetail('Ankle injury - Expected back 19 Sep'),
      'Ankle injury · Expected back 19 Sep'
    )
  })

  /** A date that merely contains the word must not be read as the marker. */
  test('a date is not mistaken for a null marker', () => {
    assert.equal(
      availabilityDetail('Knee injury - Return date 19 Sep'),
      'Knee injury · Return date 19 Sep'
    )
  })
})

describe('§7.4 chance of playing', () => {
  test('the words go, the number stays', () => {
    assert.equal(
      availabilityDetail('Thigh injury - 50% chance of playing'),
      'Thigh injury · 50%'
    )
  })

  test('the injury description is untouched, whatever it is', () => {
    assert.equal(
      availabilityDetail('Lack of match fitness - 75% chance of playing'),
      'Lack of match fitness · 75%'
    )
    assert.equal(
      availabilityDetail('Unspecified injury - 50% chance of playing'),
      'Unspecified injury · 50%'
    )
  })

  test('0% and 100% are percentages like any other', () => {
    assert.equal(availabilityDetail('Knee injury - 0% chance of playing'), 'Knee injury · 0%')
    assert.equal(
      availabilityDetail('Knee injury - 100% chance of playing'),
      'Knee injury · 100%'
    )
  })

  test('a percentage in some other sentence is left alone', () => {
    assert.equal(
      availabilityDetail('Knee injury - 50% fit per the club'),
      'Knee injury · 50% fit per the club'
    )
  })
})

describe('§7.4 verbatim contract', () => {
  /**
   * The load-bearing test. Whatever else happens to the line, the club's
   * wording for the injury survives it character for character.
   */
  test('the injury description is never altered', () => {
    const injuries = [
      'Knee injury',
      'Hamstring injury',
      'Thigh injury',
      'Groin injury',
      'Lack of match fitness',
      'Unspecified injury',
      'Illness',
      'Personal reasons',
      "Achilles' tendon injury",
    ]
    for (const injury of injuries) {
      for (const tail of ['Unknown return date', '50% chance of playing', 'Expected back 19 Sep']) {
        const out = availabilityDetail(`${injury} - ${tail}`)
        assert.ok(
          out.startsWith(injury),
          `"${injury}" was altered to "${out}"`
        )
      }
    }
  })

  test('a string with no separator passes straight through', () => {
    assert.equal(availabilityDetail('Suspended until 19 Sep'), 'Suspended until 19 Sep')
    assert.equal(availabilityDetail('Returned to training'), 'Returned to training')
    assert.equal(
      availabilityDetail('Has joined Wolfsburg on loan'),
      'Has joined Wolfsburg on loan'
    )
  })

  test('only the first separator splits — later ones belong to the date', () => {
    assert.equal(
      availabilityDetail('Knee injury - Expected back 19 Sep - see club statement'),
      'Knee injury · Expected back 19 Sep - see club statement'
    )
  })
})

describe('§7.4 degenerate input', () => {
  test('empty in, empty out', () => {
    assert.equal(availabilityDetail(''), '')
    assert.equal(availabilityDetail('   '), '')
  })

  test('a dangling separator does not survive as punctuation', () => {
    assert.equal(availabilityDetail('Knee injury - '), 'Knee injury')
    assert.equal(availabilityDetail('Knee injury -'), 'Knee injury')
  })

  test('surrounding whitespace is trimmed', () => {
    assert.equal(availabilityDetail('  Knee injury - Unknown return date  '), 'Knee injury')
  })

  test('never returns a line ending in the separator', () => {
    for (const s of ['Knee injury - ', 'Knee injury -', 'Knee injury - Unknown return date']) {
      assert.ok(!availabilityDetail(s).endsWith('-'), s)
      assert.ok(!availabilityDetail(s).endsWith('·'), s)
    }
  })
})
