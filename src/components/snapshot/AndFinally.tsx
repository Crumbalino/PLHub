'use client'

import ModuleTile from './ModuleTile'
import SnapshotStoryItem from './SnapshotStoryItem'
import type { FeedPost } from '@/lib/types'

interface AndFinallyProps {
  story: FeedPost | null
}

export default function AndFinally({ story }: AndFinallyProps) {
  // Don't render if there's no story
  if (!story) {
    return null
  }

  return (
    <ModuleTile icon="😏" label="And Finally">
      <div className="space-y-0">
        <SnapshotStoryItem
          id={story.id}
          title={story.title}
          summary={story.summary}
          previewBlurb={story.previewBlurb}
          source={story.sourceInfo.name}
          clubs={story.clubs}
          indexScore={story.indexScore}
          timeDisplay={story.timeDisplay}
          isLast={true}
        />
      </div>
    </ModuleTile>
  )
}
