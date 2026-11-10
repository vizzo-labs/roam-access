# Map declutter: scale to all of Sydney (no clustering)

Romy on the desktop map: "Too crowded. Imagine if all of Sydney were filled in."

## What changed

- **The map mirrors the list.** Desktop now shows only the pins of the list in the
  panel (Near you: 5; results: the rows on screen, 10 more with each "Show more"), like
  the phone map already did. A place page keeps the list it came from, plus the place.
- **"Search this area".** After a pan or zoom by the person (mouse, touch, keys), a
  button at the top of the map reloads the list, and so the pins, for what the map
  shows. The list says "In the map area" (a chip that removes the limit), the
  heading takes focus, and the count is announced ("145 places in this map area.").
  A new search looks everywhere again.
- **Priority declutter, not grouping.** Where two pins would overlap, only the
  higher-ranked one shows (list order: works for you first, then distance; the
  selected, hovered and focused pins always win). The others appear as you zoom in.
  It's worked out in screen space, so it only changes with zoom and stays put while
  panning. From zoom 17 (phones: 15) overlapping pins are nudged apart instead, so two
  places in one building stay reachable.
- **Simpler pins zoomed out.** Below zoom 15: a small marker with the category icon
  in a verdict **shape** (circle = works, diamond = check first, octagon = barriers),
  with no badge. The full pin with its badge shows at street zoom, on hover and when
  selected. The Key shows both.
- **"No info yet" places** are hidden from the map until zoom 16, then shown as quiet
  grey dots (still ≥ 44 px targets). They stay in the list. "No info yet (grey dots)"
  in Map layers (desktop) or the Key's checkbox (phones) shows them at every zoom.
- **Toilets, beach and parking pins** follow the same rules, ranked after the places.
- **Only visible pins are focusable**, in list order: pins outside the view or hidden
  by the declutter are `display: none`.

## Stress test (`?mapStress=1`, dev and Preview builds only)

3,000 synthetic places (8 % works, 6 % barriers, 31 % check first, the rest no info)
around 36 Sydney suburb centres, plus 400 synthetic toilets. They're made in the
browser and never sent to the server or stored.

Desktop 1440×900, results list grown to 60 rows, toilets layer on (541 markers):

| Zoom | Markers | Shown (and focusable) |
|---|---|---|
| City (10.5) | 541 | 95 |
| Suburb (13) | 541 | 40 |
| Street (16.2) | 541 | 10 |

Frame times while dragging the map (headless Chrome, 60 drag steps): median 16.7 ms,
p95 16.8 ms, worst 16.8 ms, no frame over 50 ms, at both city and suburb zoom. Before
this change, the same mode drew all 3,232 places as DOM pins.

Keyboard at suburb zoom: Tab went through exactly the 40 visible pins, in list
order, each at least 44×44 px; none of the 501 hidden pins took focus.

## Screenshots

`before-*` are `main`'s map code with the same stress data injected. `after-*` are this
branch. Desktop 1440×900, phone 390×844.
