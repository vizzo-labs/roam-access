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
| Toilets | National Public Toilet Map, data.gov.au (CC BY 3.0 AU — keep the attribution) |
| Map | MapLibre GL + OpenFreeMap tiles (free, no key) |
| Review photos | Vercel Blob, **private** stores in `syd1`: `roam-access-photos` (Production), `roam-access-photos-dev` (Preview + Development) |
| AI | Vercel AI Gateway via AI SDK 7 (`ai`), model `anthropic/claude-haiku-5.5` (zero data retention); needs Node ≥ 22 |
| Hosting | Vercel project `roam-access`, Root Directory `apps/app` |

## How it fits together

```
app/(app)/            full-viewport layout for every app page
  page.tsx            signed out → Welcome; signed in → the app (components/pilot)
  sign-in, sign-up    Clerk components in the brand palette
app/manifest.ts       PWA manifest (icons in public/icons, generated from assets/)
app/admin/            testers, reviews, hide/show, problem-report queue — ADMIN_EMAILS only
app/ds/               design-system preview (open in dev/previews; admin-only in production)
app/how-it-works/     public policy page: verdicts, sources, "payment never changes a verdict", privacy
app/api/              bootstrap · profile (PUT, DELETE) · reviews · saved ·
                      venues/[id]/reviews · venues/[id]/confirm · venues/[id]/issues
                      venues/[id]/entrances · entrances/[id]/answer
                      photos (POST) · photos/[id] (GET, DELETE) · photos/[id]/suggest
                      venue-photos/[id] (public) · business/venues/[id]/photos (POST) · notices/seen
                      venues/[id]/photos · venues/[id]/ask
                      · gaps (places needing one quick answer) · micro-answers (POST)
app/admin/community/  create mapping days · moderate quick answers
app/v/[id]/           public access summary (no login, noindex, no personal data)
  share · card        embed code + QR · printable A5 card / A4 poster (?size=a5|a4)
  embed               self-contained <iframe> widget (route handler; proxy skips /v/)
app/join/[code]       join a mapping day (link or QR)
app/events/[code]/    mapping-day leaderboard (anonymous by default; ?screen=1 refreshes)
  kit                 printable organiser kit: join poster, checklist, run sheet, script
components/pilot/
  PilotApp.jsx        root: hash routing, server-backed state, a11y prefs
  PilotMap.jsx        real map; pins are buttons, list view stays primary
  WebLayout.jsx       desktop web app: header + panel + map
  pwa.js              service worker registration + install prompt
  community/          GapsPrompt (Home, Thanks) + gapsStore
  ui/                 primitives: palette (C2 live object, F2, M2), Logo, Mic, Verdict,
                      Shell + TabBar, Buttons, Switch, Plate, TileIcon, Toast, Dictate,
                      useDialog (focus trap), useHeading (focus on navigation)
  ds/                 design system: tokens (type, spacing, radii, elevation, motion, tones)
                      + Button, IconButton, Card, Chip/FilterChip, Badge/SourceBadge,
                      List/ListRow, SectionHeader, Skeleton, EmptyState, Banner, ActionRow,
                      SegmentedControl/Tabs, Sheet/SnapSheet, Icon — see AGENTS.md
  screens/            one file per screen: Welcome, Setup, SetupName, Home, Voice, Results,
                      Map, Venue, AllReviews, Review, Thanks, Saved, Me, A11ySheet,
                      Gaps ("Help fill the gaps")
                      (+ useVenueReviews)
  trust/              source + recency lines, verdict reasons, facts, "Still accurate?",
                      Report a problem, the entrance follow-up question
lib/
  pilot/match.js      verdict engine + query parsing (ra2Verdict, ra2Search, ra2ParseQuery)
  pilot-data.ts       needs, review questions, browse tiles, pilot area
  venues.ts           reviews → facts (works / check / barriers) per need, each with its
                      source, count and latest date; confirmed absence; other entrances
  trust/              labels.ts (source + confidence wording) · entrance.ts
  data/trust.ts       confirmations, problem reports, the admin queue
  data/owners.ts      business portal v2: venue updates (notices), photos from the venue,
                      contact-detail corrections, review reports, "Updates from your saved
                      places" — all "Venue says", never a verdict
  notify/             where email / push for saved-place updates would hook in (in-app only today)
  data/photos.ts      review photos (private Blob) · data/ai-usage.ts daily AI limits
  photos/             kinds + limits (shared) · jpeg.ts strips metadata server-side
  ai/                 model.ts (gateway model + ZDR) · photo-suggest.ts · ask.ts
  data.ts             core database access
  data/community.ts   quick answers, mapping days, leaderboards
  data/summary.ts     the public venue summary
  community/          gap picking (gaps.ts), quick questions, en-AU event dates
  db/url.ts           which database: prod only when VERCEL_ENV=production, else dev
  db/schema.ts        typed mirror of migrations/: venues · profiles · reviews · saved
                      · micro_answers · mapping_events · mapping_event_members
migrations/           additive SQL migrations, YYYYMMDDHHMM_<slug>.sql
scripts/
  migrate.ts          applies pending migrations (runs before every build)
  db-describe.ts      `\d`-style schema dump
  seed-osm.ts         imports places from OpenStreetMap (idempotent)
  import-toilets.ts   toilets (National Public Toilet Map) + beach items → dev DB, or `--sql` seed
  test-user.ts        Clerk test users for headless testing
```

