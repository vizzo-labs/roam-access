# Roam Access — conventions for agents (and people)

Roam Access tells disabled people whether a place will work for **them**, from reviews by
people with the same needs. Several agents work on this repo in parallel, each in its own
worktree, merging small PRs to `main`. These rules keep that safe. Read this file, then
`apps/app/README.md` and `apps/app/AGENTS.md`, before you change anything.

## Repo layout

```
index.html, privacy.html, accessibility.html, assets/   landing page (GitHub Pages) — don't touch
app/                 static investor demo (fictional data, JSX compiled by the root package.json) — don't touch
apps/app/            THE PILOT: Next.js 16 + React 19, Clerk, Neon Postgres (Drizzle), MapLibre
  app/               routes: (app)/ page + sign-in/up · admin/ · api/ · ds/ (design-system preview)
  components/pilot/
    PilotApp.jsx     root: hash routing, server-backed state, a11y prefs
    WebLayout.jsx    desktop (≥ 960px): header + panel + map
    PilotMap.jsx     MapLibre map; pins are real buttons
    ui/              shared primitives: palette (C2 live object, F2, M2, V2_H1), Logo, Mic,
                     Verdict, Shell + TabBar, Buttons (Big, Round, Back), Switch, Plate,
                     TileIcon, Toast, Dictate, useDialog, useHeading
    ds/              THE DESIGN SYSTEM — tokens + components for all new UI (see "UI components")
    screens/         one file per screen (Welcome, Setup, SetupName, Home, Voice, Results,
                     Map, Venue, AllReviews, Review, Thanks, Saved, Me, A11ySheet)
  lib/
    pilot/match.js   verdict engine + query parsing (ra2Verdict, ra2Search, ra2ParseQuery)
    pilot-data.ts    needs, review questions, browse tiles, pilot area
    venues.ts        reviews → facts per need (the honesty rule lives here)
    data.ts          all database access
    db/              url.ts (which DB) · index.ts (client) · schema.ts (typed mirror of migrations)
  migrations/        SQL migrations, YYYYMMDDHHMM_<slug>.sql
  scripts/           migrate · db-describe · seed-osm · test-user
```

Keep new code in the module it belongs to; add a new file rather than growing a shared one.
The palette `C2` is a **live object** (high contrast swaps values in place): read `C2.x` at
render time, never copy it into a module-level constant.

## UI components (design system)

All new UI is built from **`apps/app/components/pilot/ds/`** — don't hand-roll buttons,
cards, chips or sheets with inline styles. See every component in every state at **`/ds`**
(local and Preview builds; admin-only in production), with live switches for high contrast,
reduced motion and text size, plus a live contrast table. The UX study behind it:
[`docs/ux-review.md`](docs/ux-review.md).

```js
import { Button, Card, ListRow, FilterChip, ChipGroup, SourceBadge, TYPE, SPACE, GUTTER } from '../ds';
```

