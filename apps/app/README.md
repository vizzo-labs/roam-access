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
  legacy.jsx          the demo's screens, ported; data now comes from `app`
  PilotApp.jsx        root: hash routing, server-backed state, a11y prefs
  PilotMap.jsx        real map; pins are buttons, list view stays primary
  WebLayout.jsx       desktop web app: header + panel + map
  pwa.js              service worker registration + install prompt
lib/
  pilot-data.ts       needs, review questions, browse tiles, pilot area
  venues.ts           reviews → facts (works / check / barriers) per need
  data.ts             all database access
  db/schema.ts        venues · profiles · reviews · saved
scripts/seed-osm.ts   imports places from OpenStreetMap (idempotent)
```

**The honesty rule** (`lib/venues.ts`): only community reviews can make a place "Works for
you". OpenStreetMap accessibility tags show up as "Check first — not yet confirmed".

## Develop

```bash
npm install
npx vercel env pull .env.local --yes   # DATABASE_URL, CLERK_*, ADMIN_EMAILS
npm run dev
npm run db:push    # apply lib/db/schema.ts to Neon
npm run db:seed    # (re)import Manly places from OpenStreetMap
```

Deploy from the **repo root**: `npx vercel deploy --prod`.

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