### Venues & councils

- **Businesses** (`/business`): a signed-in owner or staff member claims a place; an admin
  verifies it in `/admin/venues` (website-domain email, a call to the listed number…). The free
  venue dashboard (`/business/<venueId>`) shows anonymous views and search appearances by access
  need, unmet needs, community facts (read-only), an access statement and public replies to
  reviews — both shown in the app as **“Venue says”**, apart from community facts, never
  changing a verdict — and the needs cards guests sent.
- **Needs card** (app screen `#/card`, `#/card/<venueId>`): the tester's needs + a note + visit
  date, shared by text, email, copy or the share sheet, or sent in-app to a claimed venue
  (no name). `lib/needs-card.ts`, `lib/data/cards.ts`.
- **Council** (`/council`, admin-granted `council` role): gap heatmap, unmet needs by suburb,
  trends, business inclusion, ATIC categories; CSV (`/api/council/export`) and a printable DIAP
  report (`/council/report`), all from `lib/council/metrics.ts`. Aggregates only.
- **Open data**: `/api/open-data/venues` (A11yJSON, ODbL) and “Suggest a correction on
  OpenStreetMap”. See [`docs/standards.md`](docs/standards.md) (also the ATIC mapping).
- Tables: `venue_claims`, `venue_replies`, `needs_cards`, `user_roles`, `venue_views`
  (`lib/db/schema-venues.ts`). All user rows cascade from `profiles`, so “Delete my account”
  removes them; `venue_views` holds counts only, never a user id.
  View counts are de-duplicated (one per person per place per day) and burst-limited via
  `venue_view_keys`, whose keys are HMACs (`VIEWS_HASH_SECRET`, else `CLERK_SECRET_KEY`), purged
  after two days. When an admin hides a “Venue says” post, the venue's dashboard says so, with the reason.

**Access layers** (`lib/layers/`, `lib/data/layers.ts`, `components/pilot/layers/`): public
toilets and beach access items (`facilities`), partner badges (`venue_badges`) and temporary
reports that expire (`temp_barriers`). Screens: `#/toilets`, `#/beach`, `#/facility/<id>`;
admin: `/admin/layers`. Listings show as "not yet confirmed"; badges are the partner's claim;
neither changes a verdict.

