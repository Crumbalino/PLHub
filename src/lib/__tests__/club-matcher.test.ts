import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { classifyClub, matchClubs, wordIn } from '@/lib/club-matcher'
import { alwaysHideReason } from '@/lib/content-filter'

const bbc = (slug: string) => `https://www.bbc.co.uk/sport/football/teams/${slug}`

describe('one signal is never enough', () => {
  test('a club named in passing with no second signal is not classified', () => {
    // "Arsenal" in the body of a story hosted on a generic URL. Real, and the
    // single most common way a loose matcher assigns the wrong page.
    assert.equal(
      classifyClub(
        'Transfer round-up: five clubs chasing the same striker',
        'Arsenal are among the sides said to be watching him.',
        'https://www.bbc.co.uk/sport/football/articles/abc123',
      ),
      null,
    )
  })

  test('a URL slug alone is not enough', () => {
    assert.equal(classifyClub('Match preview', null, bbc('everton')), null)
  })

  test('but name + url classifies', () => {
    assert.equal(
      classifyClub('Everton sign Hackney in £24m deal', null, bbc('everton')),
      'everton',
    )
  })
})

describe('ambiguous tokens are never signals', () => {
  // Each of these names more than one club. None may produce a match on its
  // own, and none may act as the second signal either.
  const ambiguous: [string, string][] = [
    ['United', 'United held on for a point at the death.'],
    ['City', 'City were second best throughout.'],
    ['Forest', 'Forest climbed out of the bottom three.'],
    ['Palace', 'Palace looked dangerous on the break.'],
    ['Albion', 'Albion pushed for a late equaliser.'],
    ['Blues', 'The Blues were frustrated by a low block.'],
    ['Reds', 'The Reds dominated possession without reward.'],
    ['Saints as bare word', 'The Saints marched on.'],
    ['Town', 'Town were relegated on the final day.'],
    ['three-letter code', 'MUN 2-1 TOT was the final score.'],
  ]
  for (const [label, text] of ambiguous) {
    test(`${label} does not classify`, () => {
      assert.equal(classifyClub(text, null, 'https://example.com/football/1'), null)
    })
  }

  test('AFC alone names nothing — AFC Bournemouth needs the club name', () => {
    assert.equal(classifyClub('AFC secure late win', null, 'https://example.com/x'), null)
    assert.equal(
      classifyClub('Bournemouth secure late win', null, bbc('bournemouth')),
      'bournemouth',
    )
  })
})

describe('other sports reusing club names are vetoed', () => {
  // Both of these cleared the two-signal bar on the live corpus before the
  // veto existed: the club name in the text and the same token in the URL.
  test('Warrington Wolves (rugby league) is not Wolverhampton Wanderers', () => {
    assert.equal(
      classifyClub(
        "'Crowd goes wild' as Thewlis powers over to punish Warriors",
        'Warrington Wolves ran in six tries in the Super League clash.',
        'https://www.bbc.co.uk/sport/rugby-league/articles/wolves-warrington',
      ),
      null,
    )
  })

  test('Leicester Tigers (rugby union) is not Leicester City', () => {
    assert.equal(
      classifyClub(
        'Leicester clinch Prem play-off place with bonus-point win at Sale',
        'Leicester Tigers sealed their place with a bonus point at Sale Sharks.',
        'https://www.bbc.co.uk/sport/rugby-union/articles/leicester',
      ),
      null,
    )
  })

  test('the veto does not swallow the football club of the same name', () => {
    assert.equal(
      classifyClub(
        'Wolves complete signing of midfielder',
        'Wolverhampton Wanderers have confirmed the deal.',
        bbc('wolverhampton-wanderers'),
      ),
      'wolves',
    )
  })
})

