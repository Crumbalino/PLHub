'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function NavbarContent() {
  const searchParams = useSearchParams()
  const sort = (searchParams.get('sort') as string | null) ?? 'index'

  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between py-4">
        {/* Logo — left side */}
        <Link href="/" className="flex-shrink-0">
          <Image src="/PLHUBLOGO_strip.png?v=2" alt="PLHub" width={400} height={100} className="object-contain" style={{ height: '40px', width: 'auto' }} />
        </Link>

        {/* Sort controls — center (desktop only) */}
        <div className="hidden sm:flex items-center gap-2">
          <a href="/?sort=index" className={`px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === 'index' ? 'bg-[#00555A] text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
            Pulse
          </a>
          <a href="/?sort=hot" className={`px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === 'hot' ? 'bg-[#00555A] text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
            Hot
          </a>
          <a href="/?sort=new" className={`px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === 'new' ? 'bg-[#00555A] text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
            New
          </a>
        </div>

        {/* Sign in link — right side */}
        <a
          href="/auth/signin"
          className="text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          Sign in
        </a>
      </div>

      {/* Mobile sort tabs — below main navbar */}
      <div className="sm:hidden flex gap-2 px-4 py-2 border-t border-white/5 overflow-x-auto scrollbar-hide justify-center">
        {['Pulse', 'Hot', 'New'].map(tab => (
          <a key={tab} href={`/?sort=${tab.toLowerCase() === 'pulse' ? 'index' : tab.toLowerCase()}`}
            className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${sort === (tab.toLowerCase() === 'pulse' ? 'index' : tab.toLowerCase()) ? 'bg-[#00555A] text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {tab}
          </a>
        ))}
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
