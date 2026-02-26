'use client'

import Link from 'next/link'
import Image from 'next/image'

function NavbarContent() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center h-24 relative">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/plhub-logo.png"
            alt="PLHub"
            width={72}
            height={72}
            priority
            unoptimized
            className="h-16 w-auto"
          />
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
