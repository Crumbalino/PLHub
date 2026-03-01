export default function SkeletonCard() {
  return (
    <div className="bg-[var(--plh-card)] rounded-xl overflow-hidden border-l-2 border-l-[var(--plh-teal)]">
      {/* Image placeholder */}
      <div className="w-full h-[200px] animate-pulse" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />

      {/* Content area */}
      <div className="px-5 pt-4 pb-5">
        {/* Headline lines */}
        <div className="mb-2">
          <div className="h-6 w-3/4 rounded animate-pulse" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
        </div>
        <div className="mb-3">
          <div className="h-6 w-1/2 rounded animate-pulse" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--plh-border)]">
          <div className="h-4 w-full rounded animate-pulse" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
        </div>
      </div>
    </div>
  )
}
