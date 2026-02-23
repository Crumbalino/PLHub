import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-brand-teal">PL</span><span className="text-brand-gold">Hub</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <Link href="/" className="transition-colors hover:text-white">
            All News
          </Link>
          <a
            href="https://www.bbc.co.uk/sport/football/premier-league"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            BBC Sport
          </a>
          <a
            href="https://www.reddit.com/r/PremierLeague/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            Reddit
          </a>
        </div>
      </div>
    </nav>
  )
}
