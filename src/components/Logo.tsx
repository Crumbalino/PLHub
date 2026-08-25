/**
 * @deprecated Import `Wordmark` instead — `src/components/Wordmark.tsx` is the
 * only place the logo is drawn.
 *
 * This re-export exists so nothing breaks if a surface still reaches for the
 * old name. It renders nothing of its own; delete it once no import remains.
 */
export { default, type WordmarkTier } from './Wordmark'
