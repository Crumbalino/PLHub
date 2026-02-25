'use client'

import { useSearchParams } from 'next/navigation'

export default function MobileSortNav() {
  const searchParams = useSearchParams()
  const sort = (searchParams.get('sort') as string | null) ?? 'index'

  return (
    <div className="sm:hidden flex gap-2 px-4 py-2 border-t border-white/[0.06] justify-center">
      <a href="/?sort=index" className={`px-3 py-1.5 rounded-full transition-colors text-xs ${sort === 'index' ? 'bg-[#F5C842] text-black font-bold' : 'text-white/50 hover:text-white'}`}>
        Pulse
      </a>
      <a href="/?sort=hot" className={`px-3 py-1.5 rounded-full transition-colors text-xs ${sort === 'hot' ? 'bg-[#F5C842] text-black font-bold' : 'text-white/50 hover:text-white'}`}>
        Hot
      </a>
      <a href="/?sort=new" className={`px-3 py-1.5 rounded-full transition-colors text-xs ${sort === 'new' ? 'bg-[#F5C842] text-black font-bold' : 'text-white/50 hover:text-white'}`}>
        New
      </a>
    </div>
  )
}
