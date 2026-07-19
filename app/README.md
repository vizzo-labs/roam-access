# Roam Access — web app pilot

An interactive, front-end-only prototype of the Roam Access product, served as static files at
`/app/` alongside the marketing site. No backend, no build step at deploy time.

Imported from the Claude Design project **Roam Access** (`Roam Access Web App.html`), then adapted
for public deployment.

---

## Layout

```
app/
  index.html          host page: metadata, fonts, base + responsive CSS, script order
  src/*.jsx           source of truth — edit these
  js/*.js             compiled output, committed so the site deploys as-is
  vendor/*.js         React 18 UMD (production), self-hosted
  fonts/*.woff2       Inter + JetBrains Mono (variable, latin subset), self-hosted
```

## Building

JSX is compiled ahead of time rather than in the browser:

```bash
npm install     # once
npm run build   # app/src/*.jsx -> app/js/*.js
npm run watch   # rebuild on save
```

**Commit `app/js/` whenever you change `app/src/`.** The deployed site loads `app/js` directly;
nothing compiles at request time.

The design project loaded React *development* builds plus Babel-standalone from unpkg and compiled
JSX on every page view — roughly 4 MB before first paint. Precompiling and vendoring React brings
that to ~230 KB, all same-origin.

## How the scripts fit together

Plain classic scripts, loaded in order. Each file publishes onto `window`; later files read what
earlier ones defined. There are no modules and no bundler, so **order in `index.html` matters**:

`data → primitives → shell → views → app`

## Things that will bite you

**Inline styles beat the stylesheet.** Every component is styled with React inline styles, and
inline styles cannot carry media queries — so the containers that must reflow (`.ra-shell`,
`.ra-sidebar`, `.ra-discover-grid`, `.ra-map`, `.ra-two-col`, `.ra-cat-grid`, `.ra-stat-grid`,
`.ra-card-grid`, `.ra-bottom-nav`) take their layout from classes in `index.html`. If you add
`display`, `grid-template-columns` or `position` to one of those elements' inline styles, it will
silently override the media query and the responsive behaviour will stop working.

**`RA_C` is a live object.** The "higher contrast" preference swaps its values in place and the app
re-renders. Read `RA_C.x` at render time; never destructure it into a module-level constant, or that
copy will freeze at the startup palette.

**`hair` vs `line`.** `RA_C.hair` is decorative (separators, card edges). `RA_C.line` bounds
something operable — inputs, chips, option cards, toggles — and is chosen to clear WCAG 3:1 against
paper. Use `line` for anything a person can interact with.

**Nested interactive elements.** Several rows are a single `<button>` containing something that
*looks* like a switch. Those use `<RAToggle presentational />`, which renders an inert `<span>`.
A real control nested inside a button is invalid HTML and gives one setting two tab stops.

## Accessibility

The site publishes a WCAG 2.2 AA commitment, so this app is held to it. Implemented here:
focus management on route change and in both dialogs (focus in, trap, Escape, restore), real
labels on every control, radio semantics with arrow keys for text size, a skip link, landmarks and
heading structure, 44px touch targets, non-text contrast ≥3:1, live regions scoped to short
announcements, `prefers-reduced-motion` / `prefers-contrast` honoured as defaults, and text scaling
that actually moves the whole UI.

Re-check after changes: no nested interactives, every control has an accessible name, one `h1` per
view, and no `aria-live` on a container that wraps a whole view.

## Sample data

`src/data.jsx` is illustrative. The page is `noindex, nofollow` and carries a permanent sample-data
banner rendered server-side, plus per-item labelling on reviews, verification counts and venue
contact details.

**All eight venues are fictional** — invented names at invented street addresses. Suburbs and
categories are realistic so the demo reads true; the businesses are not. **Keep it that way.** An
invented access rating attached to a real, named business is a published claim about that business,
and this file is served from the live commercial domain. If real venues are ever needed here, the
only safe basis is a first-party published access statement from that venue, quoted with a source
link and a "last checked" date — never invented notes, and never invented first-person reviews.

## Re-syncing from Claude Design

Source files map 1:1 to the design project: `webapp/data.jsx` → `src/data.jsx`, and so on;
`src/app.jsx` is the inline `<script type="text/babel">` block from `Roam Access Web App.html`.
Diff before overwriting — the adaptations above are not in the design project and would be lost.