describe('manager is not a signal, and must not become one again', () => {
  // Point-in-time facts misfile a corpus that spans months. Five managers moved
  // between PL clubs in summer 2026; matching a March story about Chelsea
  // against "Enzo Maresca" would file it under Manchester City.
  test('a manager name plus a club URL is one signal, not two', () => {
    assert.equal(
      classifyClub(
        'Enzo Maresca ready for the new season',
        'The head coach spoke to the media on Tuesday.',
        bbc('manchester-city'),
      ),
      null,
    )
  })

  test('no match ever reports a manager signal', () => {
    const all = [
      matchClubs('Enzo Maresca and Xabi Alonso', null, bbc('chelsea')),
      matchClubs('Roberto De Zerbi arrives', null, bbc('tottenham-hotspur')),
      matchClubs('Arsenal beat Everton at the Emirates Stadium', null, bbc('arsenal')),
    ].flat()
    assert.ok(all.length > 0, 'fixture should produce matches')
    for (const m of all) {
      assert.ok(
        !(m.signals as string[]).includes('manager'),
        `${m.slug} reported a manager signal`,
      )
    }
  })
})

describe('multi-club posts', () => {
  test('most signals wins', () => {
    const m = classifyClub(
      'Bournemouth blow title race wide open with victory at nervous Arsenal',
      'The Emirates Stadium fell silent as Bournemouth held on.',
      bbc('arsenal'),
    )
    assert.equal(m, 'arsenal', 'name+stadium+url beats name alone')
  })

  test('a tie is null, not a coin flip', () => {
    // Two signals each. club_slug holds one value, and filing this under the
    // loser's rival is worse than filing it under neither.
    const hits = matchClubs(
      'Sources: Liverpool beat Newcastle to Munoz deal',
      null,
      'https://www.espn.com/soccer/story/liverpool-newcastle-munoz',
    )
    const qualified = hits.filter((h) => h.signals.length >= 2).map((h) => h.slug).sort()
    assert.deepEqual(qualified, ['liverpool', 'newcastle'])
    assert.equal(
      classifyClub(
        'Sources: Liverpool beat Newcastle to Munoz deal',
        null,
        'https://www.espn.com/soccer/story/liverpool-newcastle-munoz',
      ),
      null,
    )
  })
})

describe('wordIn', () => {
  test('does not match inside a longer word', () => {
    assert.ok(!wordIn('leicester', 'leicestershire county cricket'))
    assert.ok(!wordIn('toon', 'a cartoon character'))
    assert.ok(wordIn('leicester', 'leicester won at home'))
  })
})

describe('ALWAYS_HIDE is whole-word', () => {
  // Each of these silently hid Premier League posts before the fix.
  const falsePositives: [string, string][] = [
    ['mma', 'Le Tissier backs Manchester United to respond with a commanding display'],
    ['efl', 'Arteta asked his players to reflect on the defeat'],
    ['nfl', 'The manager has huge influence in the dressing room'],
    ['ashes', 'Late clashes marred the closing minutes at Anfield'],
  ]
  for (const [kw, text] of falsePositives) {
    test(`"${kw}" no longer fires on a substring`, () => {
      assert.equal(alwaysHideReason(text.toLowerCase()), null)
    })
  }

  test('the real keywords still fire', () => {
    assert.equal(alwaysHideReason('watch the mma event tonight'), 'mma')
    assert.equal(alwaysHideReason('efl cup third round draw'), 'efl')
    assert.equal(alwaysHideReason('the nfl season kicks off'), 'nfl')
    assert.ok(alwaysHideReason('cheltenham festival tips'))
  })

  test('"bout" hides a fight but not the word "about"', () => {
    // The worst of the substring bugs: 'bout' is in ALWAYS_HIDE for boxing,
    // and "about" is one of the commonest words in English.
    assert.equal(alwaysHideReason('the main bout is on saturday'), 'bout')
    assert.equal(alwaysHideReason('what arteta said about the defeat'), null)
  })

  test('keywords ending in punctuation keep matching what follows', () => {
    // 'fury-' is deliberately open-ended; a trailing boundary would break it.
    assert.ok(alwaysHideReason('fury-usyk undercard confirmed'))
  })
})