| Need | Use | Notes |
|---|---|---|
| Text styles, spacing, radii, shadows | `TYPE.title2`, `SPACE.md`, `GUTTER` (22), `RADIUS.lg`, `elevation(1)`, `tone('warn')` | Colour helpers read `C2` at call time, so high contrast works. Never put text under 13px; inputs use `TYPE.input` (16px). |
| An action | `Button` (`primary` · `secondary` · `outline` · `ghost` · `plain` · `danger` · `rust`; `sm` 44 · `md` 52 · `lg` 60) | Pass `href` to make it a link and `external` to say "opens in a new tab". |
| An icon-only action | `IconButton icon="close" label="Close filters"` | `label` is required and must name the thing. `pressed` makes it a toggle. Use `variant="floating"` over a map. |
| Icons | `Icon name="directions"` | Always decorative (`aria-hidden`); the names are listed on `/ds`. |
| A surface | `Card` (`outline` · `filled` · `tint` · `raised` · `brand`; `media` slot) | `onClick` or `href` makes the **whole** card one control, so use spans inside and no nested buttons. |
| A list of places or settings | `List` + `ListRow` | A real `<ul>`; the whole row is one ≥ 56px target. `selected` is for map sync; `after` puts a separate control beside the row. |
| Filters | `ChipGroup label=…` + `FilterChip` (`aria-pressed`, with a ✓ when on, optional `count`), `RemovableChip`, static `Chip` | The row scrolls sideways; use `wrap` when every option must stay visible. |
| Status and provenance | `Badge`, `SourceBadge source="community" \| "osm" \| "venue" \| "partner" \| "photo"`, `Freshness date=…` | `SourceBadge` only shows where a fact came from and **never** decides a verdict. OSM is always "unconfirmed". |
| Verdicts | the existing `ui/Verdict` (`V2Verdict`) | Unchanged: icon + colour + words. |
| Section titles | `SectionHeader title level={2} action={{ label, ariaLabel, onClick }}` | A real heading with at most one action. |
| Photos | `PhotoGrid photos onOpen` + `PhotoViewer photos index onIndex onClose` | Thumbnails are buttons named with kind + description; the viewer is a modal dialog (focus trapped/restored, ←/→, Esc) that shows the description as text. Mark reviews with `SourceBadge source="photo"`. |
| Loading | `SkeletonList`, `SkeletonCard`, `Skeleton` | Announces one "Loading…" message; the shimmer stops when motion is reduced. |
| Nothing to show | `EmptyState icon title body action` | Always give a next step. |
| Inline messages | `Banner tone="info" \| "success" \| "warn" \| "danger" \| "offline"` | `live="polite"` when it appears after an action; `"assertive"` only for errors that block the user. |
| Venue quick actions | `ActionRow actions=[Directions, Call, Website, Save, Share]` | Keep this order. Leave out an action that doesn't apply; don't disable it. |
| Switching mode or panels | `SegmentedControl` (List · Map; a radiogroup) and `Tabs` + `TabPanel` | Roving tabindex with arrow keys and Home/End. |
| A modal panel | `Sheet open onClose title footer` | A bottom sheet on phones and a dialog from 960px; focus is trapped and restored; Escape, the scrim and drag-down close it. |
| The top of a screen | `ScreenHeader back={{ label: 'Back to …', onClick }} headingRef={h} title subtitle actions` | Back is always top-left; it renders the screen's one `<h1>` (pass the `useV2Heading` ref). Use `compact` to put a short title on the Back row. |
| Search | `SearchField value onChange onSubmit onVoice back` | A real `role="search"` form: Clear button, mic, and a Search button once the text changes; Enter submits; the whole pill shows focus. |
| A place in a list | `explore/PlaceRow app place` (place needs `.verdict`) | Name, kind · area · walk, verdict, reasons. Hovering or focusing it highlights the pin on the desktop map. |
| Explore filters | `explore/ExploreFilters` + `explore/filters.js` (`applyFilters`, `verdictCounts`, `countsLine`) | Shared by Results, the phone map and the desktop map (`app.filters`, `app.setFilters`, `app.setQuery`). Filters only narrow, or sort by distance when the tester asks; they never change a verdict. |
| A list over a map | `SnapSheet snap onSnapChange label header` | Peek · half · full. The handle is a button (click, Enter, arrow keys) and each change is announced; tabbing into a collapsed list opens it. |
| Dates, plurals | `formatDate(d)` → "6 November 2026", `timeAgo(d)`, `plural(n, 'review')` | en-AU, Sydney time. |

The old `ui/Buttons` (`V2BigBtn`, `V2RoundBtn`, `V2Back`) are now thin wrappers over `Button` and `IconButton`. Use the design-system names in new code.

Rules: read `C2.x` at render time; animate only through CSS transitions or `dur()`, or check
`useReducedMotion()`; check every new colour pair on `/ds` (text ≥ 4.5:1, control
boundaries ≥ 3:1). If you need a component that isn't here, add it to `ds/` in its own file
and to the `/ds` page, rather than to a screen.

## Honesty rules (non-negotiable)

- **Only community reviews can make a place "Works for you".** Nothing else — not
  OpenStreetMap tags, not the venue's own claims, not an admin — produces that verdict.
- **OpenStreetMap data is "unconfirmed"**: show it as "Check first — not yet confirmed",
  never as a confirmed fact.
