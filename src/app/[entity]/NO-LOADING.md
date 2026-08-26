# Why this route has no `loading.tsx`

PAGE_SPEC §15 asks for a skeleton matching the final geometry. This route
deliberately does not have one, and the reason is a status code.

`loading.tsx` creates a streaming boundary. Next flushes the status line and the
skeleton immediately, then resolves the page underneath it. Anything that
happens after that — `notFound()` in the component, in `generateMetadata`, or
via `dynamicParams: false` — renders the 404 *UI* beneath a `200` that has
already been sent.

Measured on a production build, not assumed:

| slug | with `loading.tsx` | without |
|---|---|---|
| `/tottenham` | 200 | 200 |
| `/not-a-club` | **200** | 404 |
| `/leicester` | **200** | 404 |
| `/transfers` | **200** | 404 |

Clubs live at the root, so this dynamic segment answers for every unmatched
top-level path on an indexable site. A soft 404 there means every misspelling,
every relegated club's old slug and every reserved name returns 200 and is
eligible for indexing.

The skeleton is worth having and this is not a happy trade. If it needs to come
back, the way to get both is a `middleware.ts` that rejects a non-entity slug
before routing begins — the gate then runs before any flush, and `loading.tsx`
can return. That is a bigger change than this PR should carry.