**Sensory content** (`lib/sensory/`, `lib/data/sensory.ts`, `components/pilot/sensory/`): noise,
light and crowds from reviews (optional questions, plus "when were you there?" and "when is it
usually quiet?") and from "I'm here — how is it right now?" check-ins on the venue page
(`POST /api/venues/[id]/sensory`; a new one within 2 hours replaces your last). The venue page
shows quiet times ("Usually quiet before 10am — 3 reports"), "quiet now" (a check-in from the last
90 minutes, else the pattern for this time of day, in Sydney time), and **What to expect** — a
step-by-step story (arrival → entrance → inside → toilet) from review photos, their descriptions
and community facts, with a text-only fallback. Results can filter by "Quiet now" / "Has quiet
times". Columns `reviews.sensory_noise|sensory_light|sensory_crowd|quiet_times`, table
`sensory_reports`. Sensory facts describe the place and **never change a verdict**. Tests:
`npx tsx lib/sensory/summary.test.ts`.

**Getting there** (I1, `lib/arrival/`, `lib/data/entrances.ts`, `components/pilot/arrival/`): gets
people to the **right door**. In a review, "Step-free way in? No → Yes, at the back" (or "Yes →
Show where the step-free entrance is") opens a small map with a draggable entrance pin, "Use my
current location", buttons that move the pin 5 m at a time, a note ("Ramp via the car park") and
one entrance photo — the map is optional, the words work alone. The pin is only saved once moved,
and must be within 300 m of the place. The venue page's **Getting there** section shows a
mini-map (street address + entrance, with a key in words), the photo, note, who marked it (lived
experience) and when, and "Still the way in? Yes / Changed" (`POST /api/entrances/[id]/answer`).
**Directions** (venue page, map card, `/v/[id]`) go to the best community-marked entrance that
has a point and no newer "Changed" — by default for people with the mobility need, a separate
button for everyone else — in Apple Maps on iOS or Google Maps elsewhere (switchable, saved on
the device). Tables `venue_entrances`, `entrance_confirmations` (cascade from the profile and the
review). OpenStreetMap `entrance=*` nodes would be `source = 'osm'` and "unconfirmed"; none are
imported (the pilot area had 39 entrance nodes in November 2026, the 4 with `wheelchair=*` all
`no`, mostly private homes). Later stages plug into `components/pilot/arrival/slots.js`.

**Languages and read aloud** (#21, `lib/i18n/`, `components/pilot/i18n/`): English (Australia),
简体中文, 日本語, 한국어, Español — chosen in Me or Accessibility settings (saved on this device;
the browser's language on a first visit). `<html lang>` follows it; people's own words keep
their own `lang`. Non-English strings are machine-translated until reviewed
(`messages/<locale>/_meta.ts`); `npm run i18n:check` lists gaps. "Read aloud" (Web Speech API)
reads place summaries and sensory details with a voice for the language. Search still
understands English words only. Admin, business, council and printable pages are English.
See [`lib/i18n/README.md`](lib/i18n/README.md).

**The honesty rule** (`lib/venues.ts`): only community reviews can make a place "Works for
you". OpenStreetMap accessibility tags show up as "Check first — not yet confirmed".
Quick answers ("Help fill the gaps") are a one-question community review: they count toward
that feature's yes/no tally exactly like a review's optional questions, one vote per person
per feature (latest answer wins), and every fact they touch says "(quick answer)".

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

Deploys: the Vercel project is Git-connected — every PR gets a Preview deployment (dev DB),
every merge to `main` deploys production (and migrates the production DB). No manual
`vercel deploy`.

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

## Photos & AI (F2)

- **Photos on reviews**: up to 5 per review, each with a required description (alt text).
  The browser resizes and re-encodes every photo (drops EXIF/GPS); the server strips any
  metadata again (`lib/photos/jpeg.ts`). Images are in a **private** Blob store and only
  served by `/api/photos/[id]` to signed-in testers, so hiding a photo or its review (admin)
  really hides it. Account deletion removes the images too.
- **Photo suggestions**: after upload, the model suggests a description and yes/no answers
  (step-free, accessible toilet, seating). Nothing is applied until the reviewer confirms.
- **Ask about this place**: answered only from that place's reviews and photo descriptions;
  an answer must cite at least one review or it's shown as "the reviews don't say".
- Limits per tester per Sydney day (`ai_usage`, counts only): 20 questions, 30 photo
  suggestions. Questions, photos and answers are never stored or logged.
- The AI Gateway needs a credit card on the Vercel team; without one the AI features show
  "not available right now" and everything else keeps working.
