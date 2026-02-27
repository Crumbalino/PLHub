'use client'

function NavbarContent() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1F21]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-center h-16 relative">
        <a href="/" className="flex items-center">
          <img
            src="/plhub-logo-v2.png?v=2"
            alt="PLhub"
            className="h-10 w-auto"
          />
        </a>
        <a
          href="/auth/signin"
          className="absolute right-4 text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
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
