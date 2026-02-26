export default function SkeletonCard() {
  return (
    <div className="rounded-lg bg-[#152B2E] border border-white/5 border-l-[3px] border-l-[#00555A] p-6 md:p-6">
      {/* Header row skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 rounded bg-white/5 animate-pulse" />
        <div className="w-20 h-5 rounded bg-white/5 animate-pulse" />
        <div className="flex-1" />
        <div className="w-16 h-4 rounded bg-white/5 animate-pulse" />
      </div>

      {/* Image skeleton - 16:9 aspect ratio */}
      <div className="aspect-[16/9] rounded-lg bg-white/5 animate-pulse mb-4 max-h-[160px] md:max-h-[200px]" />

      {/* Headline skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-6 bg-white/5 rounded animate-pulse" />
        <div className="h-6 bg-white/5 rounded animate-pulse w-5/6" />
      </div>

      {/* Summary skeleton */}
      <div className="border-l-2 border-l-[#00555A] pl-4 mb-4 space-y-2">
        <div className="h-4 bg-white/5 rounded animate-pulse" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
      </div>

      {/* CTA skeleton */}
      <div className="h-4 bg-white/5 rounded animate-pulse w-24 mb-4" />

      {/* Footer skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
      </div>
    </div>
  )
}
