"""Build the mapping-day task list for the Manly town centre from a cached OSM extract.

    python3 -I docs/mapping-day/scripts/build_tasks.py [data/osm-centre-<date>.json]

Reads the newest data/osm-centre-*.json (from fetch_osm.py) and writes:

  data/tasks.geojson   every task point (crossings, entrances, slopes, steps) with its zone and number
  data/paths.geojson   footpaths missing surface / smoothness / width (drawn as lines, not numbered)
  data/zones.geojson   the 6 zones: meeting point, walking loop and summary
  data/zones.json      the same, plus the per-point checklists, for the kit and the zone sheets

Nothing here edits OpenStreetMap. Research and planning only.
"""
import collections, glob, itertools, json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')

CENTRE = dict(south=-33.8020, west=151.2805, north=-33.7935, east=151.2905)
PED = {'footway', 'path', 'pedestrian', 'steps', 'corridor', 'living_street', 'cycleway'}
ROADS = {'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street',
         'trunk', 'primary_link', 'secondary_link', 'tertiary_link', 'service'}
OPEN_SPACE = {('leisure', 'park'), ('leisure', 'garden'), ('leisure', 'nature_reserve'), ('natural', 'beach')}
# The corridors the routing spike asked to measure first (docs/research/step-free-routing-spike.md §4).
SLOPE_CORRIDORS = ['The Corso', 'Belgrave Street', 'Sydney Road', 'East Esplanade', 'West Esplanade', 'Darley Road']
SLOPE_SPACING_M = 120
# Ways Valhalla's elevation model rated ≥ 8% on the spike's routes (data/spike/valhalla-steep-ways.json).
STEEP_FILE = os.path.join(DATA, 'spike', 'valhalla-steep-ways.json')

# Candidate meeting points. All are flat public spaces in OSM; every one must be checked
# step-free on the recce walk before the day (the kit says so).
MEETING_POINTS = [
    dict(id='wharf', name='Manly Wharf forecourt', hint='Ferry and bus interchange, by the wharf entrance', lat=-33.79975, lon=151.28460),
    dict(id='library', name='Manly Library, Market Place', hint='Outside the library doors', lat=-33.79773, lon=151.28611),
    dict(id='corso-beach', name='The Corso at South Steyne', hint='Beach end of The Corso, by the pedestrian crossing', lat=-33.79745, lon=151.28790),
    dict(id='short-st', name='Short Street Plaza', hint='Seats and shade, off Belgrave Street', lat=-33.79655, lon=151.28611),
    dict(id='north-steyne', name='North Steyne at Raglan Street', hint='Beachfront promenade', lat=-33.79560, lon=151.28800),
    dict(id='east-esp', name='East Esplanade Park', hint='Harbour side, by Manly Cove', lat=-33.80080, lon=151.28640),
    dict(id='west-esp', name='West Esplanade, by the art gallery', hint='Harbour-front shared path', lat=-33.79860, lon=151.28290),
]
N_ZONES = 6
ZONE_LETTERS = 'ABCDEF'
ZONE_COLOURS = ['#0B6E4F', '#1D4ED8', '#B42318', '#7A3E9D', '#A15C07', '#0E7490']

# Minutes per task, on foot, including writing it down. Based on the spike's rates
# (40–60 kerbs/h, 12–20 entrances/h, about 2 km/h for slope checks), plus the Roam Access
# entrance pin, photo and arrival steps at each venue.
MINUTES = dict(crossing=5, crossing_partial=3, crossing_node=5, entrance=7, entrance_check=5, slope=4, steps=3)
PATH_MIN_PER_100M = 1.0
WALK_KMH = 2.5         # slow, with stops: pairs that include wheelchair users and people who rest often
DETOUR = 1.35          # street network vs straight line
EDIT_OVERHEAD = 0.25   # editing, review, upload (spike: +25%)


