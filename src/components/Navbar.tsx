'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

export default function Navbar() {
  const searchParams = useSearchParams()
  const sort = (searchParams.get('sort') as string | null) ?? 'index'

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#071619]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-2xl px-4 flex items-center justify-between py-3">
        {/* Logo — left side */}
        <Link href="/">
          <Image src="/PLHUBLOGO_strip.png?v=2" alt="PLHub" width={400} height={100} className="object-contain" style={{ height: '52px', width: 'auto' }} />
        </Link>

        {/* Sort controls — center (desktop only) */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          <a href="/?sort=index" className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sort === 'index' ? 'bg-[#F5C842] text-black font-bold' : 'text-white/70 hover:text-white'}`}>
            Pulse
          </a>
          <a href="/?sort=hot" className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sort === 'hot' ? 'bg-[#F5C842] text-black font-bold' : 'text-white/70 hover:text-white'}`}>
            Hot
          </a>
          <a href="/?sort=new" className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sort === 'new' ? 'bg-[#F5C842] text-black font-bold' : 'text-white/70 hover:text-white'}`}>
            New
          </a>
        </div>

        {/* Sign in link — right side */}
        <a
          href="/auth/signin"
          className="text-xs text-white font-medium hover:text-[#F5C842] transition-colors"
        >
          Sign in
        </a>
      </div>

      {/* Mobile sort tabs — below main navbar */}
      <div className="sm:hidden flex gap-1 px-4 py-2 border-t border-white/[0.06] overflow-x-auto scrollbar-hide">
        {['Pulse', 'Hot', 'New'].map(tab => (
          <a key={tab} href={`/?sort=${tab.toLowerCase() === 'pulse' ? 'index' : tab.toLowerCase()}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sort === (tab.toLowerCase() === 'pulse' ? 'index' : tab.toLowerCase()) ? 'bg-[#F5C842] text-black font-bold' : 'text-white/70 hover:text-white'}`}>
            {tab}
          </a>
        ))}
      </div>
    </nav>
  )
}
