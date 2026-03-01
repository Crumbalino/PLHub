'use client'

import ModuleTile from './ModuleTile'
import SnapshotStoryItem from './SnapshotStoryItem'
import type { FeedPost } from '@/lib/types'

interface BeyondBigSixProps {
  stories: FeedPost[]
}

export default function BeyondBigSix({ stories }: BeyondBigSixProps) {
  if (!stories || stories.length === 0) {
    return null
  }

  return (
    <ModuleTile icon="🔍" label="Beyond the Big Six">
      <div className="space-y-0">
        {stories.map((story, idx) => (
          <SnapshotStoryItem
            key={story.id}
            id={story.id}
            title={story.title}
            summary={story.summary}
            previewBlurb={story.previewBlurb}
            source={story.sourceInfo.name}
            clubs={story.clubs}
            indexScore={story.indexScore}
            timeDisplay={story.timeDisplay}
            isLast={idx === stories.length - 1}
          />
        ))}
      </div>
    </ModuleTile>
  )
}
