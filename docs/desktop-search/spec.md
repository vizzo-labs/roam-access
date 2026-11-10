# Desktop search like Domain and realestate.com.au — three options

*Design phase, 10 November 2026. The desktop web app (≥ 960 px) at `fb039ad`, after the map
declutter (#37). Clickable mockups: [`mockups/index.html`](mockups/index.html) (open at
1440×900, then 1280 and 1024; the toolbar at the bottom-left switches state and text size).
Screenshots: [`shots/`](shots/). Nothing in the app changes with this PR.*

Romy asked two things: *"What if search worked like Domain or realestate.com.au, with search and
filters along the top of the map?"* and *"The venue info in the left panel feels very crowded."*
This document answers both with three layouts that share one top bar and one results list, and
differ only in **where the place details open**. It ends with a recommendation and what to build.

---

## 0. Summary and recommendation

**Build Option A — search and filters along the top, the list beside the map, and a place drawer
that slides in over the map.** It fixes the crowding (the drawer is 560 px wide, the verdict and
the five actions are the only things open, everything else is a folded row that already says the
gist), it keeps the list and the map on screen so people can compare places, and it is the same
product as the phone: the drawer *is* the phone's place page in the same order.

| | A — drawer over the map | B — full place page | C — one panel (today, tidied) |
|---|---|---|---|
| Fixes "crowded"? | Yes: 560 px, verdict + actions open, five folded rows | Yes, best of the three: two calm columns | No: still 480 px with everything stacked |
| Keeps list + map in view? | Yes | No (the page covers them; Back returns you) | List no, map yes |
| Compare two places | Click the next card: the drawer swaps | Back, scroll, click, Back… | Back, scroll, click… |
| Same as the phone? | Same order; folded rows map to the phone's "More" | Same order, but a two-column page the phone never has | Same order, same shape as the phone |
| Keyboard and screen reader | Drawer is a landmark named by the place; Escape closes; focus returns to the card | A normal page: one `main`, focus on `h1`, Back restores the list | As today |
| Work to build | Medium: top bar + `ResultCard` + drawer shell; place content reused | Medium: top bar + `ResultCard` + a page layout; place content reused | Small: top bar + `ResultCard` |
| Shareable URL for a place | `#/venue/<id>` as today (drawer opens) | `#/venue/<id>` as today | As today |
| 1024 px | Drawer covers the map (the list stays) | Columns narrow to 1 fr + 320 px | Fine |

Why not B: a full page is calmer, and it is what Domain and REA do, but their listing page is
the *destination*; ours is a quick check before going somewhere, and most people will look at two
or three places. B also hides the map, which is the thing Romy asked to put at the centre of the
desktop. Keep B's right column in mind for the public `/v/[id]` page, which is a destination.

Why not C: it is today's structure with a better hat on. The complaint was the panel.

---

## 1. What is wrong today (desktop, 1440×900)

Measured on `fb039ad`, signed in as a test user with wheelchair + seating needs.

| Problem | Evidence |
|---|---|
| **The place page is the phone page in a 460 px panel** — verdict card, five actions, Today, For your needs, Getting there, Reviews, More, all stacked, and the panel scrolls 1 407 px for a place with no reviews. Nothing is folded, so everything competes. | [`shots/before-place.jpg`](shots/before-place.jpg) |
| **Search lives inside the panel**, under Back, with the count and chips below it. The map is bigger than the panel but carries nothing you can act on except pins. | [`shots/before-results.jpg`](shots/before-results.jpg) |
| **Two boxes sit over the map** (the key with "Show symbols", and "Map layers" with three big buttons), on top of the pins. | same |
| **The header is about the app, not the search**: Install app · Accessibility · avatar. Saved and Me are plain text tabs. | same |
| Rows carry the reason twice ("Step-free on OpenStreetMap · not checked" in the row and again under it) and no photo or icon, so the list is a wall of amber pills. | same |

