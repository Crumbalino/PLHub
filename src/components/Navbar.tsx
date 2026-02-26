'use client'

import Link from 'next/link'

function NavbarContent() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center h-14 relative">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="#C4A23E" strokeWidth="2"/>
            <path d="M6 16h6l2-6 4 12 2-6h6" stroke="#C4A23E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-2xl font-bold text-white tracking-tight">PLhub</span>
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
