# Roam Access — pilot app

The real pilot: testers sign in, set their access needs, and review **real places around
Manly** (Manly, Fairlight, Queenscliff, Balgowlah). Live at **https://roam-access.vercel.app**
(admin: `/admin`).

**One app, two shapes:**
- **Web app (≥ 960px):** header navigation, the screens in a side panel, a live map of the
  area beside them (pins open places in the panel). `components/pilot/WebLayout.jsx`.
- **Mobile app (< 960px):** the phone UI full-screen, **installable as a PWA** (Add to Home
  Screen; Me → Install the app). Manifest `app/manifest.ts`, service worker `public/sw.js`
  (caches the app shell only — never `/api`, which holds disability information),
  offline page `public/offline.html`.

The static investor demo (fictional data, no accounts) still lives at the repo root in `app/`
and ships with the landing page on GitHub Pages. This folder is separate and deploys to Vercel.

## Stack

| Concern | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Cache Components), React 19 |
| Sign-in | Clerk (Vercel Marketplace) — `/sign-in`, `/sign-up` |
| Database | Neon Postgres, Sydney (Vercel Marketplace) + Drizzle ORM |
| Places | OpenStreetMap via Overpass (ODbL — keep the attribution) |
| Map | MapLibre GL + OpenFreeMap tiles (free, no key) |
| Hosting | Vercel project `roam-access`, Root Directory `apps/app` |

## How it fits together

```
app/(app)/            full-viewport layout for every app page
  page.tsx            signed out → Welcome; signed in → the app (components/pilot)
  sign-in, sign-up    Clerk components in the brand palette
app/manifest.ts       PWA manifest (icons in public/icons, generated from assets/)
app/admin/            testers, reviews, hide/show — ADMIN_EMAILS only
app/api/              bootstrap · profile (PUT, DELETE) · reviews · saved · venues/[id]/reviews
components/pilot/
  PilotApp.jsx        root: hash routing, server-backed state, a11y prefs
  PilotMap.jsx        real map; pins are buttons, list view stays primary
  WebLayout.jsx       desktop web app: header + panel + map
  pwa.js              service worker registration + install prompt
  ui/                 primitives: palette (C2 live object, F2, M2), Logo, Mic, Verdict,
                      Shell + TabBar, Buttons, Switch, Plate, TileIcon, Toast, Dictate,
                      useDialog (focus trap), useHeading (focus on navigation)
  screens/            one file per screen: Welcome, Setup, SetupName, Home, Voice, Results,
                      Map, Venue, AllReviews, Review, Thanks, Saved, Me, A11ySheet
                      (+ useVenueReviews)
lib/
  pilot/match.js      verdict engine + query parsing (ra2Verdict, ra2Search, ra2ParseQuery)
  pilot-data.ts       needs, review questions, browse tiles, pilot area
  venues.ts           reviews → facts (works / check / barriers) per need
  data.ts             all database access
  db/url.ts           which database: prod only when VERCEL_ENV=production, else dev
  db/schema.ts        typed mirror of migrations/: venues · profiles · reviews · saved
migrations/           additive SQL migrations, YYYYMMDDHHMM_<slug>.sql
scripts/
  migrate.ts          applies pending migrations (runs before every build)
  db-describe.ts      `\d`-style schema dump
  seed-osm.ts         imports places from OpenStreetMap (idempotent)
  test-user.ts        Clerk test users for headless testing
```

**The honesty rule** (`lib/venues.ts`): only community reviews can make a place "Works for
you". OpenStreetMap accessibility tags show up as "Check first — not yet confirmed".

## Develop

```bash
npm ci
npx vercel@latest link --yes --project roam-access --scope romys-projects-10ffa6cd
npx vercel@latest env pull .env.local --yes   # DATABASE_URL, DEV_DATABASE_URL, CLERK_*, ADMIN_EMAILS
npm run db:migrate   # apply pending migrations to the dev database
npm run db:seed      # (re)import Manly places from OpenStreetMap into the dev database
npm run dev
```

Conventions for contributors and agents (honesty and accessibility rules, testing, PRs):
the root [`AGENTS.md`](../../AGENTS.md).

### Two databases

| Where | Database |
| --- | --- |
| Vercel production (`VERCEL_ENV=production`) | `DATABASE_URL` — production Neon |
| Vercel previews, local dev/build, scripts | `DEV_DATABASE_URL` — dev Neon |

One rule, in `lib/db/url.ts` (`pickDatabaseUrl()`), used by the app and every script. If
`DEV_DATABASE_URL` is missing outside production it falls back to `DATABASE_URL` and warns.

### Migrations

Schema changes are plain SQL files in `migrations/` named `YYYYMMDDHHMM_<slug>.sql`,
**additive only** (`CREATE … IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), never edited after
merge. `lib/db/schema.ts` mirrors them for typed queries. `drizzle-kit push` is not used.

```bash
npm run db:status     # applied / pending, changes nothing
npm run db:migrate    # apply pending files, each in a transaction, recorded in _migrations
npm run db:describe   # columns, constraints, indexes, applied migrations
```

`npm run build` runs `db:migrate` first (`prebuild`), so a production build on Vercel
migrates production and preview/local builds migrate the dev database. `SKIP_MIGRATIONS=1`
skips it. The first file, `202611060000_baseline.sql`, is the schema as it stood when
migrations were introduced: a no-op on production, builds the dev database from empty.

### Test users

Headless sign-up is blocked by Clerk's bot protection, so tests sign in with Backend-API
test users (`<name>+clerk_test@example.com`):

```bash
npm run test-user -- create my-feature --port 3456   # prints a one-time /sign-in?__clerk_ticket=… URL
npm run test-user -- delete my-feature               # Clerk user + dev-DB rows
```

Deploys: the orchestrator deploys production from the repo root (`npx vercel deploy --prod`).

## Before inviting more testers

- **Clerk is a development instance** (shows "Development mode", has usage caps). For a public
  pilot, create the production instance on your own domain (e.g. `pilot.roamaccess.com.au`)
  and add Clerk's DNS records.
- **Passwordless sign-in**: Clerk dashboard → User & authentication → turn on email
  verification code, turn off password. Code by email is the most accessible option.
- **Privacy**: access needs are disability information (sensitive under the Privacy Act).
  Testers can delete everything from Me → Delete my account. Update `privacy.html` on the
  landing page to cover the pilot before going wide.
- **Admins**: set `ADMIN_EMAILS` (comma-separated, verified emails) in Vercel env vars.
