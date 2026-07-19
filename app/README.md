# Roam Access — pilot demo (v2)

Interactive, front-end-only demo of the Roam Access mobile app, served as static files at
`/app/` alongside the marketing site. No backend, no build step at deploy time.

Imported from the Claude Design project **Roam Access** (`Roam Access App Pilot v2.html` +
`app/screens-v2*.jsx`), then adapted into a single working app: on phones it runs full-bleed
like a native app; on desktop it renders inside a phone frame on a branded stage — built for
showing to investors from a laptop or a shared link.

---

## Layout

```
app/
  index.html          host page: phone-frame stage, CSS vars, responsive + a11y CSS, script order
  src/
    data.jsx          fictional venues, needs taxonomy, demo constants
    primitives.jsx    live palette, verdict engine, query parser, shared components
    screens-a.jsx     Welcome · Setup · Home · Voice · Results
    screens-b.jsx     Map · Venue · AllReviews · Review · Thanks · Saved · Me · A11ySheet
    app.jsx           root: hash routing, user/world state, prefs
  js/                 compiled output, committed — the site deploys as-is
  vendor/             React 18 UMD (production), self-hosted
  fonts/              Inter + JetBrains Mono (variable, latin), self-hosted
scripts/stamp-version.mjs   cache-busts js/vendor URLs in index.html on every build
```

## Building

```bash
npm install     # once
npm run build   # compiles app/src → app/js AND stamps ?v=<hash> onto script URLs
```

**Commit `app/js/` and `app/index.html` together after every build.** The version stamp is what
saves visitors from GitHub Pages' 10-minute asset cache pairing new HTML with stale JS.

Scripts are classic globals loaded in order: `data → primitives → screens-a → screens-b → app`.

## Voice search

Real, with a fallback that cannot fail on stage:

- Browsers with SpeechRecognition (Chrome, Edge, Safari): the mic actually listens (`en-AU`),
  shows the live transcript, and runs the parsed query against the venue data.
- No support / permission denied / nothing heard / permission prompt left hanging: after 7s the
  screen switches to a labelled scripted demo — types the sample query and runs the same search.
- `?voice=demo` in the URL forces the scripted path (guaranteed-deterministic pitch).
- The three example chips are also tappable and run their query instantly.

The whole lifecycle lives in ONE mount-once effect in `V2Voice`. Keep it that way — recognition
handles, timers and the finished flag are all closure-local, so no re-render can strand the screen.

## The verdict engine

`ra2Verdict(venue, needIds)` in primitives.jsx is the product thesis in one function: facts are
tagged by need; with needs set, only relevant facts count. A step doesn't stop a deaf user, loud
music doesn't stop a wheelchair user — so the same venue can be "Works for you" for one person
and "Has barriers" for another. Demo this by changing needs in Me → Edit.

## Things that will bite you

- **`C2` is a live object** (higher-contrast swaps values in place). Read `C2.x` at render time;
  never copy into a module constant.
- **`hair` vs `line`**: `hair` is decorative, `line` bounds anything operable (3:1 on paper).
- **Layout classes** (`.v2-screen`, `.v2-scroll`, `--ra-shell-top`, `--ra-tabs-pad`) live in
  index.html because inline styles can't carry media queries — don't duplicate those properties
  inline or they'll silently win.
- **Phone chrome** (island, status bar, clock, home indicator) is desktop-only decoration in
  index.html, `aria-hidden`, hidden under 700px where real device chrome exists.
- **State**: `ra2-user`, `ra2-world`, `ra2-a11y` in localStorage. "Restart the demo" in Me clears
  the first two — use it between pitches.

## Sample data

All venues are fictional — invented names and addresses. Keep it that way: an invented access
claim attached to a real, named business is a published claim about that business. The page is
`noindex`, the stage footer and Welcome/Venue/Me screens say "fictional sample data".
