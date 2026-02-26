'use client'

import Link from 'next/link'

function NavbarContent() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center h-14 relative">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">PLhub</span>
        </Link>
        <a
          href="/auth/signin"
          className="absolute right-4 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign in
        </a>
      </div>
    </nav>
  )
}

export default function Navbar() {
  return <NavbarContent />
}
