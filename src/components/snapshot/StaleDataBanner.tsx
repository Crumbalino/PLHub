'use client'

import { useEffect, useState } from 'react'

interface StaleDataBannerProps {
  visible?: boolean
}

export default function StaleDataBanner({ visible = true }: StaleDataBannerProps) {
  const [staleInfo, setStaleInfo] = useState<{ ageMinutes: number; ageHours: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLatestStoryAge = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          const data = await response.json()
          const latestStoryCheck = data.checks?.latest_story

          if (latestStoryCheck && latestStoryCheck.age_minutes !== undefined) {
            const ageMinutes = latestStoryCheck.age_minutes
            const ageHours = Math.floor(ageMinutes / 60)

            // Show banner only if older than 2 hours
            if (ageMinutes > 120) {
              setStaleInfo({ ageMinutes, ageHours })
            } else {
              setStaleInfo(null)
            }
          }
        }
      } catch (err) {
        console.error('[StaleDataBanner] Error fetching health:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLatestStoryAge()
    // Recheck every 5 minutes
    const interval = setInterval(fetchLatestStoryAge, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!visible || isLoading || !staleInfo) {
    return null
  }

  return (
    <div
      className="mb-4 px-3 py-2 rounded-lg text-xs sm:text-sm"
      style={{
        background: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        color: 'var(--plh-text-60)',
      }}
    >
      ⚠️ Last updated {staleInfo.ageHours > 0 ? `${staleInfo.ageHours} hours` : `${staleInfo.ageMinutes} minutes`} ago
    </div>
  )
}
