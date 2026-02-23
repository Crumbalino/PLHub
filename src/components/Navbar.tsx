import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-transparent">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-brand-teal">PL</span><span className="text-white">Hub</span>
          </span>
        </Link>
      </div>
    </nav>
  )
}
