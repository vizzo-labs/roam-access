"""OSM step-free data coverage for the Roam Access pilot area.

Reads the cached Overpass extracts in ../data and prints coverage figures for the
Manly town centre vs the rest of the pilot bbox; writes ../data/coverage.json and
../data/coverage.geojson (for the prototype map).

    python3 -I docs/research/step-free-routing/scripts/coverage.py

Research spike only: not part of the app.
"""
import json, math, os, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')
PED_FILE = os.path.join(DATA, 'osm-pedestrian-2026-11-06.json')
VENUE_FILE = os.path.join(DATA, 'osm-venues-2026-11-06.json')

# Pilot bbox (apps/app/scripts/seed-osm.ts)
BBOX = dict(south=-33.8150, west=151.2580, north=-33.7800, east=151.3020)
# "Town centre": Manly Wharf, The Corso, Manly Beach front, Belgrave/Sydney Rd
# shops and the Wentworth St/Darley Rd blocks. ~1.0 km x 0.95 km.
CENTRE = dict(south=-33.8020, west=151.2805, north=-33.7935, east=151.2905)

PED = {'footway', 'path', 'pedestrian', 'steps', 'corridor', 'living_street', 'cycleway'}
ROADS = {'primary', 'secondary', 'tertiary', 'residential', 'unclassified',
         'living_street', 'trunk', 'primary_link', 'secondary_link', 'tertiary_link'}


