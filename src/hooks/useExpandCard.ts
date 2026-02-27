// ============================================================
// useExpandCard Hook
// Manages which story card's AI summary is currently expanded.
// Only one card can be expanded at a time (accordion behaviour).
// ============================================================

'use client'

import { useState, useCallback } from 'react'

interface UseExpandCardReturn {
  expandedId: string | null
  isExpanded: (id: string) => boolean
  toggle: (id: string) => void
  collapse: () => void
}

export function useExpandCard(): UseExpandCardReturn {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isExpanded = useCallback(
    (id: string) => expandedId === id,
    [expandedId]
  )

  const toggle = useCallback(
    (id: string) => {
      setExpandedId((prev: string | null) => (prev === id ? null : id))
    },
    []
  )

  const collapse = useCallback(() => setExpandedId(null), [])

  return { expandedId, isExpanded, toggle, collapse }
}
