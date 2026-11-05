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
  app/               routes: (app)/ page + sign-in/up · admin/ · api/
  components/pilot/
    PilotApp.jsx     root: hash routing, server-backed state, a11y prefs
    WebLayout.jsx    desktop (≥ 960px): header + panel + map
    PilotMap.jsx     MapLibre map; pins are real buttons
    ui/              shared primitives: palette (C2 live object, F2, M2, V2_H1), Logo, Mic,
                     Verdict, Shell + TabBar, Buttons (Big, Round, Back), Switch, Plate,
                     TileIcon, Toast, Dictate, useDialog, useHeading
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

## Database

- **Which database**: `apps/app/lib/db/url.ts` → `pickDatabaseUrl()`. Production
  (`VERCEL_ENV=production`) uses `DATABASE_URL`; local, previews and scripts use
  `DEV_DATABASE_URL` (separate Neon database). Falls back to `DATABASE_URL` with a warning
  only if the dev URL is missing. Every script uses the same picker — never read
  `process.env.DATABASE_URL` directly.
- **Never run migrations, seeds or writes against production yourself.** The production
  build applies migrations; the orchestrator deploys.

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
  `DROP`, `RENAME`, `TRUNCATE`, `ALTER COLUMN … TYPE`, `DELETE FROM` and
  `BEGIN/COMMIT` (each file already runs in its own transaction).
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
- `npm run build` runs `db:migrate` first (`prebuild`): Vercel production builds migrate
  production; previews and local builds migrate the dev DB. `SKIP_MIGRATIONS=1` skips it.
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
- Before merging: `git fetch && git rebase origin/main`, re-run build + typecheck + your
  browser checks, push (`--force-with-lease`), then `gh pr merge --squash --delete-branch`.
- If two migrations conflict on rebase, keep both files (they're independent) and re-run
  `npm run db:migrate`.
- **Do not deploy to production.** The orchestrator (parent thread) deploys after each merge.
- Never commit `.env*` or `.vercel` (both gitignored).
