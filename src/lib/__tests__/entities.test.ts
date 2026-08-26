/**
 * The reserved slug registry.
 *
 * The load-bearing test is `no club slug is reserved`. Everything else here
 * supports it.
 *
 * Why it matters more than it looks: clubs live at the root, so a club slug and
 * a top-level route occupy the same namespace. A collision does not throw — one
 * silently shadows the other — and by the time anyone notices, fixing it means
 * changing a club's URL, which costs its rankings. The check is free today and
 * unaffordable later.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  HOMEPAGE_ENTITY,
  RESERVED_SLUGS,
  clubSlugs,
  entitySlugs,
  isEntity,
  isHomepageEntity,
  isReserved,
} from '@/lib/entities'
import { CLUBS } from '@/lib/clubs'

describe('reserved slug registry', () => {
  /** The rule. */
  test('no club slug is reserved', () => {
    const collisions = clubSlugs().filter((slug) => isReserved(slug))
    assert.deepEqual(
      collisions,
      [],
      `club slugs collide with reserved top-level routes: ${collisions.join(', ')}`
    )
  })

  test('the reserved list carries everything §1 names', () => {
    for (const slug of [
      'transfers',
      'matches',
      'search',
      'about',
      'how-it-works',
      'privacy',
      'terms',
      'api',
      'snapshot',
      'deadline-day',
    ]) {
      assert.ok(isReserved(slug), `${slug} is not reserved`)
    }
  })

  test('reserving is case-insensitive, because URLs are matched lowercased', () => {
    assert.ok(isReserved('About'))
    assert.ok(isReserved('HOW-IT-WORKS'))
  })

  test('a name nobody reserved is free', () => {
    assert.ok(!isReserved('tottenham'))
    assert.ok(!isReserved('arsenal'))
  })

  test('the list has no duplicates', () => {
    assert.equal(new Set(RESERVED_SLUGS).size, RESERVED_SLUGS.length)
  })

  /**
   * Routes that exist today and are not reserved would be shadowed by a club
   * of the same name. This catches the reverse of the main test: a page added
   * at the root without being added to the registry.
   */
  test('every existing top-level page is reserved', () => {
    const liveTopLevelRoutes = [
      'about',
      'how-it-works',
      'privacy',
      'deadline-day',
    ]
    for (const route of liveTopLevelRoutes) {
      assert.ok(isReserved(route), `/${route} exists but is not reserved`)
    }
  })
})

describe('entity registry', () => {
  test('twenty clubs plus the league is twenty-one entities', () => {
    assert.equal(clubSlugs().length, 20)
    assert.equal(entitySlugs().length, 21)
  })

  test('the club list comes from the club registry, not a second copy', () => {
    assert.deepEqual(clubSlugs(), CLUBS.map((c) => c.slug).sort())
  })

  test('every club is an entity, and so is the league', () => {
    for (const slug of clubSlugs()) assert.ok(isEntity(slug))
    assert.ok(isEntity(HOMEPAGE_ENTITY))
  })

  test('the league entity is not a club', () => {
    assert.ok(!clubSlugs().includes(HOMEPAGE_ENTITY))
    assert.ok(isHomepageEntity(HOMEPAGE_ENTITY))
    assert.ok(!isHomepageEntity('tottenham'))
  })

  test('a reserved slug is not an entity', () => {
    for (const slug of RESERVED_SLUGS) assert.ok(!isEntity(slug), slug)
  })

  test('an unknown slug is not an entity', () => {
    assert.ok(!isEntity('not-a-club'))
    assert.ok(!isEntity(''))
  })

  test('entity slugs are unique', () => {
    const all = entitySlugs()
    assert.equal(new Set(all).size, all.length)
  })
})
