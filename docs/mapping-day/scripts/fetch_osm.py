"""Fetch a fresh OpenStreetMap extract of the Manly town centre for the mapping day.

    python3 -I docs/mapping-day/scripts/fetch_osm.py            # writes data/osm-centre-<date>.json
    python3 -I docs/mapping-day/scripts/fetch_osm.py --label after   # after the day: data/osm-centre-after-<date>.json

Read-only: it only queries the Overpass API. It never edits OpenStreetMap.
"""
import datetime, json, os, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')
# Town centre (same box as the routing spike), padded ~60 m so crossings on the edge are whole.
S, W, N, E = -33.8020, 151.2805, -33.7935, 151.2905
PAD = 0.0006
B = f'{S - PAD},{W - PAD},{N + PAD},{E + PAD}'
VENUE_RULES = [
    ('amenity', 'cafe|restaurant|bar|pub|fast_food|ice_cream|biergarten|food_court|theatre|cinema|nightclub|music_venue|arts_centre|library'),
    ('tourism', 'museum|gallery|aquarium|hotel|motel|hostel|guest_house'),
    ('leisure', 'park|garden|nature_reserve|swimming_pool'),
    ('natural', 'beach'),
]
QUERY = f"""[out:json][timeout:120];
(
  way["highway"]({B});
  node["kerb"]({B}); node["barrier"]({B}); node["entrance"]({B}); node["door"]({B});
  node["highway"="crossing"]({B}); node["tactile_paving"]({B}); node["railway"="crossing"]({B});
)->.ped;
(.ped; >;)->.pedall;
({''.join(f'nwr["{k}"~"^({v})$"]["name"]({B});' for k, v in VENUE_RULES)})->.venues;
.venues out center tags;
way.venues->.vw; node(w.vw)->.vwn;
node.vwn["entrance"]->.vwe;
.pedall out body;
.vwe out body;
"""
MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
UA = 'RoamAccess-mapping-day-kit/1.0 (accessibility mapping research; https://roamaccess.com.au)'


def main():
    label = ''
    if '--label' in sys.argv:
        label = sys.argv[sys.argv.index('--label') + 1] + '-'
    body = urllib.parse.urlencode({'data': QUERY}).encode()
    last = None
    for url in MIRRORS:
        try:
            req = urllib.request.Request(url, data=body, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.loads(r.read())
            break
        except Exception as e:  # try the next mirror
            last = e
            print(f'{url}: {e}', file=sys.stderr)
    else:
        sys.exit(f'All Overpass mirrors failed: {last}')
    d['_fetched_from'] = url
    day = datetime.date.today().isoformat()
    out = os.path.join(DATA, f'osm-centre-{label}{day}.json')
    json.dump(d, open(out, 'w'), separators=(',', ':'))
    n = collections_count(d)
    print(f'{out}: {n} elements, OSM base {d["osm3s"]["timestamp_osm_base"]} via {url}')


def collections_count(d):
    return len(d.get('elements', []))


if __name__ == '__main__':
    main()
