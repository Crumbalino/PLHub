/**
 * §15 loading state — a skeleton matching the final geometry. No spinner.
 *
 * The shapes mirror page.tsx exactly: the same container width and padding, the
 * same header block, the same hairline-separated sections at the same spacing.
 * That is the whole point — a skeleton whose geometry differs from the content
 * it replaces causes the layout shift it was supposed to prevent.
 *
 * Five blocks, which is the off-week count. A matchweek render adds two more
 * below the fold, where a shift costs nothing.
 *
 * No pulse and no shimmer: those are decoration, and the design system that
 * would license them does not exist yet.
 */

export default function Loading() {
  return (
    <article className="mx-auto max-w-xl px-4 py-10" aria-busy="true">
      <p className="sr-only">Loading the Tottenham snapshot.</p>

      <header aria-hidden="true">
        {/* h1: text-2xl, tracking-tight */}
        <div className="h-8 w-64 rounded bg-white/10" />
        {/* the updated line: text-sm */}
        <div className="mt-2 h-4 w-32 rounded bg-white/5" />
      </header>

      <div className="mt-8 space-y-6" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <section key={i} className="border-t border-white/15 pt-5">
            {/* the mono block heading */}
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-3 space-y-2">
              <div className="h-6 w-3/4 rounded bg-white/5" />
              <div className="h-4 w-1/2 rounded bg-white/5" />
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
