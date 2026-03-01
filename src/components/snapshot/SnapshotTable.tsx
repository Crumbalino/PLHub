'use client'

import ModuleTile from './ModuleTile'
import PLTable from '@/components/PLTable'

export default function SnapshotTable() {
  return (
    <div className="lg:hidden">
      <ModuleTile icon="📊" label="The Table" compact={true}>
        <PLTable />
      </ModuleTile>
    </div>
  )
}
