// The hero. LOCKED — exactly four elements, in this order:
//
//   1. The Football Hub
//   2. Some of this is true. / Transfer gossip. Scored.
//   3. one email field
//   4. The Balloon Door Awards, October.
//
// Nothing else goes here. No nav, no ad unit, no "coming soon", no social
// icons, no scroll hint. Anything added below the fold goes below the fold.
//
// The copy above is the owner's, verbatim. Only microcopy inside the form is
// a placeholder.
//
// SIZING IS A HARD REQUIREMENT. Traffic is phones, and the form has to be
// visible without scrolling on a 6" screen. The section is sized in `svh`
// (small viewport height), which is the viewport with mobile browser chrome
// VISIBLE — `vh` measures the chrome-hidden height and would push the form
// under the address bar on first paint, which is exactly the failure case.
// Everything is centred in one column with no fixed heights, so it compresses
// rather than overflows on short screens.

import SubscribeForm from './SubscribeForm'

export default function Hero() {
  return (
    <section className="tfh-hero" aria-labelledby="tfh-hero-title">
      <div className="tfh-hero-inner">
        <p className="tfh-hero-name" id="tfh-hero-title">
          The Football Hub
        </p>

        <h1 className="tfh-hero-line">
          <span>Some of this is true.</span>
          <span>Transfer gossip. Scored.</span>
        </h1>

        <SubscribeForm />

        <p className="tfh-hero-awards">The Balloon Door Awards, October.</p>
      </div>
    </section>
  )
}