- **Payment never changes a verdict.** Paid listings, partners or sponsors may change how a
  place is presented, never its verdict, its ranking by verdict, or which reviews are shown.
- Reviews are shown by lived experience ("Wheelchair user"), **never by name**. Access needs
  are disability information (sensitive under the Privacy Act): never expose them with a
  name, never log them, delete them with the account.

## Accessibility non-negotiables

The users are disabled people. Every change must meet:

- **WCAG 2.2 AA**: text contrast ≥ 4.5:1 (3:1 large), UI component boundaries ≥ 3:1.
- **Targets ≥ 44×44 px** (the app mostly uses 48+).
- **Visible focus** on everything operable; logical focus order; focus moves to the screen
  heading on navigation (`useV2Heading`) and is trapped/restored in dialogs (`useRA2Dialog`).
- **Never colour alone**: verdicts are icon + colour + words.
- **Reduced motion**: respect `prefers-reduced-motion` and the in-app setting.
- **Screen readers**: real elements (`button`, `a`, `role="switch"` …), labelled controls,
  live regions for async results (`V2Toast`), decorative SVGs `aria-hidden`.
- Inputs ≥ 16 px font (`RA2_INPUT_FONT`) so iOS doesn't zoom.
- Keyboard-only and 200% text size must work.

## Language

UI copy in **Australian English (en-AU)**: "colour", "organise", "centre", "favourite";
dates as `6 November 2026`; plain, first-person, short sentences ("I use a wheelchair").