def hav(a, b):
    lat1, lon1 = a; lat2, lon2 = b
    p = math.pi / 180
    x = (math.sin((lat2 - lat1) * p / 2) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 2 * 6371000 * math.asin(math.sqrt(x))


def inside(lat, lon, box=CENTRE):
    return box['south'] <= lat <= box['north'] and box['west'] <= lon <= box['east']


def newest_extract():
    files = sorted(f for f in glob.glob(os.path.join(DATA, 'osm-centre-*.json')) if '-after-' not in f)
    if not files:
        sys.exit('No data/osm-centre-*.json — run fetch_osm.py first.')
    return files[-1]


def load(path):
    d = json.load(open(path))
    nodes = {e['id']: e for e in d['elements'] if e['type'] == 'node'}
    ways = {e['id']: e for e in d['elements'] if e['type'] == 'way'}
    return d, nodes, ways


def way_coords(w, nodes):
    return [(nodes[n]['lat'], nodes[n]['lon']) for n in w.get('nodes', []) if n in nodes]


def length(c):
    return sum(hav(c[i], c[i + 1]) for i in range(len(c) - 1))


def midpoint(c):
    """Point halfway along a polyline."""
    L = length(c)
    if L == 0:
        return c[0]
    half, run = L / 2, 0.0
    for i in range(len(c) - 1):
        seg = hav(c[i], c[i + 1])
        if run + seg >= half:
            f = (half - run) / seg if seg else 0
            return (c[i][0] + f * (c[i + 1][0] - c[i][0]), c[i][1] + f * (c[i + 1][1] - c[i][1]))
        run += seg
    return c[-1]


def points_along(c, spacing):
    """Points every `spacing` metres, starting half a spacing in."""
    out, run, target = [], 0.0, spacing / 2
    for i in range(len(c) - 1):
        seg = hav(c[i], c[i + 1])
        while seg and run + seg >= target:
            f = (target - run) / seg
            out.append((c[i][0] + f * (c[i + 1][0] - c[i][0]), c[i][1] + f * (c[i + 1][1] - c[i][1])))
            target += spacing
        run += seg
    return out


def street_near(lat, lon, named_roads, max_m=60):
    best, bd = '', max_m
    for name, cs in named_roads.items():
        for c in cs:
            for p in c[::1]:
                dd = hav((lat, lon), p)
                if dd < bd:
                    best, bd = name, dd
    return best


def osm_url(kind, id_):
    return f'https://www.openstreetmap.org/{kind}/{id_}'


def is_crossing_way(t):
    hw = t.get('highway')
    return t.get('footway') == 'crossing' or t.get('path') == 'crossing' or t.get('cycleway') == 'crossing' or (
        hw in ('footway', 'path', 'cycleway') and 'crossing' in t)


def build_tasks(d, nodes, ways):
    tasks = []
    named_roads = collections.defaultdict(list)
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('name') and (t.get('highway') in ROADS or t.get('highway') in PED):
            named_roads[t['name']].append(way_coords(w, nodes))

    def where(lat, lon):
        s = street_near(lat, lon, named_roads)
        return s or 'unnamed path'

    # 1. Crossings drawn as ways: kerb at both ends (or barrier=kerb nodes along it), tactile paving.
    crossing_way_nodes = set()
    for w in ways.values():
        t = w.get('tags', {})
        if not is_crossing_way(t):
            continue
        c = way_coords(w, nodes)
        if len(c) < 2:
            continue
        crossing_way_nodes.update(w['nodes'])
        lat, lon = midpoint(c)
        if not inside(lat, lon):
            continue
        ns = [nodes[n] for n in w['nodes'] if n in nodes]
        kerb_nodes = [n for n in ns if 'kerb' in n.get('tags', {}) or n.get('tags', {}).get('barrier') == 'kerb']
        with_height = [n for n in kerb_nodes if 'kerb' in n.get('tags', {})]
        tactile_known = 'tactile_paving' in t or any('tactile_paving' in n.get('tags', {}) for n in kerb_nodes)
        both_known = len(with_height) >= 2
        if both_known and tactile_known:
            continue
        kind = 'crossing' if not both_known else 'crossing_partial'
        missing = []
        if not both_known:
            missing.append(f'kerb type at {"both ends" if not with_height else "one end"}')
        if not tactile_known:
            missing.append('tactile paving')
        controlled = t.get('crossing') in ('traffic_signals',) or t.get('crossing:signals') == 'yes'
        tasks.append(dict(kind=kind, osm=osm_url('way', w['id']), lat=lat, lon=lon,
                          where=where(lat, lon), missing=missing,
                          known=[f'kerb={n["tags"]["kerb"]}' for n in with_height],
                          signals=controlled, minutes=MINUTES[kind]))

    # 2. Crossings that are only a node on the road (no crossing way, so no kerb nodes yet).
    road_nodes = set()
    for w in ways.values():
        if w.get('tags', {}).get('highway') in ROADS:
            road_nodes.update(w['nodes'])
    for n in nodes.values():
        t = n.get('tags', {})
        if t.get('highway') != 'crossing' or n['id'] in crossing_way_nodes:
            continue
        if not inside(n['lat'], n['lon']) or n['id'] not in road_nodes:
            continue
        if 'kerb' in t:  # someone already recorded it on the node
            continue
        tasks.append(dict(kind='crossing_node', osm=osm_url('node', n['id']), lat=n['lat'], lon=n['lon'],
                          where=where(n['lat'], n['lon']),
                          missing=['kerb type both sides', 'tactile paving'] if 'tactile_paving' not in t else ['kerb type both sides'],
                          known=[f'crossing={t["crossing"]}'] if 'crossing' in t else [],
                          signals=t.get('crossing') == 'traffic_signals', minutes=MINUTES['crossing_node']))

    # 3. Venues: entrance node on the building, or within 25 m of the venue's point.
    entrances = [n for n in nodes.values() if 'entrance' in n.get('tags', {})]
    venues = []
    for e in d['elements']:
        t = e.get('tags', {})
        if 'name' not in t or not any(k in t for k in ('amenity', 'tourism', 'leisure', 'natural')):
            continue
        if any((k, t.get(k)) in OPEN_SPACE for k in ('leisure', 'natural')):
            continue
        lat = e.get('lat') or e.get('center', {}).get('lat'); lon = e.get('lon') or e.get('center', {}).get('lon')
        if lat is None or not inside(lat, lon):
            continue
        members = set(e.get('nodes', [])) if e['type'] == 'way' else set()
        own = [n for n in entrances if n['id'] in members or hav((lat, lon), (n['lat'], n['lon'])) < 25]
        venues.append(e)
        kind_word = (t.get('amenity') or t.get('tourism') or t.get('leisure') or '').replace('_', ' ')
        if own:
            ent = min(own, key=lambda n: hav((lat, lon), (n['lat'], n['lon'])))
            et = ent['tags']
            missing = [k for k in ('wheelchair', 'door', 'automatic_door', 'width') if k not in et]
            if not missing:
                continue
            tasks.append(dict(kind='entrance_check', osm=osm_url(e['type'], e['id']), entrance=osm_url('node', ent['id']),
                              lat=ent['lat'], lon=ent['lon'], name=t['name'], what=kind_word,
                              where=where(lat, lon), missing=missing,
                              known=[f'entrance={et["entrance"]}'] + [f'{k}={et[k]}' for k in ('wheelchair', 'door', 'automatic_door', 'width') if k in et],
                              minutes=MINUTES['entrance_check']))
        else:
            tasks.append(dict(kind='entrance', osm=osm_url(e['type'], e['id']), lat=lat, lon=lon,
                              name=t['name'], what=kind_word, where=where(lat, lon),
                              missing=['entrance point', 'wheelchair', 'door', 'automatic_door', 'width', 'steps at the door'],
                              known=[f'wheelchair={t["wheelchair"]} (on the venue)'] if 'wheelchair' in t else [],
                              minutes=MINUTES['entrance']))

    # 4. Steps missing ramp / handrail / step_count.
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('highway') != 'steps':
            continue
        c = way_coords(w, nodes)
        if len(c) < 2:
            continue
        lat, lon = midpoint(c)
        if not inside(lat, lon):
            continue
        has_ramp = any(k in t for k in ('ramp', 'ramp:wheelchair', 'ramp:stroller', 'ramp:bicycle'))
        has_rail = any(k == 'handrail' or k.startswith('handrail:') for k in t)
        missing = [m for m, ok in (('step_count', 'step_count' in t), ('handrail', has_rail), ('ramp', has_ramp)) if not ok]
        if 'incline' not in t:
            missing.append('incline=up/down')
        if not [m for m in missing if m != 'incline=up/down']:
            continue
        tasks.append(dict(kind='steps', osm=osm_url('way', w['id']), lat=lat, lon=lon, where=where(lat, lon),
                          missing=missing, known=[f'{k}={t[k]}' for k in ('step_count', 'handrail', 'ramp', 'incline') if k in t],
                          length_m=round(length(c)), minutes=MINUTES['steps']))

    # 5. Slopes: the spike's corridors every ~120 m, plus ways the elevation model rated steep.
    steep = set()
    if os.path.exists(STEEP_FILE):
        steep = {s['way'] for s in json.load(open(STEEP_FILE))['ways']}
    ped_ways = [w for w in ways.values() if w.get('tags', {}).get('highway') in PED and w['tags'].get('highway') != 'steps'
                and not is_crossing_way(w['tags'])]
    inclined = [way_coords(w, nodes) for w in ped_ways if 'incline' in w['tags']]

    def incline_mapped_near(p):
        return any(hav(p, q) < 20 for c in inclined for q in c)

    slope_pts = []
    for name in SLOPE_CORRIDORS:
        for w in ways.values():
            t = w.get('tags', {})
            if t.get('name') != name or t.get('highway') not in ROADS | PED:
                continue
            for p in points_along(way_coords(w, nodes), SLOPE_SPACING_M):
                if inside(*p) and not incline_mapped_near(p) and all(hav(p, q['p']) > SLOPE_SPACING_M * 0.6 for q in slope_pts):
                    slope_pts.append(dict(p=p, where=name, why='main corridor'))
    for w in ped_ways + [w for w in ways.values() if w.get('tags', {}).get('highway') in ROADS]:
        if w['id'] not in steep or 'incline' in w['tags']:
            continue
        c = way_coords(w, nodes)
        p = midpoint(c)
        if inside(*p) and all(hav(p, q['p']) > 50 for q in slope_pts):
            slope_pts.append(dict(p=p, where=w['tags'].get('name') or where(*p), why='steep in the elevation model', way=w['id']))
    for s in slope_pts:
        lat, lon = s['p']
        tasks.append(dict(kind='slope', osm=osm_url('way', s['way']) if 'way' in s else '', lat=lat, lon=lon,
                          where=s['where'], why=s['why'], missing=['incline (both footpaths)', 'cross-slope note'],
                          known=[], minutes=MINUTES['slope']))

    # 6. Paths missing surface / smoothness / width (lines; walked as part of the loops).
    paths = []
    for w in ped_ways:
        t = w['tags']
        c = way_coords(w, nodes)
        if len(c) < 2:
            continue
        L = length(c)
        p = midpoint(c)
        if not inside(*p) or L < 15:
            continue
        missing = [k for k in ('surface', 'smoothness', 'width') if k not in t]
        if not missing:
            continue
        paths.append(dict(osm=osm_url('way', w['id']), lat=p[0], lon=p[1], length_m=round(L),
                          missing=missing, coords=[[q[1], q[0]] for q in c]))
    return tasks, paths, venues


def bisect(items, k, weight):
    """Split points into k compact groups of similar total weight (recursive bisection)."""
    if k == 1:
        return [items]
    lats = [i['lat'] for i in items]; lons = [i['lon'] for i in items]
    span_lat = (max(lats) - min(lats)) * 111000
    span_lon = (max(lons) - min(lons)) * 111000 * math.cos(math.radians(-33.8))
    key = (lambda i: i['lat']) if span_lat >= span_lon else (lambda i: i['lon'])
    items = sorted(items, key=key)
    k1 = k // 2
    total = sum(weight(i) for i in items)
    target, run, cut = total * k1 / k, 0.0, 0
    for idx, i in enumerate(items):
        run += weight(i)
        if run >= target:
            cut = idx + 1
            break
    return bisect(items[:cut], k1, weight) + bisect(items[cut:], k - k1, weight)


def hull(points, pad_m=30):
    """Convex hull (monotone chain), pushed out from its centre by pad_m metres."""
    pts = sorted(set(points))
    if len(pts) < 3:
        return pts
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0:
            up.pop()
        up.append(p)
    h = lo[:-1] + up[:-1]
    cx = sum(p[0] for p in h) / len(h); cy = sum(p[1] for p in h) / len(h)
    out = []
    for x, y in h:  # x = lon, y = lat
        dx = (x - cx) * 92000; dy = (y - cy) * 111000
        dd = math.hypot(dx, dy) or 1
        out.append((x + (dx / dd) * pad_m / 92000, y + (dy / dd) * pad_m / 111000))
    return out + out[:1]


def tour(start, pts):
    """Nearest-neighbour loop from the meeting point and back, improved with 2-opt."""
    order, left, cur = [], list(range(len(pts))), start
    while left:
        j = min(left, key=lambda i: hav(cur, (pts[i]['lat'], pts[i]['lon'])))
        order.append(j); left.remove(j); cur = (pts[j]['lat'], pts[j]['lon'])

    def P(i):
        return (pts[i]['lat'], pts[i]['lon'])

    route = [None] + order + [None]

    def C(i):
        return start if route[i] is None else P(route[i])

    improved = True
    while improved:
        improved = False
        for a in range(0, len(route) - 3):
            for b in range(a + 2, len(route) - 1):
                if hav(C(a), C(a + 1)) + hav(C(b), C(b + 1)) > hav(C(a), C(b)) + hav(C(a + 1), C(b + 1)) + 0.5:
                    route[a + 1:b + 1] = reversed(route[a + 1:b + 1])
                    improved = True
    return [i for i in route if i is not None]


CHECKS = {
    'crossing': ['Kerb, side 1: lowered · flush · raised · height ___ cm', 'Kerb, side 2: lowered · flush · raised · height ___ cm', 'Tactile paving: yes · no · incorrect'],
    'crossing_partial': ['Kerb at the end not yet recorded: lowered · flush · raised · ___ cm', 'Tactile paving: yes · no · incorrect'],
    'crossing_node': ['Kerb, side 1: lowered · flush · raised · height ___ cm', 'Kerb, side 2: lowered · flush · raised · height ___ cm', 'Tactile paving: yes · no', 'Photo of each kerb (no faces or number plates)'],
    'entrance': ['Entrance point, which door: main · side · back', 'Steps at the door: none · ___ steps · ramp', 'Door: hinged · sliding · revolving · no door', 'Automatic door: no · button · motion', 'Door: clear width ___ cm', 'wheelchair: yes · limited · no', 'Roam Access: entrance pin · photo · arrival steps'],
    'entrance_check': ['Mapped entrance point: on the door · needs moving', 'Steps at the door: none · ___ steps · ramp', 'Door: hinged · sliding · revolving · no door', 'Automatic door: no · button · motion', 'Door: clear width ___ cm', 'wheelchair: yes · limited · no', 'Roam Access: entrance pin · photo · arrival steps'],
    'slope': ['Slope, footpath side 1: ___ ° · uphill towards ______', 'Slope, footpath side 2: ___ °', 'Steepest short bit (driveway, ramp): ___ °', 'Footpath: surface ______ · smoothness ______ · narrowest width ___ cm'],
    'steps': ['Steps: count ___', 'Handrail: left · right · both · centre · none', 'Ramp beside or instead: wheelchair · pram · bicycle · none', 'Step-free way round: where ______'],
}
KIND_LABEL = dict(crossing='Crossing', crossing_partial='Crossing (part done)', crossing_node='Crossing (not drawn yet)',
                  entrance='Entrance', entrance_check='Entrance (check)', slope='Slope', steps='Steps')


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else newest_extract()
    d, nodes, ways = load(path)
    tasks, paths, venues = build_tasks(d, nodes, ways)

    # Paths join the nearest task's zone later; give their effort to the nearest task for balancing.
    for p in paths:
        near = min(tasks, key=lambda t: hav((t['lat'], t['lon']), (p['lat'], p['lon'])))
        near['path_minutes'] = near.get('path_minutes', 0) + PATH_MIN_PER_100M * p['length_m'] / 100
    weight = lambda t: t['minutes'] + t.get('path_minutes', 0) + 2.5  # 2.5 ≈ walking between points
    groups = bisect(tasks, N_ZONES, weight)

    # Meeting points: the assignment of candidates to zones with the least total distance.
    cents = [(sum(t['lat'] for t in g) / len(g), sum(t['lon'] for t in g) / len(g)) for g in groups]
    # Two zones may share a meeting point (pairs set off together), never three.
    best, best_cost = None, 1e18
    for perm in itertools.product(range(len(MEETING_POINTS)), repeat=len(groups)):
        if max(collections.Counter(perm).values()) > 2:
            continue
        cost = sum(hav(cents[z], (MEETING_POINTS[m]['lat'], MEETING_POINTS[m]['lon'])) for z, m in enumerate(perm))
        if cost < best_cost:
            best, best_cost = perm, cost
    # Name zones west → east so A is the wharf side.
    zone_order = sorted(range(len(groups)), key=lambda z: (round(cents[z][1], 3), -cents[z][0]))

    zones, feats, path_feats = [], [], []
    for zi, z in enumerate(zone_order):
        letter, colour = ZONE_LETTERS[zi], ZONE_COLOURS[zi]
        mp = MEETING_POINTS[best[z]]
        g = groups[z]
        order = tour((mp['lat'], mp['lon']), g)
        pts = [g[i] for i in order]
        loop = [(mp['lat'], mp['lon'])] + [(p['lat'], p['lon']) for p in pts] + [(mp['lat'], mp['lon'])]
        loop_m = length(loop) * DETOUR
        for n, p in enumerate(pts, 1):
            p['zone'] = letter; p['n'] = n; p['label'] = f'{letter}{n}'
            p['checks'] = CHECKS[p['kind']]
        zone_paths = [p for p in paths if min(range(len(groups)), key=lambda q: min(hav((t['lat'], t['lon']), (p['lat'], p['lon'])) for t in groups[q])) == z]
        for p in zone_paths:
            p['zone'] = letter
        path_m = sum(p['length_m'] for p in zone_paths)
        task_min = sum(p['minutes'] for p in pts) + PATH_MIN_PER_100M * path_m / 100
        walk_min = loop_m / 1000 / WALK_KMH * 60
        total_min = (task_min + walk_min) * (1 + EDIT_OVERHEAD)
        counts = collections.Counter(p['kind'] for p in pts)
        zones.append(dict(
            zone=letter, colour=colour, meeting_point=mp,
            points=[{k: v for k, v in p.items() if k not in ('path_minutes',)} for p in pts],
            paths=[{k: v for k, v in p.items() if k != 'coords'} for p in zone_paths],
            counts=dict(counts), path_m=path_m, loop_km=round(loop_m / 1000, 2),
            task_minutes=round(task_min), walk_minutes=round(walk_min), person_hours=round(total_min / 60, 1),
            streets=[s for s, _ in collections.Counter(p['where'] for p in pts if p['where'] != 'unnamed path').most_common(5)],
            bbox=[min(q[1] for q in loop), min(q[0] for q in loop), max(q[1] for q in loop), max(q[0] for q in loop)],
        ))
        for p in pts:
            feats.append(dict(type='Feature', geometry=dict(type='Point', coordinates=[round(p['lon'], 7), round(p['lat'], 7)]),
                              properties=dict(label=p['label'], zone=letter, n=p['n'], kind=p['kind'], kind_label=KIND_LABEL[p['kind']],
                                              where=p['where'], name=p.get('name', ''), missing='; '.join(p['missing']), osm=p['osm'])))
        feats.append(dict(type='Feature', geometry=dict(type='LineString', coordinates=[[round(q[1], 7), round(q[0], 7)] for q in loop]),
                          properties=dict(kind='loop', zone=letter, colour=colour)))
        feats.append(dict(type='Feature', geometry=dict(type='Polygon', coordinates=[[[round(x, 7), round(y, 7)] for x, y in hull([(q[1], q[0]) for q in loop])]]),
                          properties=dict(kind='zone', zone=letter, colour=colour)))
        feats.append(dict(type='Feature', geometry=dict(type='Point', coordinates=[mp['lon'], mp['lat']]),
                          properties=dict(kind='meeting_point', zone=letter, name=mp['name'], hint=mp['hint'])))
        for p in zone_paths:
            path_feats.append(dict(type='Feature', geometry=dict(type='LineString', coordinates=p['coords']),
                                   properties=dict(zone=letter, missing=','.join(p['missing']), length_m=p['length_m'], osm=p['osm'])))

    meta = dict(source=os.path.basename(path), osm_base=d['osm3s']['timestamp_osm_base'], centre=CENTRE,
                minutes_per_task=MINUTES, path_minutes_per_100m=PATH_MIN_PER_100M, walk_kmh=WALK_KMH, detour=DETOUR,
                edit_overhead=EDIT_OVERHEAD, venues_in_centre=len(venues),
                totals=dict(points=sum(len(z['points']) for z in zones), person_hours=round(sum(z['person_hours'] for z in zones), 1),
                            **collections.Counter(p['kind'] for z in zones for p in z['points']),
                            path_km=round(sum(z['path_m'] for z in zones) / 1000, 1)))
    json.dump(dict(meta=meta, zones=zones), open(os.path.join(DATA, 'zones.json'), 'w'), indent=1)
    json.dump(dict(type='FeatureCollection', features=[f for f in feats if f['properties']['kind'] not in ('loop', 'meeting_point', 'zone')]),
              open(os.path.join(DATA, 'tasks.geojson'), 'w'))
    json.dump(dict(type='FeatureCollection', features=[f for f in feats if f['properties']['kind'] in ('loop', 'meeting_point', 'zone')]),
              open(os.path.join(DATA, 'zones.geojson'), 'w'))
    json.dump(dict(type='FeatureCollection', features=path_feats), open(os.path.join(DATA, 'paths.geojson'), 'w'))

    print(json.dumps(meta['totals']))
    for z in zones:
        print(z['zone'], z['meeting_point']['name'], len(z['points']), z['counts'], f"paths {z['path_m']} m",
              f"loop {z['loop_km']} km", f"{z['person_hours']} person-h", z['streets'][:3])


if __name__ == '__main__':
    main()
