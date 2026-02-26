'use client'

function NavbarContent() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21] border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center h-24 relative">
        <a href="/" className="flex items-center">
          <img src="/plhub-logo-v2.png?v=2" alt="PLhub" className="h-14 w-auto" />
        </a>
        <a
          href="/auth/signin"
          className="absolute right-4 text-sm text-white/60 hover:text-white transition-colors cursor-pointer"
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
