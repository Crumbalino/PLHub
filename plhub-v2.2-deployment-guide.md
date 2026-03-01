# PLHub v2.2 — Deployment Guide

## What's in the zip

**19 files updated.** Extract and drop them into your project — they mirror the existing folder structure exactly.

```
tailwind.config.ts
src/app/globals.css
src/app/layout.tsx
src/app/unsubscribe/page.tsx
src/app/clubs/[slug]/page.tsx
src/components/Navbar.tsx
src/components/SkeletonCard.tsx
src/components/FixturesWidget.tsx
src/components/PLTableWidget.tsx
src/components/DigestSignup.tsx
src/components/AdPlaceholder.tsx
src/components/feed/StoryCard.tsx
src/components/feed/FeedList.tsx
src/components/feed/SortTabs.tsx
src/components/feed/IndexScoreTooltip.tsx
src/components/feed/PulseIcon.tsx
src/lib/constants.ts
src/lib/sources.ts
src/lib/email/digest-template.ts
```

## What changed

### 1. Navbar — Monochrome logo (v2.2)
- "PL" and "HUB" now use `--plh-text-100` (white in dark, navy in light)
- Diagonal brackets use `--plh-text-100` at 20% opacity (dark) / 15% (light)
- Full-colour logo reserved for marketing, social, merch only
- Sort tab underline switched from gold to pink (`--plh-pink`)

### 2. StoryCard — Three behaviour changes
- **Card tap opens Pundit's Take** — no longer navigates to the source. External link is now "Read original →" inside the expanded drawer only.
- **Share URL points to PLHub** — uses `window.location.origin` (currently the homepage). Ready for `/story/[slug]` when story pages are built.
- **Priority borders** — cards with "LIVE" or "BREAKING" in the title get a pink left border + badge. All other cards keep teal.
- LIVE pulse dot animation added to globals.css

### 3. Full colour purge — Old palette eliminated
Every instance of the old green-teal palette (`#0B1F21`, `#183538`, `#00555A`, `#C4A23E`, `#152B2E`) has been replaced with v2.2 navy tokens:

| Old | New | Token |
|-----|-----|-------|
| `#0B1F21` | `#0D1B2A` | `--plh-bg` |
| `#183538` / `#152B2E` | `#112238` | `--plh-card` |
| `#1D3D41` / `#1A3235` | `#162D45` | `--plh-elevated` |
| `#00555A` | `#3AAFA9` | `--plh-teal` |
| `#C4A23E` | `#D4A843` | `--plh-gold` |
| `white/50`, `gray-400` etc. | `--plh-text-*` | Opacity tokens |

### 4. Source colours updated
`constants.ts` now uses the v2.2 editorial palette (gold for BBC, pink for Sky, teal for Guardian, ice for talkSPORT, violet for Goal, orange for 90min). Source fallback in `sources.ts` updated to teal instead of old gold.

### 5. Focus styles fixed
`:focus-visible` now uses `var(--plh-pink)` instead of hardcoded `#C4A23E`.

### 6. Email template
`digest-template.ts` updated with navy hex codes (emails can't use CSS variables, so these are hardcoded but correct).

### 7. CSS additions
- `--plh-border-hover` token added (was missing)
- `--plh-text-base` RGB triplet added for use in `rgba()` expressions
- `--plh-logo-text` and `--plh-logo-bracket-opacity` tokens for logo
- `livePulse` keyframe animation for LIVE indicator
- Skeleton shimmer now uses `--plh-text-base` for mode-aware shimmer

## How to deploy

```bash
# 1. Unzip into your project root (overwrites existing files)
unzip plhub-v2.2-updates.zip -d /path/to/plhub/

# 2. Check it locally
npm run dev

# 3. Commit
git add -A
git commit -m "v2.2: monochrome nav logo, card tap → drawer, priority borders, full colour purge"

# 4. Push (Vercel auto-deploys)
git push
```

## Files NOT touched
These files were not modified and don't need updating:
- `src/lib/theme.ts` — already uses CSS variables correctly
- `src/lib/types.ts` — no changes needed (LIVE/BREAKING detection is title-based)
- `src/lib/theme-init.ts` — already correct
- `src/components/MatchTicker.tsx` — not reviewed (check manually)
- `src/components/BackToTopButton.tsx` — not reviewed
- `src/components/JsonLd.tsx` — no visual elements
- `src/components/GoogleAnalytics.tsx` — no visual elements
- All API routes — no visual elements
- `src/hooks/*` — no visual elements

## Manual checks after deploy
1. Dark mode: navy backgrounds, warm white text, teal card borders, pink for priority
2. Light mode: cool white backgrounds, navy text, darkened teal/gold
3. Card tap: should open/close Pundit's Take, not navigate away
4. Share button: URL should be PLHub, not the source
5. LIVE/BREAKING stories: pink left border + badge
6. Navbar logo: monochrome (no gold/pink brackets on-site)
7. Sort tab underline: pink not gold
8. Email digest: check colours in inbox preview
