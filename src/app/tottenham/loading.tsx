/**
 * §15 loading state — a skeleton matching the final geometry. No spinner.
 *
 * The shapes mirror page.tsx exactly: the same container width and padding, the
 * same header block, the same hairline-separated sections at the same spacing.
 * That is the whole point — a skeleton whose geometry differs from the content
 * it replaces causes the layout shift it was supposed to prevent. Both files
 * now read those measurements from the same tokens, so they cannot drift.
 *
 * Four blocks, which is the off-week count. A matchweek render adds two more
 * below the fold, where a shift costs nothing.
 *
 * No pulse and no shimmer: those are decoration, and the design system that
 * would license them does not exist yet.
 */

import { tokens as t } from '@/lib/tokens'

/** A skeleton bar. Width is a layout proportion or a scale step, never a px. */
function Bar({
  width,
  height,
  fill,
  marginTop,
}: {
  width: string
  height: string
  fill: string
  marginTop?: string
}) {
  return (
    <div
      style={{
        width,
        height,
        marginTop,
        borderRadius: t.radius.sm,
        backgroundColor: fill,
      }}
    />
  )
}

export default function Loading() {
  return (
    <article
      className="mx-auto"
      aria-busy="true"
      style={{
        maxWidth: t.measure.page,
        paddingLeft: t.space[4],
        paddingRight: t.space[4],
        paddingTop: t.space[10],
        paddingBottom: t.space[10],
      }}
    >
      <p className="sr-only">Loading the Tottenham snapshot.</p>

      <header aria-hidden="true">
        {/* the h1 */}
        <Bar width={t.space[64]} height={t.space[8]} fill={t.colour.overlay.strong} />
        {/* the updated line */}
        <Bar
          width={t.space[32]}
          height={t.space[4]}
          fill={t.colour.overlay.soft}
          marginTop={t.space[2]}
        />
      </header>

      <div
        aria-hidden="true"
        style={{
          marginTop: t.space[8],
          display: 'flex',
          flexDirection: 'column',
          gap: t.space[6],
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <section
            key={i}
            style={{
              borderTopWidth: t.border.hairline,
              borderTopStyle: 'solid',
              borderTopColor: t.colour.rule,
              paddingTop: t.space[5],
            }}
          >
            {/* the mono block heading */}
            <Bar width={t.space[24]} height={t.space[3]} fill={t.colour.overlay.strong} />
            <div
              style={{
                marginTop: t.space[3],
                display: 'flex',
                flexDirection: 'column',
                gap: t.space[2],
              }}
            >
              <Bar width="75%" height={t.space[6]} fill={t.colour.overlay.soft} />
              <Bar width="50%" height={t.space[4]} fill={t.colour.overlay.soft} />
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