The app also ships in 简体中文, 日本語, 한국어 and Español (#21). **Every string a person can see
or hear goes through `t()`** (`const t = useT()` from `components/pilot/i18n`): text,
`aria-label`, placeholders, toasts, titles. Add the English to
`apps/app/lib/i18n/messages/en/<namespace>.ts` and the four translations (marked
machine-translated until a person reviews them); helpers that build text take `t` as an
argument; dates via `useFormat()`; people's own words in `<UserText>`. Run
`npm run i18n:check` before a PR. Details: `apps/app/lib/i18n/README.md`.

## Database

- **Which database**: `apps/app/lib/db/url.ts` → `pickDatabaseUrl()`. Production
  (`VERCEL_ENV=production`) uses `DATABASE_URL`; local, previews and scripts use
  `DEV_DATABASE_URL` (separate Neon database). Falls back to `DATABASE_URL` with a warning
  only if the dev URL is missing. Every script uses the same picker — never read
  `process.env.DATABASE_URL` directly.
- The dev DB is already migrated and seeded (232 Manly venues, no users). You rarely need
  `npm run db:seed`; the public Overpass API often refuses automated requests anyway.
- **Never run migrations, seeds or writes against production yourself.** The production
  build (automatic on merge to `main`) applies migrations.

### Migrations (instead of `drizzle-kit push`)

`drizzle-kit push` diffs the database against *your* schema.ts and can drop columns
another branch added. It is removed. Instead:

- Add **one plain SQL file per PR** in `apps/app/migrations/`, named
  `YYYYMMDDHHMM_<slug>.sql` (UTC time you write it; e.g. `202611071430_review_photos.sql`).
- **Additive only**: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`,
  `ALTER TABLE … ADD COLUMN IF NOT EXISTS`. New `NOT NULL` columns need a `DEFAULT`.
  Constraints: add them inside a new `CREATE TABLE`, or guard with a `DO $$ … IF NOT EXISTS
  (SELECT 1 FROM pg_constraint WHERE conname = '…') … $$` block.
- **Never drop, rename, truncate or change a column's type.** The runner refuses
  `DROP`, `RENAME`, `TRUNCATE`, `ALTER COLUMN … TYPE` and `DELETE FROM` anywhere (including
  inside `DO` blocks), and transaction control — `BEGIN`, `COMMIT`, `ROLLBACK`, `END`,
  `START TRANSACTION`, `SAVEPOINT` — as statements (each file already runs in its own
  transaction). The `BEGIN … END` of a PL/pgSQL body is fine: anything between `$$` (or
  `$tag$`) quotes is not treated as transaction control, so write guarded constraints as a
  normal `DO $$ BEGIN … END $$;` block. Rules: `apps/app/scripts/lib/migration-rules.ts`
  (tests: `npx tsx scripts/lib/migration-rules.test.ts`).
- **Never edit a migration after it merges.** Need a change? Add a new file.
  Note that preview and local builds apply your migration to the shared dev DB *before*
  merge — if you change an unmerged migration that already ran there, rename it (new
  timestamp) so it runs again, and keep it idempotent.
- Update `lib/db/schema.ts` to mirror the SQL (it is the typed view; the SQL is the truth).
  Tip: `npx drizzle-kit generate --out /tmp/draft` drafts SQL from schema.ts — copy it into
  your migration and add `IF NOT EXISTS`. Never `drizzle-kit push`.
- Commands (from `apps/app`): `npm run db:status` (pending/applied), `npm run db:migrate`
  (apply to the dev DB), `npm run db:describe` (`\d`-style dump), `npm run db:seed`
  (OpenStreetMap places into the dev DB).
- `npm run build` runs `db:migrate` first (`prebuild`): Vercel production builds (every
  merge to `main`) migrate production; Preview builds (`VERCEL_ENV=preview`, every PR) and
  local builds migrate the dev DB. `SKIP_MIGRATIONS=1` skips it.
- Migrations are tracked in the `_migrations` table (name, checksum, applied_at).

## Testing protocol

Every PR, from `apps/app`:

1. `npm run build` and `npx tsc --noEmit` must pass.
2. Start the app on a **random free port** — other threads run in parallel:
   `PORT=$(( RANDOM % 900 + 3100 )); lsof -i :$PORT || npx next start -p $PORT`.
3. Test in a headless browser with the **`bb browser-automation`** CLI (`open`, `run`,
   `screenshot`) at **desktop 1440×900** and **mobile 390×844**. Check the golden paths you
   touched and keyboard focus, and look at the screenshots.
4. Sign in with a **Clerk test user** — headless sign-up is blocked by bot protection:
   ```
   npm run test-user -- create <thread-slug> --port $PORT    # prints a one-time sign-in URL
   npm run test-user -- signin <thread-slug> --port $PORT    # fresh URL later
   ```
   This creates `<thread-slug>+clerk_test@example.com` via the Clerk Backend API
   (`POST /v1/users`, then `POST /v1/sign_in_tokens`) — open the printed
   `/sign-in?__clerk_ticket=<token>` URL in the browser. For `/admin`, add that email to
   `ADMIN_EMAILS` in **your local `.env.local` only**.
5. **Clean up**: `npm run test-user -- delete <thread-slug>` removes the Clerk user and its
   dev-DB rows (profile, reviews, saved). Never touch real users or their data.

## PR protocol

- Branch `feat/<slug>` off the latest `origin/main`.
- Small, focused commits. Every commit message ends with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- PR against `main`; the body says what changed, how you tested it (viewports, test user,
  screenshots) and any migration, and ends with:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- Every PR gets a **Vercel Preview deployment** (behind Vercel login; it builds against the
  dev DB and runs your migration there). Before merging, check it passed
  (`gh pr checks <n>`) and look at it if your change is visible.
- Before merging: `git fetch && git rebase origin/main`, re-run build + typecheck + your
  browser checks, push (`--force-with-lease`), wait for the preview to pass, then
  `gh pr merge --squash --delete-branch`.
- If two migrations conflict on rebase, keep both files (they're independent) and re-run
  `npm run db:migrate`.
- **Never run `vercel deploy`.** The Vercel project is Git-connected: every merge to `main`
  deploys production automatically, and that build's `prebuild` **migrates the production
  DB** — so your migration must be additive and idempotent.
- After merging, wait for the production deployment to be **Ready**
  (`npx vercel@latest ls roam-access`, or `gh pr view <n> --json statusCheckRollup`), then
  smoke-test https://roam-access.vercel.app (signed-out page loads; nothing you touched is
  broken). If production fails, tell the orchestrator (parent thread) at once.
- Never commit `.env*` or `.vercel` (both gitignored).
