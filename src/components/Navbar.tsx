'use client'

import Link from 'next/link'

function NavbarContent() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center h-24 relative">
        <Link href="/" className="flex items-center gap-4">
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-5xl font-bold text-white tracking-tight">PLhub</span>
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
