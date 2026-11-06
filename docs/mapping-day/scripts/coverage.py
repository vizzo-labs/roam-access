"""Before/after OSM coverage for the Manly town centre, with the mapping day's "done" targets.

Extends the routing spike's coverage.py (draft PR #18,
docs/research/step-free-routing/scripts/coverage.py): same definitions for crossings,
kerbs, steps and path tags, restricted to the town-centre box, plus entrance detail and targets.

    # before the day (the extract the task list was built from)
    python3 -I docs/mapping-day/scripts/coverage.py data/osm-centre-2026-11-06.json

    # after the day: fetch again, then compare
    python3 -I docs/mapping-day/scripts/fetch_osm.py --label after
    python3 -I docs/mapping-day/scripts/coverage.py data/osm-centre-2026-11-06.json data/osm-centre-after-<date>.json

Writes data/coverage-<label>.json for each file and prints a table. Read-only: it never
edits OpenStreetMap. Changes reach Roam Access routing only after the routing engine's
next data refresh (see the kit, "Measure").
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_tasks import (CENTRE, PED, SLOPE_CORRIDORS, OPEN_SPACE, hav, inside, load, way_coords,  # noqa: E402
                         length, midpoint, is_crossing_way, points_along, ROADS)

# "Done" for the town centre. Kerbs and entrances are what routing needs most.
TARGETS = [
    ('crossings_kerb_both_pct', 90, 'Crossing ways with a kerb type at both ends'),
    ('crossings_tactile_pct', 90, 'Crossing ways with tactile paving recorded'),
    ('crossing_nodes_unresolved', 0, 'Road crossings with no crossing way and no kerb info (count, lower is better)'),
    ('venues_entrance_pct', 80, 'Venues with an entrance point'),
    ('venues_entrance_wheelchair_pct', 70, 'Venues whose entrance says wheelchair=yes/limited/no'),
    ('corridor_incline_pct', 100, 'Slope check points on the main corridors with incline mapped nearby'),
    ('steps_complete_pct', 100, 'Flights of steps with step_count, handrail and ramp'),
    ('surface_pct', 95, 'Footpaths (by length) with surface'),
    ('smoothness_pct', 60, 'Footpaths (by length) with smoothness'),
    ('width_pct', 40, 'Footpaths (by length) with width'),
]
LOWER_IS_BETTER = {'crossing_nodes_unresolved'}


def measure(path):
    d, nodes, ways = load(path)
    pct = lambda x, y: round(100 * x / y, 1) if y else None
    out = dict(file=os.path.basename(path), osm_base=d['osm3s']['timestamp_osm_base'])

    # Footpath tags, by length. Unlike the spike's table, crossings and steps are left out
    # here so the path targets are about footpaths only.
    L = dict(all=0.0, surface=0.0, smoothness=0.0, width=0.0, incline=0.0)
    inclined = []
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('highway') not in PED or t.get('highway') == 'steps' or is_crossing_way(t):
            continue
        if t.get('highway') == 'cycleway' and t.get('foot') == 'no':
            continue
        c = way_coords(w, nodes)
        if len(c) < 2 or not inside(*midpoint(c)):
            continue
        n = length(c)
        L['all'] += n
        for k in ('surface', 'smoothness', 'width', 'incline'):
            if k in t:
                L[k] += n
        if 'incline' in t:
            inclined.append(c)
    out.update(footpath_km=round(L['all'] / 1000, 1), surface_pct=pct(L['surface'], L['all']),
               smoothness_pct=pct(L['smoothness'], L['all']), width_pct=pct(L['width'], L['all']),
               incline_pct=pct(L['incline'], L['all']))

    # Crossings.
    cw = both = tactile = 0
    on_crossing_ways = set()
    for w in ways.values():
        t = w.get('tags', {})
        if not is_crossing_way(t):
            continue
        on_crossing_ways.update(w['nodes'])
        c = way_coords(w, nodes)
        if len(c) < 2 or not inside(*midpoint(c)):
            continue
        cw += 1
        ns = [nodes[n] for n in w['nodes'] if n in nodes]
        kn = [n for n in ns if 'kerb' in n.get('tags', {})]
        if len(kn) >= 2:
            both += 1
        if 'tactile_paving' in t or any('tactile_paving' in n.get('tags', {}) for n in ns if 'kerb' in n.get('tags', {}) or n.get('tags', {}).get('barrier') == 'kerb'):
            tactile += 1
    road_nodes = set()
    for w in ways.values():
        if w.get('tags', {}).get('highway') in ROADS:
            road_nodes.update(w['nodes'])
    unresolved = sum(1 for n in nodes.values() if n.get('tags', {}).get('highway') == 'crossing' and n['id'] not in on_crossing_ways
                     and n['id'] in road_nodes and 'kerb' not in n['tags'] and inside(n['lat'], n['lon']))
    kerbs = {}
    for n in nodes.values():
        t = n.get('tags', {})
        if ('kerb' in t or t.get('barrier') == 'kerb') and inside(n['lat'], n['lon']):
            kerbs[t.get('kerb', 'unknown')] = kerbs.get(t.get('kerb', 'unknown'), 0) + 1
    out.update(crossing_ways=cw, crossings_kerb_both_pct=pct(both, cw), crossings_tactile_pct=pct(tactile, cw),
               crossing_nodes_unresolved=unresolved, kerb_nodes=kerbs)

    # Steps.
    st = complete = 0
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('highway') != 'steps':
            continue
        c = way_coords(w, nodes)
        if len(c) < 2 or not inside(*midpoint(c)):
            continue
        st += 1
        if 'step_count' in t and any(k == 'handrail' or k.startswith('handrail:') for k in t) and any(k.startswith('ramp') for k in t):
            complete += 1
    out.update(steps=st, steps_complete_pct=pct(complete, st))

    # Venues and entrances.
    ents = [n for n in nodes.values() if 'entrance' in n.get('tags', {})]
    v = with_ent = with_wc = 0
    for e in d['elements']:
        t = e.get('tags', {})
        if 'name' not in t or not any(k in t for k in ('amenity', 'tourism', 'leisure', 'natural')):
            continue
        if any((k, t.get(k)) in OPEN_SPACE for k in ('leisure', 'natural')):
            continue
        lat = e.get('lat') or e.get('center', {}).get('lat'); lon = e.get('lon') or e.get('center', {}).get('lon')
        if lat is None or not inside(lat, lon):
            continue
        v += 1
        members = set(e.get('nodes', [])) if e['type'] == 'way' else set()
        own = [n for n in ents if n['id'] in members or hav((lat, lon), (n['lat'], n['lon'])) < 25]
        if own:
            with_ent += 1
            if any(n['tags'].get('wheelchair') in ('yes', 'limited', 'no', 'designated') for n in own):
                with_wc += 1
    out.update(venues=v, venues_entrance_pct=pct(with_ent, v), venues_entrance_wheelchair_pct=pct(with_wc, v),
               entrance_nodes=sum(1 for n in ents if inside(n['lat'], n['lon'])))

    # Corridor slope checkpoints: is there an incline-tagged footpath within 20 m?
    pts = []
    for name in SLOPE_CORRIDORS:
        for w in ways.values():
            t = w.get('tags', {})
            if t.get('name') == name and (t.get('highway') in ROADS or t.get('highway') in PED):
                pts += [p for p in points_along(way_coords(w, nodes), 120) if inside(*p)]
    hit = sum(1 for p in pts if any(hav(p, q) < 20 for c in inclined for q in c))
    out.update(corridor_points=len(pts), corridor_incline_pct=pct(hit, len(pts)))
    return out


def status(key, value, target):
    if value is None:
        return '—'
    ok = value <= target if key in LOWER_IS_BETTER else value >= target
    return 'met' if ok else 'not yet'


def main():
    files = sys.argv[1:]
    if not files:
        sys.exit(__doc__)
    results = []
    for f in files:
        r = measure(f)
        label = 'after' if '-after-' in os.path.basename(f) else 'before'
        json.dump(r, open(os.path.join(HERE, '..', 'data', f'coverage-{label}.json'), 'w'), indent=1)
        results.append(r)
    head = ['Measure', 'Target'] + [f"{r['file']} ({r['osm_base'][:10]})" for r in results] + ['Status']
    rows = []
    for key, target, words in TARGETS:
        vals = [r.get(key) for r in results]
        rows.append([words, ('≤ ' if key in LOWER_IS_BETTER else '≥ ') + str(target) + ('' if key in LOWER_IS_BETTER else '%')]
                    + [('—' if x is None else str(x)) for x in vals] + [status(key, vals[-1], target)])
    widths = [max(len(str(r[i])) for r in [head] + rows) for i in range(len(head))]
    for r in [head] + rows:
        print(' | '.join(str(c).ljust(widths[i]) for i, c in enumerate(r)))
    print()
    for r in results:
        print(r['file'], json.dumps({k: r[k] for k in ('footpath_km', 'crossing_ways', 'steps', 'venues', 'entrance_nodes', 'kerb_nodes', 'incline_pct')}))


if __name__ == '__main__':
    main()
