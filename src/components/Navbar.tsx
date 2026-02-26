'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function NavbarContent() {
  const searchParams = useSearchParams()
  const sort = (searchParams.get('sort') as string | null) ?? 'index'
  const club = searchParams.get('club') as string | null

  // Build sort URLs that preserve club filter
  const pulseUrl = club ? `/?club=${club}` : '/'
  const hotUrl = `/?sort=hot${club ? `&club=${club}` : ''}`
  const newUrl = `/?sort=new${club ? `&club=${club}` : ''}`

  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-4 flex items-center h-16 gap-4">
        {/* Logo — left side */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/PLHUBLOGO_strip.png?v=2" alt="PLHub" width={400} height={100} className="object-contain" style={{ height: '48px', width: 'auto' }} />
        </Link>

        {/* Sort controls — center (desktop only) */}
        <div className="hidden sm:flex flex-1 justify-center items-center gap-2">
          <a href={pulseUrl} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === 'index' ? 'bg-[#00555A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            Pulse
          </a>
          <a href={hotUrl} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === 'hot' ? 'bg-[#00555A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            Hot
          </a>
          <a href={newUrl} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === 'new' ? 'bg-[#00555A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            New
          </a>
        </div>

        {/* Sign in link — right side */}
        <a
          href="/auth/signin"
          className="text-sm text-gray-400 hover:text-white transition-colors shrink-0"
        >
          Sign in
        </a>
      </div>

      {/* Mobile sort tabs — below main navbar */}
      <div className="sm:hidden flex gap-2 px-4 py-2 border-t border-white/5 overflow-x-auto scrollbar-hide justify-center">
        {['Pulse', 'Hot', 'New'].map(tab => {
          const tabSort = tab.toLowerCase() === 'pulse' ? 'index' : tab.toLowerCase()
          const tabUrl = tabSort === 'index' ? (club ? `/?club=${club}` : '/') : `/?sort=${tabSort}${club ? `&club=${club}` : ''}`
          return (
            <a key={tab} href={tabUrl}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === tabSort ? 'bg-[#00555A] text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {tab}
            </a>
          )
        })}
      </div>
    </nav>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={<nav className="sticky top-0 z-50 backdrop-blur-sm bg-[#071619]/95 border-b border-white/[0.06]" />}>
      <NavbarContent />
    </Suspense>
  )
}
