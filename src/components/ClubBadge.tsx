import { Club } from '@/types'

interface ClubBadgeProps {
  club: Club
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'text-lg w-7 h-7',
  md: 'text-2xl w-9 h-9',
  lg: 'text-4xl w-14 h-14',
}

export default function ClubBadge({ club, size = 'md' }: ClubBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${sizeMap[size]}`}
      style={{ backgroundColor: club.primaryColor + '22' }}
      title={club.name}
      aria-label={`${club.name} badge`}
    >
      {club.badgeEmoji}
    </span>
  )
}