def hav(a, b):
    lat1, lon1 = a; lat2, lon2 = b
    p = math.pi / 180
    x = (math.sin((lat2 - lat1) * p / 2) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 2 * 6371000 * math.asin(math.sqrt(x))


def inside(box, lat, lon):
    return box['south'] <= lat <= box['north'] and box['west'] <= lon <= box['east']


def main():
    d = json.load(open(PED_FILE))
    nodes = {e['id']: e for e in d['elements'] if e['type'] == 'node'}
    ways = [e for e in d['elements'] if e['type'] == 'way']

    def coords(w):
        return [(nodes[n]['lat'], nodes[n]['lon']) for n in w['nodes'] if n in nodes]

    def zone_of_way(w):
        c = coords(w)
        if not c:
            return None
        lat = sum(p[0] for p in c) / len(c); lon = sum(p[1] for p in c) / len(c)
        if not inside(BBOX, lat, lon):
            return None
        return 'centre' if inside(CENTRE, lat, lon) else 'rest'

    def zone_of_node(n):
        if not inside(BBOX, n['lat'], n['lon']):
            return None
        return 'centre' if inside(CENTRE, n['lat'], n['lon']) else 'rest'

    def length(w):
        c = coords(w)
        return sum(hav(c[i], c[i + 1]) for i in range(len(c) - 1))

    Z = ('centre', 'rest')
    acc = {z: collections.defaultdict(float) for z in Z}
    cnt = {z: collections.Counter() for z in Z}
    features = []

    for w in ways:
        t = w.get('tags', {}); hw = t.get('highway'); z = zone_of_way(w)
        if z is None:
            continue
        L = length(w)
        if hw in PED and not (hw == 'cycleway' and t.get('foot') == 'no'):
            a = acc[z]
            a['ped_m'] += L
            if t.get('footway') == 'sidewalk': a['sidewalk_m'] += L
            if 'surface' in t: a['surface_m'] += L
            if 'smoothness' in t: a['smoothness_m'] += L
            if 'incline' in t: a['incline_m'] += L
            if 'width' in t: a['width_m'] += L
            if 'wheelchair' in t: a['wheelchair_m'] += L
            if 'lit' in t: a['lit_m'] += L
        if hw == 'steps':
            c = cnt[z]; c['steps'] += 1; acc[z]['steps_m'] += L
            for k in ('incline', 'handrail', 'step_count', 'ramp', 'ramp:wheelchair', 'wheelchair'):
                if k in t: c['steps_' + k] += 1
            if t.get('ramp:wheelchair') == 'yes' or t.get('ramp') == 'yes': c['steps_ramp_yes'] += 1
            features.append(dict(type='Feature', properties=dict(kind='steps', id=w['id']),
                                 geometry=dict(type='LineString', coordinates=[[p[1], p[0]] for p in coords(w)])))
        if hw in PED and 'incline' in t and hw != 'steps':
            features.append(dict(type='Feature', properties=dict(kind='incline', incline=t['incline'], id=w['id']),
                                 geometry=dict(type='LineString', coordinates=[[p[1], p[0]] for p in coords(w)])))
        if hw in ROADS:
            a = acc[z]; a['road_m'] += L
            if any(k.startswith('sidewalk') for k in t): a['road_sidewalk_tag_m'] += L
        if t.get('footway') == 'crossing' or (hw in ('footway', 'path', 'cycleway') and t.get('crossing')):
            c = cnt[z]; c['crossing_ways'] += 1
            kerbs = [nodes[n] for n in w['nodes'] if n in nodes and
                     ('kerb' in nodes[n].get('tags', {}) or nodes[n].get('tags', {}).get('barrier') == 'kerb')]
            vals = [k['tags'].get('kerb', 'height?') for k in kerbs]
            if len([k for k in kerbs if 'kerb' in k['tags']]) >= 2: c['crossing_kerb_height_both'] += 1
            if len(kerbs) >= 2: c['crossing_kerb_both'] += 1
            elif len(kerbs) == 1: c['crossing_kerb_one'] += 1
            else: c['crossing_kerb_none'] += 1
            if 'tactile_paving' in t or any('tactile_paving' in k['tags'] for k in kerbs): c['crossing_tactile'] += 1
            if 'crossing' in t or 'crossing:markings' in t or 'crossing:signals' in t: c['crossing_type'] += 1
            if 'kerb' in t: c['crossing_way_kerb_tag'] += 1
            features.append(dict(type='Feature', properties=dict(
                kind='crossing', kerbs=len(kerbs), kerb=','.join(vals) or 'unknown', id=w['id']),
                geometry=dict(type='LineString', coordinates=[[p[1], p[0]] for p in coords(w)])))

    for n in nodes.values():
        t = n.get('tags')
        if not t:
            continue
        z = zone_of_node(n)
        if z is None:
            continue
        c = cnt[z]
        if t.get('highway') == 'crossing':
            c['crossing_nodes'] += 1
            if 'tactile_paving' in t: c['crossing_nodes_tactile'] += 1
            if 'kerb' in t: c['crossing_nodes_kerb'] += 1
        if 'kerb' in t or t.get('barrier') == 'kerb':
            t = dict(t); t.setdefault('kerb', 'height?')
            c['kerb_' + t['kerb']] += 1; c['kerb_nodes'] += 1
            if 'tactile_paving' in t: c['kerb_tactile'] += 1
            features.append(dict(type='Feature', properties=dict(kind='kerb', kerb=t['kerb'], id=n['id']),
                                 geometry=dict(type='Point', coordinates=[n['lon'], n['lat']])))
        if 'tactile_paving' in t: c['tactile_nodes'] += 1
        if 'entrance' in t:
            c['entrances'] += 1
            if 'wheelchair' in t: c['entrances_wheelchair'] += 1
            features.append(dict(type='Feature', properties=dict(kind='entrance', entrance=t['entrance'],
                                 wheelchair=t.get('wheelchair', 'unknown'), id=n['id']),
                                 geometry=dict(type='Point', coordinates=[n['lon'], n['lat']])))
        if t.get('barrier') in ('kerb', 'bollard', 'gate', 'cycle_barrier', 'step', 'block', 'stile', 'turnstile'):
            c['barrier_' + t['barrier']] += 1

    # Venues: does an entrance node sit within 20 m of the venue's centre?
    ents = [n for n in nodes.values() if 'entrance' in n.get('tags', {})]
    v = json.load(open(VENUE_FILE))['elements']
    for e in v:
        lat = e.get('lat') or e.get('center', {}).get('lat'); lon = e.get('lon') or e.get('center', {}).get('lon')
        if lat is None:
            continue
        z = 'centre' if inside(CENTRE, lat, lon) else 'rest'
        tags = e.get('tags', {})
        if tags.get('leisure') in ('park', 'nature_reserve') or tags.get('natural') == 'beach':
            cnt[z]['venues_open_space'] += 1
            continue
        cnt[z]['venues_buildings'] += 1
        if 'wheelchair' in tags: cnt[z]['venues_wheelchair_tag'] += 1
        if any(hav((lat, lon), (n['lat'], n['lon'])) < 20 for n in ents): cnt[z]['venues_entrance_20m'] += 1

    out = {}
    for z in Z:
        a, c = acc[z], cnt[z]
        pct = lambda x, y: round(100 * x / y, 1) if y else None
        cw = c['crossing_ways']
        out[z] = dict(
            pedestrian_network_km=round(a['ped_m'] / 1000, 1),
            separate_sidewalk_km=round(a['sidewalk_m'] / 1000, 1),
            road_km=round(a['road_m'] / 1000, 1),
            roads_with_sidewalk_tag_pct=pct(a['road_sidewalk_tag_m'], a['road_m']),
            surface_pct=pct(a['surface_m'], a['ped_m']),
            smoothness_pct=pct(a['smoothness_m'], a['ped_m']),
            incline_pct=pct(a['incline_m'], a['ped_m']),
            width_pct=pct(a['width_m'], a['ped_m']),
            wheelchair_tag_pct=pct(a['wheelchair_m'], a['ped_m']),
            steps=c['steps'], steps_m=round(a['steps_m']),
            steps_with_ramp_info=c['steps_ramp'] + c['steps_ramp:wheelchair'],
            steps_with_handrail=c['steps_handrail'], steps_with_step_count=c['steps_step_count'],
            steps_with_incline=c['steps_incline'],
            crossing_ways=cw, crossing_nodes=c['crossing_nodes'],
            crossing_ways_kerbs_both_pct=pct(c['crossing_kerb_both'], cw),
            crossing_ways_kerb_height_both_pct=pct(c['crossing_kerb_height_both'], cw),
            crossing_ways_kerbs_one_pct=pct(c['crossing_kerb_one'], cw),
            crossing_ways_kerbs_none_pct=pct(c['crossing_kerb_none'], cw),
            crossing_ways_tactile_pct=pct(c['crossing_tactile'], cw),
            crossing_nodes_tactile_pct=pct(c['crossing_nodes_tactile'], c['crossing_nodes']),
            kerb_nodes=c['kerb_nodes'],
            kerbs={k[5:]: v for k, v in c.items() if k.startswith('kerb_') and k not in ('kerb_nodes', 'kerb_tactile')},
            tactile_nodes=c['tactile_nodes'],
            entrances=c['entrances'], entrances_with_wheelchair=c['entrances_wheelchair'],
            venues_buildings=c['venues_buildings'], venues_open_space=c['venues_open_space'],
            venues_with_wheelchair_tag=c['venues_wheelchair_tag'],
            venues_with_entrance_within_20m=c['venues_entrance_20m'],
            barriers={k[8:]: v for k, v in c.items() if k.startswith('barrier_')},
        )
    out['_meta'] = dict(osm_base=d['osm3s']['timestamp_osm_base'], bbox=BBOX, centre=CENTRE,
                        pedestrian_highways=sorted(PED))
    json.dump(out, open(os.path.join(DATA, 'coverage.json'), 'w'), indent=2)
    json.dump(dict(type='FeatureCollection', features=features),
              open(os.path.join(DATA, 'coverage.geojson'), 'w'))
    json.dump(out, sys.stdout, indent=2)


if __name__ == '__main__':
    main()
