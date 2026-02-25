'use client'

interface PulseBadgeProps {
  score?: number | null
  size?: 'sm' | 'md' | 'lg'
}

export default function PulseBadge({ score, size = 'md' }: PulseBadgeProps) {
  if (score === undefined || score === null) {
    return null
  }

  const sizeConfig = {
    sm: { container: 'px-2 py-0.5', text: 'text-xs', icon: 'w-3 h-3' },
    md: { container: 'px-2.5 py-1', text: 'text-sm', icon: 'w-3.5 h-3.5' },
    lg: { container: 'px-3 py-1.5', text: 'text-base', icon: 'w-4 h-4' },
  }

  const config = sizeConfig[size]

  return (
    <div className={`inline-flex items-center gap-1 bg-[#1E4A4F] rounded-full border border-[#F5C842]/20 ${config.container}`}>
      <img src="/pulse-icon.png" alt="" className={`object-contain ${config.icon}`} />
      <span className={`font-black text-[#F5C842] tabular-nums ${config.text}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {Math.round(score)}
      </span>
    </div>
  )
}
