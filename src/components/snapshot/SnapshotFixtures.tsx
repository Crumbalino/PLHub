'use client'

import ModuleTile from './ModuleTile'
import NextFixtures from '@/components/NextFixtures'

export default function SnapshotFixtures() {
  return (
    <div className="lg:hidden">
      <ModuleTile icon="⚽" label="Fixture Focus" compact={true}>
        <NextFixtures />
      </ModuleTile>
    </div>
  )
}
