# Roam Access — a simpler phone app for people with disability

*Design phase, 8 November 2026. Audit of the pilot as it is today (`apps/app` at commit
`309f20d`, the same code as https://roam-access.vercel.app), a redesign, clickable mockups,
and an ordered change list a second thread can build from without guessing.*

**Mockups:** [`mockups/index.html`](mockups/index.html) (open on a phone or at 390 px wide; every
screen has 100 / 150 / 200 % text buttons). **Screenshots:** [`before/`](before/) is the app
today, [`after/`](after/) is the mockups rendered at 390×844.

---

## 0. Summary

**The pilot does many things right** (one personalised verdict as icon + colour + words, honest
sources, 48 px targets, focus management, text size and contrast settings, five languages).
What makes it *hard to use* is not any one control. It is **how much is on every screen**, how
far the thing you came for is from the top, and how many different ways there are to start.

### The five biggest problems

| # | Problem | Who it hurts most | Evidence |
|---|---|---|---|
| 1 | **The place page is five screens long** (3 950 px at 390 wide; 40 controls; 12 headings) for a place with *no* reviews. Reviews, "Report a problem" and the "Getting there" directions sit 2–5 screens down. | Chronic fatigue, cognitive disability, screen-reader users | [before/venue-1…5](before/venue-1.jpg), measured in the browser |
| 2 | **Results put 14 controls before the first place** (search, 6 filter chips, List/Map, counts, needs line, "Use my location", sort). At 200 % text the first place is two screens down. | Low vision at 200 %, switch and keyboard users, cognitive | [before/results](before/results.jpg), [before/results-200](before/results-200.jpg) |
| 3 | **The map is unusable for a lot of people and still gets a whole screen.** 156 focusable pins, 30 overlapping 34×43 px pins and 20×20 px "No info yet" pins (below any target rule), a legend that covers the map, a drag sheet, and at 200 % the Layers button sits on the locate button. A scripted tap on a visible pin did nothing. | Blind, low vision, tremor, switch access | [before/map](before/map.jpg), [before/map-200](before/map-200.jpg), tab-order log in §1 |
| 4 | **Home gives seven different ways to start** above the fold: a 92 px voice hero, a search box, a "Help fill the gaps" card, a review prompt, "All places", four category tiles, two "Plan around access" tiles, then a list. Voice is the hero even for people who can't or won't speak. | Cognitive, older adults, Deaf and speech-impaired people, autistic people | [before/home](before/home.jpg), [before/home-bottom](before/home-bottom.jpg) |
| 5 | **The review form is one long page**: 3 verdict buttons, photos, 8 yes/no questions, "Noise, light and crowds", a note with dictation, "How to get in", then Send (disabled until you scroll back up and pick a verdict). ~3 screens. "Tap again to clear" is a hidden gesture; there is no "Not sure". | Cognitive, fatigue, dyslexic, screen-reader users | [before/review-1…3](before/review-1.jpg) |

### The new information architecture, in ten lines

1. **Three tabs: Find · Saved · Me.** Labels 14 px, bar 64 px, icon + word always.
2. **Find is one screen**: a search box (mic inside it), "Near me now", four big category buttons, then the list. Home and Results merge.
3. **The list is the answer. The map is an optional view** of the same list (List · Map switch), never a tab, never the default, never the only way.
4. **Every place row says four things**: name, kind · walk, the verdict (icon + colour + words), one reason.
5. **The place page leads with the verdict, why, and five actions**, then "Today" (temporary problems + report), "For your needs", "Getting there", "Reviews". Everything else is folded under **"More about this place"**.
6. **Getting there is its own screen** when you want more than the Directions button: which door, directions to it, parking and transport, steps from the street.
7. **Reviews are three short steps**: how was it → two questions for your needs → anything else. You can send after step one. Allies get "What did you notice?" with no verdict; carers get "It worked for them".
8. **Reporting a problem today is one dialog**, reachable without scrolling.
9. **Set-up is two steps**: tick your needs (real checkboxes, icons, Skip), then how you appear on reviews.
10. **One default for everyone. No "Simple mode."** The simple version *is* the app; extra detail is behind one tap, in the same place every time.

### Phase 1, in build order (details in §12)

1. Tab bar and shell: Find · Saved · Me; 64 px; 14 px labels; `aria-current`.
2. Find screen (merge Home + Results): search with mic inside, Near me now, four category buttons, list first.
3. Results diet: two chips + "More filters", one summary line, List/Map switch; map as an inline section with 48 px pins, a Key dialog, no sheet.
4. Place page: new order, verdict card with freshness inside it, "Today" block with Report a problem, "More about this place" disclosures.
5. Review in three steps, with "Not sure", and the ally and carer variants.
6. Set-up: checkboxes with icons + Skip; "How you'll appear" as step 2.
7. Plain-English copy pass (reading age ~9) on every string the core tasks show.
8. Place rows: shorter accessible names; one reason; "Unconfirmed" once.

---

## 1. How the app was tested

- Local build of `main` (`309f20d`) against the dev database, signed in with the Clerk test user
  `ux-redesign+clerk_test@example.com` (needs: wheelchair or mobility aid + seats and rest spots;
  name "Alex"). Deleted afterwards.
- Headless Chrome at **390×844** and **360×800**, device scale 2, touch on.
- **Text at 200 %** by pushing the app's own `--ra-scale` to 2 (the in-app setting stops at 150 %),
  and **reduced motion** via `data-ra-motion="reduce"`.
- **Keyboard only**: 28–40 presses of Tab on Home, Results and Map, logging the focused element,
  its size and its focus ring.
- **Screen-reader tree**: the accessibility snapshot of every screen (roles, names, states).
- Every screen: Welcome (signed out), Set up (needs, name), Home, Voice, Results, Map (+ pin card),
  Place (five scroll positions), Review (three scroll positions), Thanks, Saved, Me,
  Accessibility sheet, Help fill the gaps. Public pages, admin, business and council were out of
  scope.

Numbers that matter:

| Measure (390 px, 100 % text) | Today |
|---|---|
| Place page height for a place with no reviews | 3 950 px = 5.2 screens; 40 controls; 12 headings |
| Controls on Results before the first place | 14 (search 4 · chips 6 · List/Map · location · sort 2) |
| First place on Results, from the top | 470 px (2 screens at 200 %) |
| Starting points on Home above the fold | 7 kinds, 11 controls |
| Tab stops on the phone map | 156 pins (+ canvas); 30 "Check first" pins 34×43 px; "No info yet" pins 20×20 px |
| Tab bar label size · bar height | 12.5 px · 54 px |
| Review form height | ~2 530 px = 3.3 screens; 8 yes/no pairs; Send disabled at the bottom |
| Set-up options | 7 needs as `button aria-pressed` drawn as radio circles; no Skip button |

Keyboard log, phone map (excerpt): `1: BUTTON | Hugos, Restaurant, Check first | 34x43 @y201 …
30: BUTTON | Guzman y Gomez, Takeaway, No info yet | 20x20 @y233 …` (40 of 156 stops captured).

---

## 2. Audit — the problems, ranked by harm

Each row: what is wrong, who it hurts, the evidence, and what the redesign does about it.

| # | Problem (today) | Persona hurt most | Evidence | Redesign |
|---|---|---|---|---|
| 1 | **Place page is 5 screens long**, with 4 identical "Not confirmed by anyone yet / Report a problem" cards (duplicate-key bug, fixed by PR #23 from @thread:thr_x9c2kqp9gh), Getting there, Parking & transport, Step by step, What to expect, Noise/light/crowds, Photos, Community, Ask, Venue says, Report, footer links. | Chronic fatigue; cognitive; blind (12 headings to skim) | [venue-1](before/venue-1.jpg) → [venue-5](before/venue-5-bottom.jpg); 3 950 px | §8.3: verdict · actions · Today · For your needs · Getting there · Reviews · **More** (6 disclosures). Target ≤ 1 900 px, ≤ 18 controls, 7 headings. |
| 2 | **Results: 14 controls before the first place**; chips scroll sideways and clip ("Hide barriers" cut off, [results](before/results.jpg)); "Works for me 0" shows a dead filter; "Matched to your needs: wheelchair access + seating." is jargon. | Low vision 200 %; switch; cognitive | [results](before/results.jpg), [results-200](before/results-200.jpg) | §8.2: 2 chips + "More filters" dialog; one summary line; first place ≤ 420 px from the top; ≤ 7 controls above it. |
| 3 | **Map: 20×20 px and overlapping pins, 156 tab stops, legend over the map, drag sheet**; at 200 % Layers overlaps Locate. The scripted tap on the Hugos pin opened nothing. | Tremor, switch, low vision, blind | [map](before/map.jpg), [map-200](before/map-200.jpg), [map-360](before/map-360.jpg); tab log §1 | §8.2 map section: ≥ 48 px pins, ≤ 12 pins per view (nearest first, "Show more" by zoom), Key is a dialog, no sheet, list continues under the map, a "Skip the map" link. |
| 4 | **Home has seven ways to start** and the hero is voice. Voice fails in headless and in many real contexts ("Couldn't hear you", [voice](before/voice.jpg)); a Deaf or speech-impaired person meets a 92 px mic first. Two community cards (review prompt + gaps) sit above Browse. | Cognitive; older adults; Deaf and speech-impaired; autistic (noise) | [home](before/home.jpg), [home-bottom](before/home-bottom.jpg) | §8.1: one search box with the mic *inside* it; Near me now; four category buttons; at most one prompt card; the list straight away. Voice is a feature, not the hero. |
| 5 | **Review form is one long page** with 8 yes/no pairs for every need, photos, sensory, note, dictation, arrival steps and a Send that is disabled until a verdict is picked 3 screens up. "Tap an answer again to clear it" is an invisible gesture; no "Not sure". | Cognitive; fatigue; dyslexic; blind | [review-1](before/review-1.jpg), [review-2](before/review-2.jpg), [review-3](before/review-3.jpg) | §8.5: three steps; Send on every step; ≤ 3 questions, each Yes / No / Not sure; everything else one tap deeper. |
| 6 | **200 % text breaks layouts**: the verdict pill is `nowrap` and clips ("Works for y…"), the bottom button wraps to three lines, the search pill drops its text, the h1 fills the screen. | Low vision at 200 % | [venue-200](before/venue-200.jpg), [results-200](before/results-200.jpg), [home-200](before/home-200.jpg) | §9: pills wrap; buttons wrap to 2 lines max; h1 28 px not 34; search pill wraps its buttons under the field. Mockups checked at 200 %. |
| 7 | **Jargon and long sentences**: "sensory-sensitive", "first data point", "Matched to your needs: wheelchair access + seating", "OpenStreetMap (unconfirmed)" twice per row, "MLAK, adult change, hours", "Liberty Swings", "Only OpenStreetMap (unconfirmed) — nobody in the pilot has checked yet". | Cognitive / low literacy; dyslexic; people reading in a second language | [results](before/results.jpg), [home-bottom](before/home-bottom.jpg), [venue-1](before/venue-1.jpg) | §10 copy table: short sentences, one idea each, "Unconfirmed" once, no brand names in the first line. |
| 8 | **Two different "report" actions with the same word** on one page: "Report a problem" (listing is wrong) ×4 and "Report a temporary problem" (at the very bottom), plus "Still accurate? Yes / Something changed". | Cognitive; everyone | [venue-2](before/venue-2-duplicates.jpg), [venue-5](before/venue-5-bottom.jpg) | §8.3: "Report a problem today" under the actions; "Wrong name or location?" inside "Place details"; "Still right?" inside the verdict card, only when there are reviews. |
| 9 | **Set-up uses buttons drawn as radio circles for a multi-select**, no icons, "Step 2 of 3" with no step 1 in the app, and says "or skip it" without a Skip button. Screen readers hear "button, pressed", not "checkbox, checked". | Blind; cognitive; older adults | [setup](before/setup.jpg); tree in §1 | §8.8: real checkboxes, an icon per need, Skip for now, "Step 1 of 2". |
| 10 | **Tab bar is small** (12.5 px labels, 54 px) and "Home" doesn't say what you do there. Me holds a 3-stat "impact" card, a language picker, 9 rows and two lists. | Low vision; older adults | [home](before/home.jpg), [me](before/me.jpg) | §8.1/§8.7: Find · Saved · Me, 14 px, 64 px; Me is four short lists. |
| 11 | **Screen-reader names are long**: a row reads "Hugos Restaurant · Manly · 1 min walk Check first Check: Step-free (unconfirmed) OpenStreetMap (unconfirmed)" (21 words). The map announces each of 156 pins. | Blind | tree of Results and Map (§1) | §8.2: row name = "Hugos, restaurant, 1 minute walk, Check first" + one reason as description; map pins ≤ 12 and a "Skip the map" link. |
| 12 | **Keyboard focus lands after the search and filters** (on the h1), so a keyboard or switch user must Shift+Tab backwards to search; Results then give 25 stops per page. | Switch; keyboard | tab logs §1 | §8.2: focus the h1 that sits *above* the search on the Find screen; "Show 10 more" instead of 25; map pins reachable only inside the Map view. |
| 13 | **Colour carries too much on the map**: "No info yet" pins are grey 20 px dots with no glyph; the ✓ ! ✗ glyphs are ~10 px. | Colour-blind; low vision | [map](before/map.jpg) | §8.2: every pin is a 48 px circle with an 18 px glyph; the Key names each. |
| 14 | **Many modals and sheets stack**: Accessibility is a sheet over Me; the map has a sheet, a preview card inside the sheet, a Layers menu and a legend; Report is a sheet; the Entrance marker is a map inside a form. | Cognitive; blind (focus) | [a11y-sheet](before/a11y-sheet.jpg), [map-pin-card](before/map-pin-card.jpg) | One dialog at a time: Key, More filters, Report. Settings are a screen, not a sheet. The map never has a sheet. |
| 15 | **Typing where a choice would do**: the name step on set-up; the review note; "Ask about this place" (free text). Voice dictation helps but is not a substitute for a tap. | Motor; cognitive; dyslexic | [setup-name](before/setup.jpg), [review-3](before/review-3.jpg) | Name optional and last; questions are taps; "Ask" moves under More; note has "Say it instead of typing". |
| 16 | **Empty pilot data**: with no reviews the app shows "Works for me 0", "156 places · 29 check first · 127 no info yet", "Nearby, waiting for a first review". The promise can't show yet. | Everyone, first visit | [results](before/results.jpg), [home-bottom](before/home-bottom.jpg) | The list leads with places that have *any* community fact; "No info yet" rows say "Been here? Be the first"; the Works chip is hidden at 0. |

What already works and stays: the verdict as icon + colour + words; honesty lines; the
design-system tokens, `Button`, `ListRow`, `Sheet`, `Banner`, `EmptyState`, `Skeleton`; focus to
the heading on navigation; the route announcer; the text size / contrast / motion settings; five
languages; read-aloud; the "one tap review" idea; Getting there's "right door" model.

---

## 3. The seven core tasks — taps and decisions, before and after

"Taps" counts the minimum for a person who knows the app. "Decisions" counts the distinct
controls they must read past or choose between on the way. "Scroll" is screens at 100 % text.

| Task | Today: taps · decisions · scroll | Redesign: taps · decisions · scroll |
|---|---|---|
| 1. First-time set-up of my needs | *N* needs + Continue + Finish = **N+2** · 7 needs + name + a 4-item verdict legend · 1.5 | *N* needs + Continue + Finish = **N+2** (Skip is 1) · 7 needs with icons; step 2 = name + "which describes you" (needed for @thread:thr_7vm97nrz3g) · 1 |
| 2. Find a place near me that works for me | All places → "Use my location" (small link) → "Works for me" → row = **4** · 11 on Home + 14 on Results · 2 | "Near me now" → "Works for me" → row = **3** (or 1 when "Works for you, near you" rows are on Find) · 7 on Find · 0.5 |
| 3. Check one place by name | tap search → type → submit → row = **3** · 11 · 1 | tap search → type → submit → row = **3** · 2 · 0 |
| 4. Directions to the right entrance | Directions (action row) = **1** when an entrance is marked; else scroll 2 screens to Getting there · 40 · 2 | Directions = **1**; the caption says *which door*; Getting there is its own screen with both doors · 9 · 0 |
| 5. Save a place | Save (action row) = **1** · 40 · 0 | **1** on the place page, **1** on the map card · 9 · 0 |
| 6. Leave a quick review | Be the first → verdict → scroll 3 screens → Send = **3** · 30 · 3 | Tell us how it was → verdict → Send = **3** · 5 · 0 (0.5 at 200 %) |
| 6b. … as an ally | not possible | What did you notice → one answer → Send what I noticed = **2** · 9 · 0.5 |
| 7. Report a temporary barrier | scroll 5 screens → Report a temporary problem → type → Send = **3 + 5 screens** · 40 | Report a problem today → type → Send = **3** · 9 · 0 |

---

## 4. What we learned from products known for accessible simplicity

Concepts only; no brand's look is copied. Items marked † come from product knowledge, not from a
page fetched today (Apple's and Wheelmap's pages refused automated fetches).

| Product | Pattern we take | Where it lands |
|---|---|---|
| **Apple Assistive Access** † | One task per screen; items as a short list of big rows or a 2-wide grid with icon + word; a permanent, large **Back** in the same place; fewer apps, bigger everything, no gestures required. | Find's 2-wide category grid; Back always top-left; "More" instead of long pages; the three-step review. |
| **Be My Eyes** | One main action, said in one sentence; reassurance in the label ("100 % anonymous"). | One big teal button per screen; "Kept private" under the needs list. |
| **Seeing AI** | Lead with the outcome ("narrates the world around you"), not the feature list. | Find's lead: "Places around Manly, checked by people with needs like yours." |
| **Google Maps, Accessible Places** | One opt-in switch rather than a filter panel; the status is an icon *on* the place; **negatives are shown too**. | "Works for me" is one chip; verdict on every row; "Has barriers" stays visible. |
| **AccessNow** | Three verbs for the whole product (Search · Rate · Discover); browse by place type. | Find (search) · Tell us how it was (rate) · Near me now (discover). |
| **Wheelmap / wheel.city** † | Traffic-light rating with a fourth, grey "unknown"; marking a place is two taps; unknown places are the invitation. | Our four verdicts incl. grey "No info yet"; "Been here? Be the first" on unknown rows; quick answer = 2 taps. |
| **Sociability** | Entry by outing ("Coffee dates", "Drinks with friends") paired with a need tag; Sweet / Sour two-state review; "a few simple photos". | Phase 2: outing presets as search suggestions; our 3-state review stays, but "Some problems" replaces "Some barriers". |
| **GOV.UK "Do and don't" posters** | Plain English, simple sentences, descriptive buttons, large clickable actions, no reliance on memory of previous pages, don't separate actions from their context. | Copy table §10; "Shown as: …" repeated on the review form; actions next to the fact they act on. |

---

## 5. Principles (the rules the build must keep)

1. **One main action per screen**, as the single big teal button, in the same place (bottom on
   Place and Review; after the inputs elsewhere).
2. **The list is the answer; the map is a view.** Everything a map can do, the list can do.
3. **Nothing needs a gesture.** Drag, swipe, long-press and double-tap are optional shortcuts;
   every one has a visible button.
4. **Say it in words, with an icon, and with colour** — in that order of importance. A verdict
   with its icon and colour removed still reads correctly.
5. **Plain English at about reading age 9**: short sentences, one idea each, everyday words,
   first person. Brand names (OpenStreetMap, MLAK) never in the first line.
6. **Big by default**: body 17 px, inputs 18 px, targets ≥ 48 px with 8 px between them, tab
   labels 14 px. The in-app text size goes to 200 %, and every screen is checked there.
7. **Fewer things on each screen**; more detail is one tap deeper, in the same place every time
   ("More about this place", "More filters", "Add a bit more").
8. **Reading order = focus order = tap order.** Focus moves to the screen's `h1` (which is above
   the controls, not below them). One dialog at a time; focus returns to what opened it.
9. **Never colour alone, never sound alone, never motion.** Announce results in a live region;
   voice always has a typed and a tapped alternative.
10. **Honesty rules are untouched**: only community reviews make "Works for you"; OpenStreetMap
    is "Unconfirmed"; "What the venue says" and partner badges never change a verdict; names on
    reviews only with consent; access needs never leave the server without opt-in.

---

## 6. One simple default, not a "Simple mode"

Decision: **no Simple mode.** Reasons:

- A mode has to be found. The people it is for (low confidence with tech, cognitive disability)
  are the least likely to find a switch in Me → Accessibility.
- Two layouts double testing and halve attention; the "full" layout would keep accumulating
  the clutter this audit found.
- The things people genuinely need to vary are already settings that change *presentation*,
  not structure: text size, contrast, motion, read-aloud, language. These stay.
- What a Simple mode would strip out, the redesign puts behind one tap instead ("More about
  this place", "More filters", "Add a bit more"). The same place, every time, so people with
  memory or attention limits can learn it once.

What *is* allowed to adapt: the review form by relationship (lived experience / carer / ally),
which questions come first (by the person's needs), and the Directions destination (step-free
door for people with the mobility need). None of these add controls.

---

## 7. Information architecture

```
Tabs (always visible on phones):   Find           Saved           Me
                                    │               │               │
Find ─ search (mic inside) ──────► Results (same screen; list first; Map is a view)
     ─ Near me now                       │
     ─ Food & drink · Parks & beaches    ▼
     ─ Arts & culture · Toilets        Place ──► Getting there (screen)
     ─ one prompt card (if any)          │   ──► Reviews (all)
     ─ Near you (list)                   │   ──► Review (3 steps) ──► Thanks
                                         └──► Report a problem today (dialog)
Saved ─ updates from saved places (count on the tab) ─ list ──► Place
Me ─ What I need (Set-up step 1) · How I appear (step 2) · My badges
   ─ Help out: Answer one quick question · Invite
   ─ Settings: Text size, contrast, motion · Read aloud · Language · Home screen · How it works
   ─ Account: Sign out · Delete
   ─ More: My needs card · Own or run a venue?
```

**Removed from the main path** (not deleted; moved):

| Today | Where it goes |
|---|---|
| Voice screen (full-screen, dark) | A mic button inside the search field. Tapping it listens *in place*: the field shows "Listening…", then the words; a Cancel button appears. The full-screen Voice route is kept only as the fallback when in-place listening isn't possible. |
| "Help fill the gaps" card on Home and Thanks | Me → Help out → "Answer one quick question"; a ghost link on Thanks. |
| "Plan around access" tiles (toilets, beach) | "Toilets" is one of the four Find buttons; beach access items appear as rows in "Parks & beaches" results and in Getting there. |
| Sort segmented control (Best for me / Nearest) | One chip, "Nearest first" (default on when location is known). |
| "Hide barriers", "Quiet now", "Has quiet times", "Places to stay" chips | "More filters" dialog. |
| Map legend, Layers menu, SnapSheet, in-sheet preview card | Key dialog; layers become filters; the map is a 300 px section above the list; a pin opens a card *under* the map. |
| Verdict legend on the name step | A "What the answers mean" row in Me → How it works, and the Key dialog on the map. |
| Impact stats on Me | One line: "3 reviews · 2 badges. Thank you." |
| Language picker on Me *and* in the Accessibility sheet | Me → Settings → Language (a screen). |
| Accessibility *sheet* | Me → Settings → "Text size, contrast, motion" (a screen; no sheet over a tab). |
| Venue page: What to expect, Noise/light/crowds, Photos, Ask, Venue says, badges, footer links | "More about this place" disclosures, in that order. |
| Venue page: Parking & transport, Step by step | The Getting there screen. |
| Venue page: 4 "Not confirmed" cards, "Still accurate?" | One line inside the verdict card; "Still right? Yes / Something changed" only when reviews exist. |
| Review form: sensory questions, arrival steps, entrance map | Step 3 "Want to add more?" buttons; the entrance map only after "No" to step-free → "Yes, at the back/side" → "Show where it is on a map (optional)". |
| Install prompts (header, Me, Saved banner) | One row in Settings: "Put Roam Access on my home screen"; the Saved banner stays (it is contextual). |

---

## 8. Screens

For each screen: content order (top to bottom), components (reuse → extend → new), states, the
exact English copy, screen-reader labels, focus order, and the files to touch. The mockup file
is the reference for layout; copy below is the source of truth (it goes into
`lib/i18n/messages/en/*.ts` with the four machine translations marked unreviewed).

### 8.1 Find (replaces Home + Results) — [`mockups/find.html`](mockups/find.html), [after/find](after/find.jpg)

**Content order**
1. Header: logo only (no profile button; Me is a tab).
2. `h1` "Find a place." · lead "Places around Manly, checked by people with needs like yours."
3. Search field (`role=search` form): search icon, input, **mic button inside**, submit button.
4. Browse grid (`nav aria-label="Browse"`): "Near me now" (full width) · "Food & drink" ·
   "Parks & beaches" · "Arts & culture" · "Toilets" (2×2, icon + word, ≥ 96 px tall).
5. **At most one** prompt card: "Been to Hugos? Tell us how it was." (only when
   `world.visitedId` is set and not reviewed). The gaps prompt never shows here.
6. `h2` "Near you" · "Walking from Manly Wharf. [Use my location]" (a 44 px ghost button).
7. List of 5 rows (nearest places that have any community fact, else nearest), then
   "See all 232 places" (secondary button).
8. Tab bar.

When a search or category is active, the same screen shows the Results header instead of 2–6
(§8.2) — it is one route (`find`) with a query; no separate Results route.

**Components**: `ScreenHeader` (compact, no back), `SearchField` (extend: `voiceInline` prop
renders the mic inside and listens in place), new `BrowseGrid` (ds: `TileButton` — `Card` with
icon + label, `onClick`/`href`), `Card variant="tint"` row for the prompt, `List` + `PlaceRow`,
`Button secondary`, `TabBar` (moved from `ui/Shell` to `ds/TabBar`).

**States**: loading → `SkeletonList` (one "Loading…" message); location denied → the hint
stays "Walking from Manly Wharf."; outside the pilot area → `Banner tone="info"` "You're
outside Manly. Showing walking times from Manly Wharf."; offline → `Banner tone="offline"`.

**Copy** (en-AU): "Find a place." · "Places around Manly, checked by people with needs like
yours." · placeholder "Cafe, beach, Hugos…" · "Near me now" · "Food & drink" · "Parks &
beaches" · "Arts & culture" · "Toilets" · "Been to {name}? Tell us how it was." · "One tap. It
helps people with needs like yours." · "Near you" · "Walking from {origin}." · "Use my location"
· "See all {n} places" · "Been here? Be the first" (reason line on unknown rows).

**Screen reader**: input label "Search for a place or a kind of place"; mic "Search by voice";
submit "Search"; grid `nav aria-label="Browse"`; prompt card is one link with the two sentences
as its name; list `aria-labelledby` the "Near you" heading. Live region on voice: "Listening",
"Heard: {words}", "Couldn't hear you. Type instead."

**Focus order**: `h1` (focused on arrival) → search input → mic → search → Near me now → 4
tiles → prompt card → Use my location → rows → See all → tabs. 11 stops before the list.

**Files**: new `components/pilot/screens/Find.jsx` (replaces `Home.jsx` and `Results.jsx`;
keep `results` as an alias route in `PilotApp.jsx` `ROUTES`), `explore/BrowseGrid.jsx`,
`ds/TileButton.jsx`, `ds/TabBar.jsx` (from `ui/Shell.jsx`), `ds/SearchField.jsx` (+inline
voice using the engine from `screens/Voice.jsx`), `explore/FindHeader.jsx` (the results header
below), `lib/i18n/messages/en/find.ts` (new namespace), `lib/pilot-data.ts` (`RA2_TILES`:
replace "Places to stay" with "Toilets" → `cats: []`, `layer: 'toilets'`; "Places to stay" moves
to More filters).

### 8.2 Results (Find with a query) and the optional map — [`mockups/results.html`](mockups/results.html), [after/results](after/results.jpg), [after/results-map](after/results-map.jpg)

**Content order**
1. Back (to Find without a query) · search field with the query text, Clear, mic.
2. `h1` "24 cafes." (sr: "Search results for cafes.") · summary line "3 work for you · 12 check
   first · 9 no info yet." (omit any zero).
3. Chips (`ChipGroup`, wrapping, never clipped): "Works for me (3)" (hidden when 0) ·
   "Nearest first" (toggle; on by default when location is known) · "More filters" (opens a
   dialog).
4. "Show as" `SegmentedControl` List · Map (radiogroup).
5. **Map section** (only when Map is chosen): 300 px `region` with ≤ 12 pins of ≥ 48 px, a
   "Key" button (dialog) and "Show my location". A pin press shows a card *under* the map:
   name · kind · walk · verdict · "See place" · "Directions". Then `h2` "Places on this map".
6. The list (`List` + `PlaceRow`), 10 per page, "Show 10 more (18 left)".
7. Empty state (`EmptyState`): "Nothing matched 'xyz'." · "Try a kind of place, like cafe or
   beach." · action "See all places" · secondary "Clear filters" (only when filters are on).

**PlaceRow** (extend `explore/PlaceRow.jsx`): title, "kind · walk", verdict pill, **one** reason
("Step-free way in · 3 people", "Can get loud · 1 person", "Step-free on OpenStreetMap · not
checked", "Been here? Be the first"). Accessible name: "{name}, {kind}, {walk}, {verdict}";
`aria-describedby` the reason. ≥ 64 px tall, the whole row one link.

**Map rules**: pins are `button`s, 48 px, glyph 18 px (✓ ! ✗ ?), one colour per verdict plus
the glyph; `aria-label="{name}, {kind}, {verdict}"`, `aria-pressed` when selected; a selected
pin gets a 4 px dark outline. Max 12 pins per view: the nearest 12 of the list at the current
zoom; zooming in reveals more; overlapping pins cluster into one 56 px button "5 places here"
that zooms in. The Key is a dialog (`Sheet`) listing the four verdicts as pills. No SnapSheet.
A "Skip the map" link (visually hidden until focused) sits before the map region. `Esc` or
Close on the card returns focus to the pin. The map is remembered per session, not as the
default.

**More filters** (dialog, `Sheet`): "Hide places with barriers" · "Quiet now" · "Has an
accessible toilet nearby" · "Places to stay"; footer "Show {n} places". Copy line: "Filters only
narrow the list. They never change a verdict."

**Copy**: "{n} {kind}." (kind lower-case plural: cafes · places · parks and beaches) ·
"{a} work for you · {b} check first · {c} have barriers · {d} no info yet." · "Works for me" ·
"Nearest first" · "More filters" · "Show as" · "List" · "Map" · "Key" · "What the pins mean" ·
"Only reviews from people with needs like yours can make a place "Works for you"." · "Show 10
more" · "Places on this map" · "See place" · "Directions".

**Focus order**: `h1` (arrival) → Back → search → Clear → mic → chips (3) → Show as → [Skip
the map] → [map: Key, pins ≤ 12, Show my location, card buttons] → rows → Show 10 more → tabs.

**Files**: `explore/FindHeader.jsx`, `explore/ExploreFilters.jsx` (two chips + More),
`explore/MoreFiltersSheet.jsx` (new), `explore/MapSection.jsx` (new; replaces `screens/Map.jsx`;
uses `PilotMap` with `maxPins`, `pinSize: 48`, clustering), `explore/PlacePreviewCard.jsx`
(variant `under-map`), `explore/PlaceRow.jsx` (short name, one reason), `PilotMap.jsx` (pin size,
glyph size, `onCluster`, remove legend), `explore/filters.js` (`PAGE = 10`), `screens/Map.jsx`
→ delete after the alias period, `ds/Sheet.jsx` (unchanged), `lib/i18n/messages/en/explore.ts`.

### 8.3 Place — [`mockups/place.html`](mockups/place.html), [after/place](after/place.jpg), [after/place-report](after/place-report.jpg), [after/place-200](after/place-200.jpg)

**Content order**
1. Back (top-left, "Back"). `h1` "{name}." · "{kind} · {area} · {walk}".
2. **Verdict card** (`section`, tone by verdict): big pill (icon + words) · one bold sentence ·
   one source line with the date · "Read aloud" + "How we decide". When the place has
   community reviews, a third line: "Still right? [Yes] [Something changed]" (two 48 px
   buttons; "Yes" refreshes the date, never the verdict).
3. **Action row**: Directions (primary) · Save · Call · Website · Share. Leave out what doesn't
   apply. Under it, one caption only when it matters: "Directions go to the step-free door."
4. `h2` **Today**: live temporary reports as `Banner tone="warn"` (each with "Still there" / "It's
   fixed"), then the outline button "Report a problem today" (opens the dialog in §8.6). This
   block is always present, so the report button is in the same place for every venue.
5. `h2` **For your needs**: up to 3 facts, each a row: mark (✓ ! ✗ ?) + fact + "{n} reviews ·
   last one {date}". Facts come from `lib/pilot/key-facts` for the person's needs; OSM-only facts
   read "On OpenStreetMap · not checked" with the ? mark. If the person has no needs set:
   "Set your needs to see what matters to you" (link to Set-up).
6. `h2` **Getting there**: one card: the best entrance in words ("Step-free door: at the back,
   through the car park."), who marked it and when, **"Directions to the step-free door"**
   (primary), "More about getting there" (ghost → §8.4). With no marked entrance: "Nobody has
   marked the step-free door yet. Directions go to the street address." + "Mark the door in a
   review" (ghost).
7. `h2` **Reviews ({n})**: the newest review as a card (quote · "{name} · {relationship} ·
   {lived experience} · {date}" · "This helped me ({n})") then "Read all {n} reviews"
   (secondary). With none: "No reviews yet. Been here? Tell us how it was."
8. `h2` **More about this place**: `details` disclosures, in this order: Photos ({n}) · Noise,
   light and crowds · What to expect, step by step · Ask about this place · What the venue says ·
   Place details and corrections (OpenStreetMap credit, "Wrong name or location?", "Own or run
   this venue?", "Share a printable summary"). Each closed by default; the open one is remembered
   per session.
9. Bottom bar (`footer`): **"Tell us how it was"** (primary, `icon="edit"`). The same words for a
   first or later review.

**Components**: `ScreenHeader`, new `ds/VerdictCard.jsx` (absorbs `trust/SourceLine`,
`trust/Freshness`, the Read-aloud button), `ActionRow` (unchanged), `layers/TempReports`
(`TempReportBanner` + `ReportButton` moved up), new `venue/KeyFacts.jsx` (from
`PlacePreviewCard`'s `KeyFactList`, bigger), `arrival/GettingThere.jsx` → split: `arrival/
EntranceCard.jsx` (the summary card here) and `screens/Arrival.jsx` (§8.4), `venue/ReviewCard.jsx`
(with "This helped me" from @thread:thr_7vm97nrz3g), new `ds/Disclosure.jsx` (a `details`/
`summary` pair with icon, 60 px summary, chevron, `aria-expanded` is native), `Button`.

**States**: loading reviews → `SkeletonText` inside the Reviews card; verdict `unknown` → grey
card, sentence "Nobody with your needs has reviewed this place yet." and the Reviews block says
"Been here? Tell us how it was."; no phone/website → action omitted; temporary report confirmed
by me → "You said it's still there" (disabled button); offline → Banner at the top, actions still
work for tel:/maps links.

**Copy (verdict card)**: works "**{n} people with needs like yours say it worked.**" · check
"**Something to know before you go.**" (+ the first check fact as the sentence when there is
one: "1 person says there are few seats.") · barrier "**People with needs like yours hit a
barrier here.**" · unknown "**Nobody with your needs has reviewed this place yet.**" · source
line "From community reviews. Last checked {date}." / "From OpenStreetMap only. Not checked by
anyone yet." · "Read aloud" · "How we decide" · "Still right?" · "Yes" · "Something changed".
**Today**: "Today" · "Reported {ago} · shows until {when}" · "Still there" · "It's fixed" ·
"Report a problem today". **For your needs**: "For your needs" · "Step-free way in" ·
"Accessible toilet" · "Seats and rest spots" · "Quiet enough" · "Calm, not hectic" · "Easy to
find your way" · "Help for hearing" · "Help for low vision" · "{n} reviews · last one {date}" ·
"On OpenStreetMap · not checked" · "Set your needs to see what matters to you". **Getting
there**: "Getting there" · "Step-free door: {where}" (where = "at the front" · "at the side" ·
"at the back" · "by the lift" · "another way") · "Marked by a {who} · {date}" · "Directions to
the step-free door" · "Directions" · "More about getting there" · "Nobody has marked the
step-free door yet. Directions go to the street address." · "Mark the door in a review".
**Reviews**: "Reviews" · "This helped me" · "Read all {n} reviews" · "No reviews yet. Been here?
Tell us how it was." **More**: "More about this place" · "Photos" · "Noise, light and crowds" ·
"What to expect, step by step" · "Ask about this place" · "What the venue says" · "Place details
and corrections" · "Wrong name or location?" · "Own or run this venue?" · "Share a printable
summary". **Bar**: "Tell us how it was".

**Screen reader**: verdict `section aria-labelledby` a visually hidden `h2` "Does it work for
you?"; the pill's glyph is `aria-hidden`, the words are the name; action buttons named "Save
{name}", "Call {name}", "{name} website, opens in a new tab", "Share {name}"; Today's banners
are `role=group` "Problem reported today"; each fact row's mark has sr text "Yes:" / "Check:" /
"No:" / "Not checked:"; disclosures are native `details` (announced "collapsed/expanded").
"Read aloud" reads: name, verdict words, the bold sentence, the source line, the facts.

**Focus order**: `h1` → Back → Read aloud → How we decide → [Still right? Yes · Something
changed] → Directions → Save → Call → Website → Share → [Still there · It's fixed]… → Report a
problem today → (facts are not focusable) → Directions to the step-free door → More about getting
there → This helped me → Read all reviews → 6 disclosure summaries → Tell us how it was → tabs.
Target: ≤ 18 stops for a typical place.

**Files**: `screens/Venue.jsx` (reorder; remove `FactList`×3 → `KeyFacts`; remove `Freshness`,
`WhatToExpect`, `SensorySummary`, `VenuePhotos`, `AskPlace`, `VenueSays`, `VenueAccessExtras`,
`VenueFooterLinks` from the main flow → `venue/VenueMore.jsx`), `ds/VerdictCard.jsx`,
`ds/Disclosure.jsx`, `venue/KeyFacts.jsx`, `venue/ReviewCard.jsx`, `venue/TodayBlock.jsx`,
`arrival/EntranceCard.jsx`, `trust/Freshness.jsx` (becomes the "Still right?" row inside the
card), `lib/i18n/messages/en/venue.ts`, `trust.ts`, `layers.ts`. Keep `VerdictReasons` for
rows only.

### 8.4 Getting there (screen) — [`mockups/directions.html`](mockups/directions.html), [after/directions](after/directions.jpg)

Route `arrival/{venueId}`. **Content order**: Back "Back to {name}" · `h1` "Getting to
{name}." · lead "The right door, and how to reach it." · **Door card**: `h2` "Step-free door:
{where}" · the note in the marker's words · the entrance photo (described) · "Marked by a {who}
· {date}" · "Still the way in? [Yes] [It changed]" · **"Directions to the step-free door"**
(primary; `aria-describedby` "Opens in Google Maps / Apple Maps") · "Directions to the front
door instead" (outline) · a `details` "Change maps app" with the Apple / Google segmented
control · `h2` "Where the door is": the mini-map as an image with a full text alternative ("Map:
{name} on {street}. The street address is at the front, on {street}. The step-free door is at
the back, on {lane}, about {m} metres from the front.") and a two-item key (A street address ·
D step-free door) · `h2` "Parking and transport nearby" + the line "Listed on OpenStreetMap, not
yet checked by the community." + ≤ 3 rows (parking · stop/wharf · accessible toilet), each a row
with a Directions icon · `h2` "Step by step from the street" · "From a {who}, {date}" · "Read
aloud" · numbered steps · "These steps are wrong or out of date" (outline) · with none: "No one
has added steps yet. If you know the way in, add it for the next person." + "Add the steps".

Entrances never change a verdict; OSM entrances show as "unconfirmed"; a "Changed" answer
stops directions going there (unchanged rules from `lib/arrival/entrances.ts`).

**Files**: `screens/Arrival.jsx` (new; composes today's `arrival/GettingThere.jsx` parts:
`MiniMap`, `ArrivalNearby`, `ArrivalSteps`, `ARRIVAL_SLOTS` — keep the slots mechanism), add
`'arrival'` to `ROUTES` and `VENUE_VIEWS` in `PilotApp.jsx`, `lib/i18n/messages/en/arrival.ts`.

### 8.5 Review — three steps — [`mockups/review.html`](mockups/review.html), [after/review](after/review.jpg), [after/review-2](after/review-2.jpg), [after/review-3](after/review-3.jpg)

One route `review/{venueId}`; three in-page steps with a progress bar (3 segments, `aria-hidden`)
and a visually hidden "Step {n} of 3" that is also announced. Focus moves to the step's `h1`.
Back on step 1 goes to the place; on later steps it goes back a step. **Send is available on
every step**; nothing but the verdict is required.

Above the title on every step: "Shown as: **{name} · {relationship} · {lived experience}**
[Change]" — what @thread:thr_7vm97nrz3g's `withAuthor()` would render for this person, so
nobody is surprised by what readers see. For legacy accounts: "Shown as: **Wheelchair user**
(no name)".

**Step 1 — "How was {name}?"** · lead "One tap is enough. The rest is optional." · three big
`aria-pressed` choices, each mark + label + hint:
- ✓ "It worked for me" — "I could get in, get around and enjoy it"
- ! "Some problems" — "I managed, but others should know first"
- ✗ "It didn't work for me" — "I couldn't use it the way I needed"
· **Send** (disabled until a choice; hint "Pick one of the three to send." → after a choice:
"Shown with your name and lived experience, as you chose in Me.") · "Add a bit more (2
questions)" (secondary; the number is how many questions step 2 has).

**Carer variant** (relationship = carer): lead "Tell us how it went for the person you were
with. One tap is enough." and labels "It worked for them" / "Some problems" / "It didn't work
for them", hints in the third person. Step 2's questions use the needs of the person they were
with (from the profile; "Whose needs?" chips at the top of step 2 to change them for this
visit).

**Step 2 — "Two quick questions"** (title says the real number: "One quick question" · "Three
quick questions") · lead "For people who need what you need. Skip any you're not sure about." ·
the questions for *this person's needs only*, max 3, in `RA2_NEEDS` tag order; each a
`role=group` with a question sentence and three 52 px buttons **Yes / No / Not sure** (one
group, `aria-pressed`; "Not sure" clears — no tap-again gesture). "Was there a step-free way in?"
→ No reveals "Is there another way in without steps?" [Yes, at the side] [Yes, at the back] [No]
and the ghost link "Show where it is on a map (optional)" which opens the existing
`EntranceMarker` as a dialog. People with no needs set get the two most useful questions
(step-free, toilet). · **Send** · "Add a photo or a note" (secondary).

**Step 3 — "Anything else?"** · lead "All optional. A photo of the door or the toilet helps
most." · "Add a photo" (outline; `ReviewPhotos` with its required description and the AI
suggestion flow unchanged) · hint "We remove the location from photos. Please avoid people's
faces." · "A few words (optional)" textarea · "Say it instead of typing" (outline; `Dictate`) ·
"Want to add more?" → [Noise and crowds] [Steps from the street] (each opens its existing form as
a dialog; both save on their own, as today) · **Send**.

Questions beyond the person's needs (the other five) are **not** asked in the lived-experience
and carer forms; they are the ally form's job and the quick-answer feature's job. (Today's form
asks all eight to everyone.)

**Ally variant** — [`mockups/review-ally.html`](mockups/review-ally.html), [after/review-ally](after/review-ally.jpg): one screen, no steps, no verdict. "Shown as: Jo · Ally [Change]"
· `h1` "What did you notice at {name}?" · `Banner tone="info"`: "You're writing as an ally. What
you share is shown as "Observed by an ally". It never changes whether a place works for
someone." · lead "Answer only what you saw yourself. Skip the rest." · five questions (Step-free
way in? · Accessible toilet? · Seats and places to rest? · Quiet enough to talk? · Easy to find
your way around?) each Yes / No / Not sure · a `details` "Three more questions" (Calm, not
hectic? · Help for people who are deaf or hard of hearing? · Good light and large print for low
vision?) · "Anything else? (optional)": Add a photo · A few words · Say it instead of typing ·
**"Send what I noticed"** (disabled until one answer; hint "Answer at least one question to
send." → "Shown as "Observed by an ally"."). Submits with no `verdict`; the server stores an
observation (the contributors branch's `ally` path).

**Thanks** — [`mockups/thanks.html`](mockups/thanks.html): "Sent" pill · `h1` "Thanks, {name}."
· "Your review of {place} is live. It helps people with needs like yours." · one status card
"{n} reviews of {place} now · {m} places you've reviewed" · a new-badge card when earned ("New
badge: Entrance finder" · "See my badges") · **Done** · ghost "Answer one quick question about a
place nearby". Today's teal background passes (paper at 70 % on teal is 5.2:1), but the mockup uses the
normal paper background so the screen matches the rest of the app and reads at 200 %.

**Screen reader**: each step is a `section aria-labelledby` its `h1`; the live region says
"Step 2 of 3. Two quick questions."; choices are buttons with `aria-pressed`; the Yes/No/Not
sure trio is a `group` named by the question; Send's state is explained by
`aria-describedby`.

**Focus order (step 1)**: `h1` → Back → Change → choice ×3 → Send → Add a bit more. 8 stops.

**Files**: `screens/Review.jsx` → `screens/review/ReviewSteps.jsx` (state + stepper),
`review/VerdictStep.jsx`, `review/QuestionsStep.jsx`, `review/ExtrasStep.jsx`,
`review/AllyReview.jsx`, `review/ShownAs.jsx`; new `ds/Stepper.jsx` (progress + sr text + focus
helper), `ds/YesNoNotSure.jsx` (group of three `aria-pressed` buttons; also used by Gaps and the
ally form); reuse `photos/ReviewPhotos`, `ui/Dictate`, `arrival/EntranceMarker` (as a `Sheet`),
`sensory/SensoryQuestions` (as a `Sheet`), `arrival/ReviewStepsEntry` (as a `Sheet`);
`lib/pilot-data.ts` (question sentences: see §10); `app/api/reviews/route.ts` (accept
`features` with `'unsure'` = absent; ally posts without a verdict — coordinate with
@thread:thr_7vm97nrz3g); `lib/i18n/messages/en/review.ts`.

### 8.6 Report a problem today (dialog) — [after/place-report](after/place-report.jpg)

`Sheet` titled "Report a problem today" with Close; line "It shows on {name} for a day, then
goes. It never changes the verdict."; a radio list (real `input type=radio`, 60 px rows), one per report type in
`lib/layers/defs.ts` that applies to a venue: "Lift not working" (`lift_out`) · "Ramp or step-free
way blocked" (`ramp_blocked`) · "Accessible toilet closed or locked" (`toilet_closed`) · "Event on —
loud and crowded" (`event_noise`) · "Roadworks or footpath closed" (`roadworks`) · "Something else"
(`other`); "Add a few words (optional)" textarea; **Send**. On send: close, focus
back to the Report button, toast "Thanks. It shows on {name} until tomorrow." Error: `Banner
tone="danger" live="assertive"` inside the dialog. Only the labels change; the ids, hours and
"Still there?" logic in `lib/layers/defs.ts` stay as they are. **Files**: `layers/TempReports.jsx` (copy and
radio rows), `lib/i18n/messages/en/layers.ts`.

### 8.7 Saved and Me — [`mockups/saved.html`](mockups/saved.html), [after/saved](after/saved.jpg) · [`mockups/me.html`](mockups/me.html), [after/me](after/me.jpg)

**Saved**: `h1` "Saved." · lead "Your places. We tell you when something changes at them." ·
`Card tint` "**{n} updates from your saved places**" with one row per update (place · what
changed · when → the place) and "Mark all as seen" (from @thread:thr_f79q89aark's updates count;
the same number sits on the Saved tab as a pip with sr text ", 2 updates") · `h2` "{n} places" ·
the list (rows with an "Updated" badge when they have unseen updates) · hint "Saved places are
stored with your account, on every device." Empty: `EmptyState` "Nothing saved yet" · "Save a
place from its page. It waits here." · "Find a place". The install banner stays, after the list.

**Me**: `h1` "{name}." · "{n} reviews · {m} badges. Thank you." · `h2` "About you": What I need
(sub: the chips as words; trailing "Edit") · How I appear on reviews (sub: "Alex K. · Lived
experience · needs shown"; trailing "Change") · My badges (sub: earned names · "2 of 9") · `h2`
"Help out": Answer one quick question ("{n} places near you need a yes or no") · Invite someone
to the pilot · `h2` "Settings": Text size, contrast, motion (sub shows the current values) · Read
aloud · Language · Put Roam Access on my home screen · How Roam Access works · `h2` "Account":
Sign out · Delete my account (danger) · `h2` "More": My needs card · Own or run a venue? Every row
is a `ListRow` ≥ 64 px with an icon. The Accessibility *sheet* becomes a screen (`settings`
route) with the same controls as today, plus "Largest" = 200 %.

**Files**: `screens/Saved.jsx` (updates block; needs the updates API from the venue-updates
thread), `screens/Me.jsx`, `screens/Settings.jsx` (from `A11ySheet.jsx`), `ds/TabBar.jsx` (pip),
`PilotApp.jsx` (`SCALE_VALUES` add 2; route `settings`), `lib/i18n/messages/en/me.ts`.

### 8.8 Set-up — [`mockups/setup.html`](mockups/setup.html), [after/setup](after/setup.jpg), [after/setup-2](after/setup-2.jpg)

**Step 1 of 2 — "What do you need at a place?"** · lead "Tick all that apply. You can change
this any time." · seven **checkboxes** (`input type=checkbox` inside a 72 px label, a 30 px
box, an icon per need): "I use a wheelchair or a walking aid" · "I'm blind or I don't see well" ·
"I'm deaf or I don't hear well" · "Noise, light or crowds are hard for me" · "I need places that
are easy to understand" · "I need calm, low-stress places" · "I need seats and places to rest" ·
hint "Kept private. Reviews show your lived experience (like "Wheelchair user") only if you say
so on the next step." · **Continue** · "Skip for now" (ghost; goes to Find with no needs).

**Step 2 of 2 — "How you'll appear on reviews"** (the contributors thread's form, in this order)
· lead "Readers see who wrote a review. You choose what they see." · "Name on your reviews
(optional)" text field + hint "A first name and last initial is fine. Or a nickname." · checkbox
"Post without a name — Reviews show "Roam Access member"." · radios "Which describes you?": "I
have a disability or access need — Shown as "Lived experience"" · "I'm a carer, family member or
support worker — Shown as "Carer". You review for the person you were with." · "I want to help
(ally) — You share what you noticed. It never changes a verdict." · "Prefer not to say" ·
checkbox "Show my needs on my reviews — Like "Wheelchair user". Reviews are public. You can turn
this off any time." · a live preview "Your reviews will show: **Sam K. · Lived experience ·
Wheelchair user**" · **Finish**. The verdict legend is removed from set-up (it moves to "How
Roam Access works" and the map Key).

Progress: two 8 px segments + sr "Step 1 of 2". Focus to the `h1` on each step. Existing
testers who open Me → "What I need" get step 1 only; "How I appear" gets step 2 only.

**Files**: `screens/Setup.jsx` (checkbox semantics, icons, Skip), `screens/SetupName.jsx` →
`screens/SetupAppear.jsx` (coordinate with @thread:thr_7vm97nrz3g — their `contrib.form.*`
strings are the source; this screen is the layout), `ds/ChoiceBox.jsx` (checkbox/radio choice
row), `ds/Icon.jsx` (add `wheelchair eye ear bell brain leaf seat door parking bus toilet heart
photo`), `lib/pilot-data.ts` (labels), `lib/i18n/messages/en/onboarding.ts`.

### 8.9 Voice, in place

The search field's mic button starts recognition without leaving the screen: the input shows
"Listening…" with a stop button (replacing the mic), interim words appear in the input, and a
final result runs the search. If recognition isn't available or hears nothing within 7 s, the
input shows the hint "Couldn't hear you. Type instead, or tap an example:" with the three example
chips under the field. The full-screen `Voice` route stays as the fallback for browsers that
can't do this (and for `#/voice` deep links), restyled to the same palette with ≥ 4.5:1 text.
**Files**: `ds/SearchField.jsx`, `explore/useVoiceSearch.js` (the engine extracted from
`screens/Voice.jsx`), `lib/i18n/messages/en/explore.ts`.

---

## 9. Design-system changes (`components/pilot/ds/`)

| Change | What | Why |
|---|---|---|
| `tokens.js` | `TYPE.body` 17 px (was 16), `TYPE.footnote` 15 (was 14), `TYPE.caption` 14 (was 13), `TYPE.display` 30 (was 34), `TYPE.title1` 28; `TARGET.std` 48, `TARGET.row` 64; add `SCALE_MAX = 2` | Bigger by default; 200 % must fit. |
| `Button` | wrap to two lines (`whiteSpace: normal`, `lineHeight 1.25`); `size="lg"` 56 px | Three-line buttons at 200 % today. |
| `ui/Verdict` | `whiteSpace: normal; maxWidth: 100%`; glyph 24 px (big 32) | Clipped "Works for y…" at 200 %. |
| **new `TabBar`** | 64 px, 14 px labels, `aria-current`, optional count pip with sr text, moved from `ui/Shell` | Problem 10. |
| **new `TileButton`** | 2-wide grid tile: icon 28 px + label; `wide` variant | Find's browse grid. |
| **new `Disclosure`** | native `details`/`summary`, 60 px summary with icon and chevron, `inner` padding; group helper that remembers the open one | "More about this place". |
| **new `VerdictCard`** | pill + sentence + source + date + optional "Still right?" + Read aloud / How we decide | Problem 1, 8. |
| **new `ChoiceBox`** | a real checkbox or radio inside a 72 px bordered label with optional icon and hint | Set-up, report dialog. |
| **new `YesNoNotSure`** | three `aria-pressed` buttons in a `group` named by the question | Review, ally, gaps. |
| **new `Stepper`** | progress segments + sr "Step n of m" + `useStepFocus()` | Review, set-up. |
| `SearchField` | `voiceInline`; buttons wrap under the field at 200 %; `enterkeyhint="search"` | Problems 4, 6. |
| `ChipGroup` | `wrap` by default on phones; never horizontal scroll for ≤ 3 chips | Clipped chips. |
| `Sheet` | unchanged; used for Key, More filters, Report, Entrance marker, Sensory, Steps | One dialog at a time. |
| `SnapSheet` | no longer used on the phone map (keep for desktop if wanted) | Problem 3. |
| `PilotMap` | `pinSize` 48, glyph 18, `maxPins` 12 + clustering, no legend, `focusable` only when the Map view is open | Problem 3, 13. |
| `Icon` | add `wheelchair eye ear bell brain leaf seat door parking bus toilet heart photo` | Icons beside every word. |
| `/ds` page | show every new component in every state at 100 / 150 / 200 % and high contrast | Rule in AGENTS.md. |

---

## 10. Copy — plain English at about reading age 9

Rules: ≤ 12 words a sentence, one idea each, everyday words, first person, no brand in the first
line, numbers as digits, dates as "2 November 2026". Every string goes through `t()`; the
four translations are regenerated and marked unreviewed.

| Today | New |
|---|---|
| Hi Alex. Where do you want to go today? | Find a place. |
| Tap and speak "Find a quiet cafe with step-free entry" | (mic inside the search box) Search by voice |
| Or type what you're looking for | Cafe, beach, Hugos… |
| Help fill the gaps · 3 places near you need one quick answer · Yes or no — one tap each. Only if you've been there. | Answer one quick question · 3 places near you need a yes or no |
| Plan around access · Accessible toilets · MLAK, adult change, hours | Toilets |
| Nearby, waiting for a first review · Been to one of these? Your review is the first data point. | Near you · (on the row) Been here? Be the first |
| 156 places. · 29 check first · 127 no info yet · Matched to your needs: wheelchair access + seating. · Walking times from Manly Wharf. Use my location · Best for me / Nearest | 24 cafes. · 3 work for you · 12 check first · 9 no info yet. · Nearest first (chip) · Walking from Manly Wharf. Use my location |
| Check: Step-free (unconfirmed) · OpenStreetMap (unconfirmed) | Step-free on OpenStreetMap · not checked |
| Not yet confirmed by anyone in the pilot. Check before you go — then tell us how it was. | Nobody with your needs has reviewed this place yet. |
| Only OpenStreetMap (unconfirmed) — nobody in the pilot has checked yet | From OpenStreetMap only. Not checked by anyone yet. |
| What works for your needs, from 3 community reviews. | 3 people with needs like yours say it worked. |
| Things to know before you go, from … | Something to know before you go. |
| People in the pilot have flagged real barriers here, from … | People with needs like yours hit a barrier here. |
| Not confirmed by anyone yet · Place details come from OpenStreetMap. Been here? Your review would be the first. · Closed, moved, in the wrong spot or listed twice? Report a problem | (inside the verdict card) Last checked 2 November 2026 · (under More → Place details) Wrong name or location? |
| Still accurate? Yes / Something changed | Still right? Yes / Something changed |
| Report a temporary problem | Report a problem today |
| Lift out of order · Ramp or step-free way blocked · Roadworks or footpath closed · Event or loud noise · Accessible toilet closed or locked · Something else | Lift not working · Ramp or step-free way blocked · Roadworks or footpath closed · Event on — loud and crowded · Accessible toilet closed or locked · Something else |
| Be the first to review / Share your experience | Tell us how it was |
| Your experience · How was Hugos? · One tap helps other people plan their day. Everything else is optional. | How was Hugos? · One tap is enough. The rest is optional. |
| It worked for me — I could get in, get around, and enjoy it | It worked for me — I could get in, get around and enjoy it |
| Some barriers — I managed, but with workarounds | Some problems — I managed, but others should know first |
| It didn't work — I couldn't use the venue as I needed | It didn't work for me — I couldn't use it the way I needed |
| Tell us more (optional) · Answer only what you noticed. Tap an answer again to clear it. | Two quick questions · For people who need what you need. Skip any you're not sure about. · Yes / No / Not sure |
| Step-free way in? · Accessible bathroom? · Seats and rest spots? · Quiet enough? · Calm, not hectic? · Hearing support (loop, captions, staff who write things down)? · Good for low vision (lighting, large print, help)? · Easy to find your way around? | Was there a step-free way in? · Was there an accessible toilet? · Were there seats and places to rest? · Was it quiet enough to talk? · Was it calm, not hectic? · Was there help for people who are deaf or hard of hearing? · Was there good light and large print for low vision? · Was it easy to find your way around? |
| Anything else? (optional) · e.g. The ramp is round the side; staff were great · Prefer to talk? Dictate instead | A few words (optional) · e.g. The ramp is round the side. Staff were great. · Say it instead of typing |
| How to get in (optional) · Short steps from the street to the door help the next person find the way in. They save on their own, straight away. You can send your review without them. | Want to add more? → Steps from the street |
| Send it → · Choose one of the three options above to send. | Send · Pick one of the three to send. |
| I use a wheelchair or mobility aid · I'm blind or have low vision · I'm deaf or hard of hearing · I'm autistic or sensory-sensitive · Easy-to-understand places help me · Calm, low-stress places help me · I need seats and rest spots (fatigue, pain) | I use a wheelchair or a walking aid · I'm blind or I don't see well · I'm deaf or I don't hear well · Noise, light or crowds are hard for me · I need places that are easy to understand · I need calm, low-stress places · I need seats and places to rest |
| What do you need to enjoy a place? · Pick as many as you like. We'll rank places by what fits — you can change this anytime, or skip it. | What do you need at a place? · Tick all that apply. You can change this any time. · Skip for now |
| Stored securely to personalise your results. Reviews show your lived experience (like "Wheelchair user"), never your name. Delete everything anytime from Me. | Kept private. Reviews show your lived experience (like "Wheelchair user") only if you say so on the next step. |
| Home · Saved · Me | Find · Saved · Me |
| Accessibility · Adjust how the app works for you. Saved on this device. | Text size, contrast, motion |
| Install the app · Add Roam Access to your home screen | Put Roam Access on my home screen · Opens like an app |
| Your impact · 0 reviews · 0 places reviewed · 1 person in the pilot | 3 reviews · 2 badges. Thank you. |
| Nothing saved yet · Save places that work for you and they'll wait here, with the latest from people in the pilot. | Nothing saved yet · Save a place from its page. It waits here. |

Verdict words stay: **Works for you · Check first · Has barriers · No info yet.**

---

## 11. Covering the threads in flight

| Thread | What it adds | Where it lives in this design |
|---|---|---|
| @thread:thr_7vm97nrz3g — names on reviews; lived experience / carer / ally; "This helped me"; badges; relationship-aware review form | Names + relationship chosen in **Set-up step 2** and Me → "How I appear on reviews" (§8.8), using its `contrib.form.*` strings. Review cards show "{name} · {relationship} · {lived experience} · {date}" and the **"This helped me ({n})"** toggle (§8.3). The review form shows **"Shown as: …"** on every step; **carer** labels and **ally** "What did you notice?" with no verdict (§8.5). **Badges**: a Me row ("2 of 9") and a card on Thanks when earned. The "one-time prompt for accounts from before names" becomes a `Banner tone="info"` on Find, once, with "Choose how I appear" / "Keep my reviews as they are". Reviews filter by relationship lives on the "Read all reviews" screen as three chips. |
| @thread:thr_f79q89aark — venue updates, venue photos, "Updates from your saved places" count | The **Saved tab pip** and the **updates card** at the top of Saved (§8.7). Venue photos appear in "More → Photos" with a `SourceBadge source="venue"` and in the updates list ("the venue added 2 photos"). "What the venue says" stays a disclosure under More; it never changes the verdict. |
| @thread:thr_x9c2kqp9gh — duplicate "Last confirmed" cards | The bug is fixed by PR #23; the redesign also removes the separate cards (the date is one line inside the verdict card), so the surface can't regress. |

---

## 12. Phased change list

### Phase 1 — the smallest set that makes the seven tasks easy (4–5 PRs)

Each item is one PR-sized change, in build order; later items depend on earlier ones.

1. **Shell and tab bar.** `ds/TabBar.jsx` (Find · Saved · Me; 64 px; 14 px labels; `aria-current`;
   pip with sr text), used by `ui/Shell.jsx`. Tokens: body 17, footnote 15, caption 14, display 30;
   `SCALE_VALUES` add 2 and "Largest" = 200 % in settings. `Button` and `Verdict` wrap. Add the
   icons. *Acceptance: every existing screen still renders at 200 % with no clipped pill or
   three-line button; `/ds` shows the new components.*
2. **Find screen.** `screens/Find.jsx` replaces Home + Results (route `find`; `home` and
   `results` redirect); `SearchField voiceInline`; `BrowseGrid`/`TileButton`; one prompt card
   max; "Near you" list; results header with two chips + "More filters" sheet; summary line;
   `PAGE = 10`; `PlaceRow` short name + one reason. Delete `screens/Home.jsx`, `Results.jsx`.
   *Acceptance: ≤ 7 controls before the first place; first place ≤ 420 px from the top; task 2
   in 3 taps.*
3. **Map as a view.** `explore/MapSection.jsx` inside Find; `PilotMap` 48 px pins, 18 px glyphs,
   ≤ 12 pins + clusters, no legend (Key dialog), no SnapSheet, pin → card under the map, "Skip
   the map" link. Delete `screens/Map.jsx` (route `map` = Find with the Map view). *Acceptance:
   no focusable element on the phone map under 48 px; ≤ 14 tab stops inside the map region.*
4. **Place page.** New order; `VerdictCard` (freshness inside); `TodayBlock` with "Report a
   problem today" and the plain-English report types; `KeyFacts`; `EntranceCard`; `ReviewCard`
   with "This helped me" (behind a flag until the contributors PR merges); `Disclosure` + `VenueMore`.
   Route `arrival` → `screens/Arrival.jsx`. *Acceptance: ≤ 1 900 px tall and ≤ 18 tab stops for a
   place with 3 reviews; Report in 3 taps with no scroll at 100 %.*
5. **Review in three steps + set-up.** `review/ReviewSteps`, `YesNoNotSure`, `Stepper`, questions
   for the person's needs only, Send on every step, carer labels, `AllyReview` (behind the same
   flag), "Shown as" line; `Setup.jsx` checkboxes + icons + Skip; `SetupAppear.jsx` as step 2
   (layout only; strings from the contributors branch). Copy pass (§10) across `en/*.ts` with
   `npm run i18n:check`. *Acceptance: task 6 in 3 taps with no scroll at 100 %; a screen reader
   hears "checkbox" on set-up; no hidden gestures remain in the core tasks.*

### Phase 2 — after the pilot's first weeks of feedback

6. Saved: updates card + tab pip (needs the venue-updates API); "Mark all as seen".
7. Me: four lists; Settings as a screen (from the A11y sheet); Language as a screen; "How I appear"
   and badges rows; Help out rows (gaps moves here).
8. Voice in place in the search field; restyle the fallback Voice screen.
9. "Read all reviews" screen with relationship chips (lived · carers · allies); ally observations
   shown as "Observed by allies" (never a verdict).
10. Thanks screen: palette, badges card, one quick-question link.
11. Outing presets as search suggestions ("Coffee with a friend", "A quiet lunch") mapping to
    existing categories + tags.
12. Map clustering polish; "Places on this map" follows the viewport.

### Phase 3 — later

13. Sensory check-ins and "What to expect" as first-class disclosures with photos.
14. Beach access and facilities as ordinary rows in results (layers → filters).
15. Needs card and business/council links under Me → More.
16. Desktop (`WebLayout`) picks up the same Find/Place structure; the SnapSheet can go.

---

## 13. Acceptance criteria, per persona

Test with the Clerk test-user flow in AGENTS.md at 390×844 and 360×800, at 100 % and 200 %, with
reduced motion on, keyboard only, and with the accessibility tree.

| Persona | Must be true after Phase 1 |
|---|---|
| **Older adult, low vision or tremor, low confidence** | Body text ≥ 17 px; every target ≥ 48 px with ≥ 8 px gaps; one big teal button per screen; Back always top-left; no action needs a drag or a long press; the seven core tasks each take ≤ 3 taps from the place page or Find. |
| **Colour-blind** | Every verdict and pin shows a glyph and words; the Key dialog names each; the review's three choices differ by glyph and words; nothing changes meaning by colour only (checked by greyscale screenshots of Find, Results, Place, Review). |
| **Dyslexic** | No sentence over 12 words in the core-task copy; left-aligned text; no all-caps body text (overlines removed from the core path); 1.5 line height; "Say it instead of typing" wherever there is a text box. |
| **Blind (VoiceOver / TalkBack)** | Every screen has one `h1`, focused on arrival; landmarks `search`, `main`, `navigation`; a place row is named "{name}, {kind}, {walk}, {verdict}" (≤ 12 words) with the reason as its description; the map is skippable and has ≤ 12 pin stops; "Step n of 3" is announced; dialogs trap and return focus; no live region fires more than once per action. |
| **Low vision at 200 % text** | No clipped text, no overlapping controls, no horizontal scroll on Find, Results, Place, Review, Set-up (checked in screenshots); the first place on Results within one screen; the bottom bar button is ≤ 2 lines. |
| **Motor: one hand, tremor, switch** | All primary actions in the bottom 60 % of the screen or in the bottom bar; ≥ 48 px targets; nothing requires precision on a map (pins 48 px, clusters 56 px); switch scanning reaches the main action within 10 stops on Place and Review. |
| **Intellectual or cognitive disability, low literacy** | Each screen asks one thing; at most 7 choices visible at once on Find; icons beside every category and need; the same "More …" pattern everywhere; "Not sure" is always an option; no reliance on remembering a previous screen ("Shown as:" repeats on every review step). |
| **Deaf and hard of hearing** | Voice is never the only way; the mic is a secondary control inside the search field; no information is conveyed by sound alone; "Help for people who are deaf or hard of hearing" is an ordinary question, not jargon. |
| **Autistic and sensory-sensitive** | No autoplay, no pulsing hero, no dark full-screen mode switch for voice; reduced motion removes all transitions (incl. disclosure chevrons); "Quiet now" and "Noise, light and crowds" are available but folded, not forced. |
| **Chronic fatigue** | A review can be sent in 3 taps with no scrolling; the place page is ≤ 1 900 px; Report a problem is reachable without scrolling; "Save" and "Directions" are on the first screen of a place. |

Automated checks to add to the testing protocol: axe-core (`wcag2aa`, `wcag22aa`,
`best-practice`) with zero violations on each core screen; a script that lists every focusable
element under 44×44 px (the mockups' check in `docs/ux-redesign/after/` was produced this way) and
the page height of Place and Review.

---

## 14. Risks and open questions

- **Replacing "Places to stay" with "Toilets" on Find** assumes visitors are a small share of the
  pilot. If stays matter for a partner, keep it in More filters and the search ("hotel").
- **Removing the voice hero** reduces the pilot's "voice first" story. The mic is still on every
  screen with a search box; the usage data from `track.js` will show whether voice searches drop.
- **Questions for your needs only** means fewer facts per review for other needs. The quick-answer
  feature and the ally form fill that gap; watch the fact counts per feature after Phase 1.
- **Contributors branch timing**: Set-up step 2, "Shown as", "This helped me" and the ally form
  depend on @thread:thr_7vm97nrz3g's schema and API. Build the UI behind a flag
  (`NEXT_PUBLIC_CONTRIB=1`) so Phase 1 can ship first.
- **Carer "Whose needs?"**: the design assumes a carer's profile holds the needs of the person
  they are with (as the contributors branch does). If that changes, step 2 should ask once.
- **Desktop**: Phase 1 touches phones only (`!app.wide`). `WebLayout` keeps the panel + map; the
  shared screens (Find, Place, Review) must still render in the 420 px panel — check it.

---

## Appendix A — screenshot index

**Before** ([`before/`](before/), the pilot at `309f20d`, 390×844 unless noted):
`setup.jpg` · `home.jpg` · `home-bottom.jpg` · `results.jpg` · `map.jpg` · `map-pin-card.jpg` ·
`venue-1.jpg` … `venue-5-bottom.jpg` · `review-1.jpg` … `review-3.jpg` · `saved-empty.jpg` ·
`me.jpg` · `a11y-sheet.jpg` · `voice.jpg` · `gaps.jpg` · `home-200.jpg` · `results-200.jpg` ·
`map-200.jpg` · `venue-200.jpg` · `review-200.jpg` · `map-360.jpg` (360×800).

**After** ([`after/`](after/), the mockups at 390×844): `setup.jpg` · `setup-2.jpg` · `find.jpg`
· `results.jpg` · `results-map.jpg` · `place.jpg` · `place-report.jpg` · `directions.jpg` ·
`review.jpg` · `review-2.jpg` · `review-3.jpg` · `review-ally.jpg` · `saved.jpg` · `me.jpg` ·
`thanks.jpg` · `find-200.jpg` · `results-200.jpg` · `place-200.jpg` · `review-200.jpg`.

Every "after" screen was checked with axe-core 4 (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`,
`best-practice`): zero violations, and no focusable element under 44 px except the hidden native
inputs behind the styled choice rows (their labels are the 72 px targets).