The map itself is now right (#37): the pins mirror the list, overlaps are hidden rather than
clustered, "Search this area" exists. This design assumes all of that, and §6 proposes one
calibration the parent thread asked for.

---

## 2. The patterns, not the brands

What was taken from each product, and where it lands. Structure only; no look is copied.

| Product | Pattern | In the design |
|---|---|---|
| **Domain** | One search bar across the top; a single row of filter chips under it ("Price", "Bedrooms", "Property type", "More filters"); "n properties" + "Sort" at the head of the list; list left, map right; a card hover highlights its pin; property page is a calm two-column page with the photos first. | Top bar + chip row; count + sort in the panel head; hover → pin; Option B's page. |
| **realestate.com.au** | The result count is the heading; cards are compact (photo, price, address, three facts); the map shows only the results; "Search as I move the map" is a visible switch. | "156 cafes and food places." as the `h1`; `ResultCard` with photo or icon, name, kind · suburb · walk, verdict, one reason; "Search this area" as a button, never automatic (a surprise for screen-reader and switch users). |
| **Airbnb** | Chips for the few filters that matter and a "Filters" button for the rest; the map mirrors the page of results; hover a card → the pin grows; click a pin → a small card on the map. | Six chips + More filters; one page of 10 on the map; pin → the existing `PlacePreviewCard`. |
| **Google Maps** | The details open as a second panel beside the list, so the map never disappears; Directions · Save · Share as round icon buttons; "Accessible places" is one switch. | Option A's drawer; the existing `ActionRow`; "Works for me" is one chip. |

---

## 3. What every option shares

Open any option before a search, then search "cafe", then open Hugos.

### 3.1 Top bar (72 px, one row)

`roam/access` · **search field** (search icon · "Cafe, beach, Hugos…" · Clear · mic · Search) ·
**Saved** (bookmark icon + word + a count pip read as ", 2 updates") · **Me** (avatar + word).
The search field is the existing `SearchField` (a `role="search"` form, 16 px input, the mic
inside; at large text the buttons wrap under the field). Install and Accessibility move into Me
(Settings), as the phone redesign already decided; the Accessibility shortcut can stay in the
header if Romy wants it — it costs nothing.

### 3.2 Filter row (chips wrap, never clip)

In this order: **Works for me (n)** (hidden while n = 0, as on the phone) · **Category ▾**
(Food & drink · Parks & beaches · Arts & culture · Places to stay · Accessible toilets, with counts) ·
**For: Wheelchair · Seats ▾** (the person's needs; untick one to see a place for someone else; the
saved needs don't change) · **Open now** (only shown when the results have opening hours; most
OpenStreetMap places don't yet) · **Any distance ▾** (Up to 5 · 10 · 20 min · Any; "Use my
location") · **More filters** (Hide places with barriers · Quiet now · Has quiet times) · and,
after "Search this area", a removable **In the map area ✕** chip. Right-aligned, in words:
*"Filters only narrow the list. They never change a verdict."* Each ▾ chip opens a small
non-modal dialog under it (real checkboxes/radios; Escape closes; focus returns to the chip).

### 3.3 Results panel (480 px; 440 at 1280; 400 at 1024)

"Back to Find" · `h1` **"156 cafes and food places."** (sr: "Search results.") · one line
"3 work for you · 27 check first · 2 have barriers · 124 no info yet. Walking from Manly Wharf."
· **Sort** (Best for me · Nearest first) · the cards · **Page 1 of 16 · Previous / Next 10** ·
"The map shows the places on this page."

**Pages, not "Show 10 more"**: the desktop map mirrors the list on screen, and a page is a clear
unit for both ("Next 10" on the list = the next 10 pins). The phone keeps "Show 10 more".

**`ResultCard`** (new, `explore/ResultCard.jsx`): 72 px cover photo or category icon · name ·
"Cafe · Manly · 5 min walk" · verdict pill (icon + colour + words) · ONE reason with its mark
("Step-free way in · 3 people", "Step-free on OpenStreetMap · not checked", "Been here? Be the
first"). The whole card is one link, ≥ 56 px, `aria-current="true"` when it is the open place.
Hover or focus highlights its pin (the existing `app.hover`).

**The card's accessible name is its visible text**, nothing more: "Hugos Restaurant · Manly ·
1 min walk Works for you Yes: Step-free way in · 3 people". That is the fix for the axe finding
`label-content-name-mismatch` on `PlaceRow` (#37's leftover): no `aria-label`, no
`aria-describedby`; the reason carries a visually hidden "Yes:" / "Check:" / "No:" so the mark
never relies on colour. The mockups pass axe with this; `PlaceRow` on the phone should get the
same treatment (one-line change, see §8.6).

### 3.4 Before a search (the empty state)

The panel is the phone's Find screen: `h1` "Find a place." · lead · **Near me now** · Food &
drink · Parks & beaches · Arts & culture · Toilets · `h2` "Near you" with the five nearest places
that anyone has said something about · "See all 232 places". The map shows the 12 nearest places
with any information and says so in words ("Places with no info yet appear when you zoom in").
The top bar's search field is empty; typing there is the same as typing in the panel today.

### 3.5 The map

The pins are the places on the current page (≤ 10), in #37's three looks: full pin with badge at
street zoom, hover and selection; small verdict **shape** (circle · diamond · octagon) with the
category icon zoomed out; grey dots for "No info yet" only at street zoom. **Search this area**
sits top-centre; **Key** bottom-left opens a dialog (no legend box over the map); zoom and
"Show my location" are 48 px round buttons on the right. The "Map layers" box goes: toilets,
beach and parking become rows in the Category chip and the Key. A "Skip the map" link precedes
the map in the tab order. Pin → the existing `PlacePreviewCard` (name, kind · walk, verdict, up to
three facts, See details, Save), focus moves in and back.

### 3.6 Place details — one content, three containers

The phone's order, unchanged: `h1` name + "kind · address, suburb · walk" · **verdict card**
(pill, one sentence, source line with the date, Read aloud, How we decide, and "Still right?
Yes / Something changed" only when there are community reviews) · **ActionRow** (Directions ·
Save · Call · Website · Share; "Directions go to the step-free door." when one is marked) ·
**Today** (reports + "Report a problem today") · **For your needs** (≤ 3 facts with ✓ ! ✗ ?
marks and their source) · **Getting there** (the marked door, Directions to it, "More about
getting there") · **Reviews (n)** (newest quote, who, "This helped me", Read all) · **More about
this place** (Photos · Noise, light and crowds · What to expect · Ask · What the venue says ·
Place details and corrections) · the one main action **"Tell us how it was"** pinned at the bottom.

---

## 4. The options

### Option A — a drawer over the map · [`mockups/option-a.html`](mockups/option-a.html?state=place) · [`shots/a-place.jpg`](shots/a-place.jpg)

Click a card or "See details" on a pin: a **560 px drawer** (520 at 1280) slides in to the right
of the list, over the map. The list stays, the open card gets a teal ring, the map keeps its pins
in the part you can still see. Inside: name · subtitle · cover photo (or "No photos yet — add the
first in a review") · the verdict card · the action row · then five **folded rows** whose summary
text already answers the common question:

- **Today** — "Nothing reported" / "1 report" (open by default when there is one)
- **For your needs** — "2 yes · 1 to check" (open by default)
- **Getting there** — "Step-free door marked" / "No door marked yet"
- **Reviews (3)** — "Newest 2 November 2026" / "None yet"
- **More about this place** — the six disclosures

"Tell us how it was" is pinned at the bottom of the drawer. Close (✕, Escape, or clicking another
card) returns focus to the card you came from. At 1024, and at 200 % text when less than 360 px of
map would be left, the drawer takes the whole map area (the map is `inert` while covered), so
nothing is half-visible.

Trade-offs: two columns of content (list + drawer) plus a map is the busiest of the three at a
glance, which the folded rows are there to counter; and a drawer is one more container to get
focus right in (the mockup shows how: the drawer is a complementary landmark named by the place,
focus lands on its heading, Escape closes).

### Option B — a full place page · [`mockups/option-b.html`](mockups/option-b.html?state=place) · [`shots/b-place.jpg`](shots/b-place.jpg)

Click a card: the results and the map are replaced by a **page** (max 1140 px): "Back to results"
· left column with the phone order in full · a sticky right column with the cover photo, a
mini-map, the address and walk, Call and Website, the OpenStreetMap credit and "Wrong name or
location?", and "Tell us how it was". The top search bar stays; the filter row hides. Back returns
you to the same page of results with the card marked.

Trade-offs: the calmest reading experience and the easiest to print or share; but it hides the
map and the other results, so comparing places is a round trip each time, and the two-column
layout is something the phone never shows (at 900 px it collapses to one column anyway).

### Option C — one panel, as today · [`mockups/option-c.html`](mockups/option-c.html?state=place) · [`shots/c-place.jpg`](shots/c-place.jpg)

The new top bar and cards, but the place page replaces the list inside the same panel, exactly as
today. Included so A and B can be judged against the current shape with the same top bar.

Trade-offs: the least work, and a shareable URL already works this way; but the panel is still the
narrow column Romy called crowded, and the only way to compare two places is Back → scroll → click.

---

## 5. Recommendation: Option A

1. **It answers both of Romy's sentences.** Search and filters are along the top like Domain; the
   crowded panel becomes a wider drawer in which only the verdict and the actions are open.
2. **Comparing is one click.** A person checking "which of these three cafes works for me" clicks
   card, card, card; the list and the map never move. That is the desktop's advantage over the
   phone and the whole reason to have a map beside a list.
3. **Same product as the phone.** The drawer's content *is* `screens/Venue` in the same order;
   the folded rows are the phone's `Disclosure`. Nothing new to learn when switching devices.
4. **Honesty and accessibility are untouched.** The drawer never decides a verdict; "sample" or
   "unconfirmed" labels travel with the facts; every pin is a button; everything the map can do
   the list can do.

What would make me pick B instead: if testers mostly arrive from a shared link and read one place
(then the page is the right destination). The data on `/v/[id]` and `venue_views` will say.

---

## 6. Map calibration: never an empty map (parent thread's ask)

After #37, at suburb zoom the collision rule can leave two pins for a list of 232 places, and an
empty map "looks like something is wrong". Proposal, implemented in the mockups (press "−" on the
results map, [`shots/a-overview.jpg`](shots/a-overview.jpg)):

**Three tiers, never a cluster bubble, and every place on the page stays on the map.**

| Tier | Looks like | Target | When |
|---|---|---|---|
| Full pin | category icon in a pin, verdict colour + "✓ ! ✗" badge, 40×50 | 48 px button | street zoom (≥ 15), and always for the selected, hovered or focused place |
| Small marker | 28 px verdict **shape** (circle works · diamond check · octagon barriers) with the category icon, as in #37 | 44 px button | zoomed out, or whenever a full pin would overlap a better-ranked one |
| Dot | 12 px filled circle in the verdict colour | not focusable (the list has it) | whenever a small marker would overlap another small marker |

Rules: rank as #37 (works for you first, then distance; selected/hover/focus always win). The
collision box is the **marker's own size**, not the full pin's (44 px for full pins, 30 px for
small ones, 10 px for dots) — today's rule tests every place against the full pin box, which is
what empties the map. A dot that would sit on another dot is dropped; the note on the map says
"6 places are a dot or under another pin. Zoom in to see them." and the Key explains the three
looks in words. "No info yet" places stay off the map at overview zoom (as #37), so dots are
always places with a verdict. On a 10-place page the mock shows 10 markers at every zoom; with
#37's 60-row list it would show roughly 20–30 small markers and 30–40 dots at suburb zoom, which
reads as "populated" without any bubble to decode.

Where it goes: `PilotMap.jsx`'s paint step (`paintPins` / the overlap pass): add the `dot` tier
and per-tier collision boxes; `MapLegend` → the Key dialog gains the dot line.

---

## 7. Where walks are measured from

Today everything is "walking from Manly Wharf" even after "Search this area" over Balgowlah.
Rule, shown in the mockups: the **origin** is

1. **my location**, once shared ("Use my location" in the Distance chip, in "Near you", or the
   map's locate button) — "Walking from your location.";
2. else **the middle of the map** after "Search this area" — "Walking from the middle of the map."
   (the "In the map area" chip removes both the limit and this origin);
3. else **Manly Wharf** (the pilot origin, `PILOT_AREA.origin`).

Both the walk minutes on the cards and "Nearest first" use the same origin; "Best for me" keeps
the verdict rank with distance as the tiebreak. The origin is stated in words under the count so
nobody wonders why Hugos is "10 min" from the middle of the map. Where it goes: `PilotApp.jsx`
holds `origin` already (`walkMins(origin, v)`); "Search this area" (`WebLayout` → `app.setArea`
from #37) sets `origin = { name: t('explore.origin.mapCentre'), …centre }` unless `origin.mine`.

---

## 8. Building Option A

### 8.1 Components

Reuse as they are: `SearchField`, `FilterChip`, `ChipGroup`, `RemovableChip`, `Button`,
`IconButton`, `Card`, `List`, `VerdictCard`, `ActionRow`, `Disclosure` + `useDisclosures`,
`Sheet` (for More filters and the Key), `Banner`, `EmptyState`, `SkeletonList`, `SourceBadge`,
`PlacePreviewCard` + `MapPlacePreview`, `TodayBlock`, `KeyFacts`, `EntranceCard`, `PlaceReviews`,
`VenueMore`, `BrowseGrid`, `MoreFiltersSheet`, `MapKeySheet`.

Add to `ds/`: **`Popover`** (a non-modal dialog anchored under a button: `open`, `anchorRef`,
`onClose`, Escape, focus in and back; used by the Category, For, Distance chips — the phone keeps
`Sheet`) and **`Pager`** (`page`, `pages`, `onPage`; Previous / "Page n of m" live / Next 10).

Add to `explore/`: **`ResultCard`** (§3.3), **`DesktopTopBar`** (brand, `SearchField`, Saved,
Me), **`DesktopFilters`** (the chip row; wraps `ExploreFilters`' logic and `app.filters`),
**`ResultsPanel`** (head + cards + pager; the desktop's `FindResults`).

Add to `venue/`: **`PlaceDrawer`** (`aside aria-labelledby`, 560 px, cover photo, `VerdictCard`,
`ActionRow`, then `Disclosure` rows wrapping `TodayBlock`, `KeyFacts`, `EntranceCard`,
`PlaceReviews`, `VenueMore`; the bar with "Tell us how it was"; Escape → `onClose`).

### 8.2 Files to change

| File | Change |
|---|---|
| `components/pilot/WebLayout.jsx` | New shell: `DesktopTopBar` + `DesktopFilters` above a two-column body (`ResultsPanel` or the other screens in the panel · the map). Renders `PlaceDrawer` when `app.view === 'venue'` instead of swapping the panel. Drops the header's Install/Accessibility buttons (they live in Me) and `LayerToggles` + `MapLegend` over the map (Key dialog). |
| `components/pilot/screens/Find.jsx` | On `app.wide`, `FindResults` renders `ResultsPanel` (pages) and `FindHome` renders without its own search field (the top bar owns it). Phone path unchanged. |
| `components/pilot/explore/FindHeader.jsx` | Desktop: only the `h1`, the counts line (+ origin), Sort. Phone unchanged. |
| `components/pilot/explore/filters.js` | `applyFilters`: `dist` (max minutes) and `openNow`; `countsLine` unchanged. |
| `components/pilot/PilotApp.jsx` | `origin` rule (§7); `page` in app state for the desktop list; `venue` view keeps `venueOrigin` so Escape/Back returns to the same results page. |
| `components/pilot/PilotMap.jsx` | Marker tiers (§6); `leftPad` prop so pins avoid the drawer. |
| `components/pilot/explore/PlaceRow.jsx` | Name = visible text (remove `aria-label` / `aria-describedby`; add the sr-only "Yes:/Check:/No:" word in `OneReason`). The only phone-visible change, and it is invisible. |
| `app/globals.css` | `.web-*` rules → the new top bar, filter row, panel widths (480/440/400) and drawer; keep `html.ra-wide` zoom on the panel, bar and drawer, not the map. |
| `lib/i18n/messages/en/explore.ts`, `find.ts` | New strings: "In the map area", "Walking from the middle of the map.", "Walking from your location.", "Any distance", "Up to {n} min", "Open now", "Kind of place", "Verdicts are for these needs", "Page {n} of {m}", "Next {n}", "Previous", "The map shows the places on this page.", the Key's dot line. Plus the four machine translations. |

No migration, no API change, no database change.

### 8.3 Keyboard and focus order (verified in the mockup)

Skip to results → brand → search input → Clear → mic → Search → Saved → Me → chips (Works for
me · Category · For · Open now · Distance · More filters [· In the map area]) → Back to Find →
`h1` (focus lands here after a search, a chip, a sort or a page change) → Sort → cards (10) →
Previous · Next → **Skip the map** → Search this area → Show my location → Key → zoom + / − → the
visible pins in list order. Opening a chip's popover moves focus into it; Escape or Done returns
it to the chip. Clicking a card (or Enter) opens the drawer and moves focus to its `h2`; the
drawer's order is Close → Read aloud → How we decide → Still right? → the five actions → the folded
rows → Tell us how it was; Escape or Close returns focus to the card. Pin → the preview card →
Escape returns to the pin; "See details" opens the drawer.

### 8.4 Screen reader

Landmarks: banner (top bar) · region "Filters" · main "Places" · region "Map of the places in the
list" · complementary (the drawer, named by the place). Live region after a search, filter or page
change: "116 cafes and food places. 10 on the map." Chips are `aria-pressed` toggles or
`aria-haspopup="dialog"` buttons; counts are read as ", 3"; pins are buttons named "Hugos,
Restaurant, Works for you" with `aria-pressed` for the selected one.

### 8.5 Widths and text size

- **1440**: panel 480 · drawer 560 · map ≥ 400 with the drawer open.
- **1280**: panel 440 · drawer 520 · map 320 → the drawer covers the map ([`shots/a-1280-place.jpg`](shots/a-1280-place.jpg)); the list stays.
- **1024**: panel 400 · the drawer covers the map ([`shots/a-1024-place.jpg`](shots/a-1024-place.jpg)); the chip row wraps to two lines.
- **200 % text** ([`shots/a-200.jpg`](shots/a-200.jpg)): the top bar wraps (search on its own line), the chips wrap to two rows, the panel and drawer zoom like the app's `.web-panel`, the map does not. The bar and chips then take 575 of 900 px; **recommendation for the build**: at ≥ 175 % collapse the chip row into one "Filters (n)" button that opens `MoreFiltersSheet` with everything in it.

### 8.6 What changes on the phone

Nothing visible. Two invisible alignments: `PlaceRow`'s accessible name (§3.3), and the §7 origin
rule, which the phone's "Search this area" inherits for free.

---

## 9. Checks done on the mockups

- **axe-core 4 (WCAG 2.0/2.1/2.2 A + AA tags + best practice): 0 violations** on index, A before
  search, A results, A place, B results, B place, C place.
- **Keyboard**: 26 stops from the skip link to the tenth card, all ≥ 44 px, in reading order;
  Enter on a card → drawer heading; six stops inside; Escape → back to the card (log in the PR).
- **Contrast**: the app's palette only (`C2`), so every text pair is ≥ 4.5:1 and every control
  boundary ≥ 3:1 as on `/ds`. Verdicts are icon + colour + words everywhere, including the small
  markers (shape + icon) and the Key.
- **Widths** 1440 / 1280 / 1024 and **text** 100 / 150 / 200 %: see `shots/`.

What is real: the 232 places (names, kinds, suburbs, walks, OpenStreetMap wheelchair tags) are a
read-only snapshot of the dev database on 10 November 2026. The dev database had no reviews, so
twelve places carry sample facts and quotes, each marked "sample"; the map ground is drawn, the
pins are at the real coordinates.

---

## 10. Questions for Romy

1. **A, B or C?** (A recommended.)
2. Keep an **Accessibility** button in the top bar, or leave it in Me → Settings as on the phone?
3. "Open now" only appears when we have opening hours. Is it worth importing `opening_hours` from
   OpenStreetMap for the pilot area so the chip exists on day one?
4. The **dot** tier for overlapping places (§6): happy with "a dot is a place under another pin,
   zoom in", or would you rather see the small shapes nudge apart at every zoom (busier, but every
   place stays clickable)?
