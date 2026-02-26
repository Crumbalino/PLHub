export default function SkeletonCard() {
  return (
    <div className="bg-[#152B2E] rounded-xl overflow-hidden border-l-4 border-l-[#00555A]">
      {/* Image placeholder */}
      <div className="w-full h-[200px] bg-white/5 animate-pulse" />

      {/* Content area */}
      <div className="px-5 pt-4 pb-5 space-y-3">
        {/* Headline lines */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/5">
          <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
