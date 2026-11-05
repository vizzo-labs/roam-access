# Standards and open data

How Roam Access lines up with Australian accessible-tourism categories (ATIC), how venue
data is published as A11yJSON, and how wrong base data gets fixed on OpenStreetMap.
Code: `lib/standards/atic.ts`, `lib/standards/a11yjson.ts`, `lib/standards/osm.ts`.

## ATIC accessible tourism categories

The Australian Tourism Industry Council's accessible tourism program (run by Quality Tourism
Australia) assesses operators in five categories. Roam Access keeps its own first-person needs
(they're how testers describe themselves), and maps them onto ATIC so councils and tourism
bodies can read our numbers in their terms. The council dashboard and DIAP report have an
"ATIC categories" table built from this mapping.

| Roam Access need (what the tester says) | ATIC category | Fit |
| --- | --- | --- |
| I use a wheelchair or mobility aid | Wheelchair / scooter users; Limited mobility | direct |
| I'm blind or have low vision | Blind or low vision | direct |
| I'm deaf or hard of hearing | Deaf or hard of hearing | direct |
| I'm autistic or sensory-sensitive | Cognitive, including autism | direct |
| Easy-to-understand places help me | Cognitive, including autism | direct |
| Calm, low-stress places help me | Cognitive, including autism | partial — ATIC has no mental-health category |
| I need seats and rest spots (fatigue, pain) | Limited mobility | partial — ATIC has no chronic-illness category |

Review questions map the same way:

| Review question | ATIC category |
| --- | --- |
| Step-free way in? | Wheelchair / scooter; Limited mobility |
| Accessible bathroom? | Wheelchair / scooter |
| Seats and rest spots? | Limited mobility |
| Hearing support? | Deaf or hard of hearing |
| Good for low vision? | Blind or low vision |
| Quiet enough? · Calm, not hectic? · Easy to find your way around? | Cognitive, including autism |

A place counts as covered for an ATIC category when a review answered a question in that
category, or someone whose need maps **directly** to it reviewed the place. Partial mappings
don't count towards coverage.

Two Roam Access needs — calm spaces (mental health) and seating (chronic illness, fatigue) — have
no ATIC equivalent. They are among the needs mainstream accessibility schemes miss, so we keep
them as first-class needs rather than folding them away.

## A11yJSON export (open data)

`GET /api/open-data/venues` — every active pilot venue as an
[A11yJSON](https://sozialhelden.github.io/a11yjson/) `PlaceInfo` (the format of
accessibility.cloud and Wheelmap). `GET /api/open-data/venues/<id>` returns one. Public, no
sign-in, CORS open, cached for 5–10 minutes.

- **Licence**: ODbL 1.0, with attribution in the response (`license`, `licenseUrl`,
  `attribution`). The places come from OpenStreetMap, so the combined database must stay ODbL.
- **Public data only**: name, category, address, location, phone, website, OSM ids, and
  accessibility facts that a **majority** of community answers agree on. Never review text,
  reviewer needs, names, "Venue says" content, or OSM's own accessibility tags (those are
  unconfirmed here, and already in OSM).
- **Mapping** (majority answer → field):
  - Step-free way in: no → `entrances[].properties.isLevel = false`, `hasFixedRamp = false`,
    `wheelchairAccessibilityGrade = "not"`; yes → grade `"partially"`, or `"fully"` when the
    accessible bathroom is also confirmed. (We don't know whether a step-free entry is level or
    ramped, so we never claim `isLevel = true`.)
  - Accessible bathroom → `restrooms[].isAccessibleWithWheelchair`.
  - Quiet enough → `isQuiet`.
  - Questions with no exact A11yJSON field (calm, seats, hearing support, low vision, easy to
    navigate) travel as namespaced `tags`: `"roam:seats": "yes (3 yes, 1 no)"`, plus
    `"roam:community_reviews"`.
- `editPageUrl` points at the OpenStreetMap note form for the place (below).
- Each item in `features` is a strict `PlaceInfo`. A11yJSON's schema doesn't allow GeoJSON's
  `"type": "Feature"`; add `?geojson=1` to get it for GeoJSON tools.

**Validate** (strict — unknown keys and wrong types fail):

```bash
npm i --no-save @sozialhelden/a11yjson@31          # validator only, not an app dependency
npx tsx scripts/validate-a11yjson.ts http://localhost:3456/api/open-data/venues
```

## Suggest a correction on OpenStreetMap

Place names, addresses and locations come from OpenStreetMap. When they're wrong, the venue
screen links to OSM's note form at the place
(`https://www.openstreetmap.org/note/new?lat=…&lon=…#map=19/…/…`). Anyone can leave a note
without an OSM account; local mappers then fix the map, and our next import picks it up.
We never edit OSM on anyone's behalf and handle no OSM accounts. Access problems go in a
Roam Access review instead — that's community data, not base data.
