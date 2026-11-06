"""Build the self-contained kit and the printable zone sheets from the template and the data.

    python3 -I docs/mapping-day/scripts/build_kit.py

Reads kit.src.html, data/zones.json, data/coverage-before.json and maps/*.jpg; writes
kit.html (everything, maps embedded) and zone-sheets.html (just the six A4 zone sheets,
for printing). Run build_tasks.py, render_maps.sh and coverage.py first.
"""
import base64, datetime, html, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
E = html.escape

KIND = {
    'crossing': ('circle', 'Crossing', 'Kerbs at both ends and tactile paving'),
    'crossing_partial': ('circle', 'Crossing, part done', 'The kerb or tactile paving still missing'),
    'crossing_node': ('circle', 'Crossing, not drawn yet', 'Kerbs both sides; the data lead draws it later'),
    'entrance': ('square', 'Entrance', 'Door, steps, width; Roam Access pin and steps'),
    'entrance_check': ('square', 'Entrance, check', 'Add what the mapped door is missing'),
    'steps': ('diamond', 'Steps', 'Count, handrails, ramp'),
    'slope': ('triangle', 'Slope', 'Slope along both footpaths'),
}
SHAPE_SVG = {
    'circle': '<circle cx="12" cy="12" r="10" fill="#B42318" stroke="#fff" stroke-width="2"/>',
    'square': '<rect x="2" y="2" width="20" height="20" rx="3" fill="#1D4ED8" stroke="#fff" stroke-width="2"/>',
    'diamond': '<polygon points="12,1 23,12 12,23 1,12" fill="#6B21A8"/>',
    'triangle': '<polygon points="12,1 23,22 1,22" fill="#8A4B00"/>',
}


def shape(kind, n=''):
    s = KIND[kind][0]
    y = 16 if s == 'triangle' else 15.5
    txt = f'<text x="12" y="{y}" text-anchor="middle" font-size="{9 if len(str(n)) > 1 else 11}" font-weight="800" fill="#fff" font-family="Arial, sans-serif">{n}</text>' if n != '' else ''
    return f'<svg class="shape" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">{SHAPE_SVG[s]}{txt}</svg>'


def img(name):
    p = os.path.join(ROOT, 'maps', name)
    return 'data:image/jpeg;base64,' + base64.b64encode(open(p, 'rb').read()).decode()


def terrain(z):
    c = z['counts']
    hills = c.get('steps', 0) + c.get('slope', 0)
    if hills >= 10:
        return 'Hilly, with steps', 'Best for walkers who are happy on hills. Skip any point you can’t reach.'
    if hills >= 5:
        return 'Some slopes', 'Mostly flat streets with a few slopes and steps to check.'
    return 'Flat', 'Good for wheelchair and scooter users and anyone who wants a flat, short loop.'


def box(label):
    return f'<span class="opt"><span class="tick" aria-hidden="true"></span>{E(label)}</span>'


def opt(label):
    """A tick box for a choice; a write-in blank (“___”) gets no box."""
    label = label.strip()
    if '___' in label:
        return f'<span class="opt blank">{E(label)}</span>'
    return box(label)


def checks_html(p):
    out = []
    for line in p['checks']:
        if ':' in line:
            head, opts = line.split(':', 1)
            out.append(f'<li><span class="q">{E(head)}:</span> ' + ' '.join(opt(o) for o in opts.split('·')) + '</li>')
        else:
            out.append(f'<li>{box(line)}</li>')
    return '<ul class="checks">' + ''.join(out) + '</ul>'


def zone_sheet(z, meta):
    t_word, t_hint = terrain(z)
    c = z['counts']
    groups = [(('crossing', 'crossing_partial', 'crossing_node'), 'crossing', 'crossings'),
              (('entrance', 'entrance_check'), 'entrance', 'entrances'),
              (('steps',), 'flight of steps', 'flights of steps'), (('slope',), 'slope', 'slopes')]
    count_words = []
    for ks, one, many in groups:
        n = sum(c.get(k, 0) for k in ks)
        if n:
            count_words.append(f'{n} {one if n == 1 else many}')
    rows = []
    for p in z['points']:
        title = E(p.get('name') or p['where'])
        sub = E(p['where']) if p.get('name') else ''
        if p['kind'] == 'slope' and p.get('why'):
            sub = E(p['why'])
        known = ('<span class="known">Already mapped: ' + E(', '.join(p['known'])) + '</span>') if p.get('known') else ''
        link = f'<a class="osm" href="{E(p["osm"])}">OSM</a>' if p.get('osm') else ''
        rows.append(f'''<tr>
  <th scope="row" class="num">{shape(p["kind"], p["n"])}<span class="lab">{E(p["label"])}</span></th>
  <td><strong>{title}</strong>{f'<br><span class="sub">{sub}</span>' if sub else ''}<br><span class="kind">{E(KIND[p["kind"]][1])}</span> {link}{('<br>' + known) if known else ''}</td>
  <td>{checks_html(p)}</td>
</tr>''')
    streets = ', '.join(z['streets'][:4])
    mp = z['meeting_point']
    pair_h = z['person_hours'] / 2
    return f'''
<section class="sheet" id="zone-{z["zone"]}" aria-labelledby="zone-{z["zone"]}-h">
  <header class="sheet-head" style="--zc:{z["colour"]}">
    <p class="eyebrow">Map Manly · zone sheet</p>
    <h3 id="zone-{z["zone"]}-h"><span class="zone-badge" style="background:{z["colour"]}">{z["zone"]}</span> Zone {z["zone"]}: {E(streets)}</h3>
    <dl class="facts">
      <div><dt>Meet at</dt><dd><strong>{E(mp["name"])}</strong><br>{E(mp["hint"])}</dd></div>
      <div><dt>Points</dt><dd><strong>{len(z["points"])}</strong>: {E(", ".join(count_words))}</dd></div>
      <div><dt>Loop</dt><dd>About {z["loop_km"]} km there and back, plus {round(z["path_m"] / 1000, 1)} km of footpaths to note on the way</dd></div>
      <div><dt>Time</dt><dd>About {pair_h:.1f} hours for a pair, with rests</dd></div>
      <div><dt>Terrain</dt><dd><strong>{t_word}.</strong> {t_hint}</dd></div>
    </dl>
  </header>
  <figure class="zone-map">
    <img src="{img(f'zone-{z["zone"]}.jpg')}" alt="Map of zone {z["zone"]} around {E(streets)}. The meeting point {E(mp["name"])} is marked M. {len(z["points"])} numbered points: red circles are crossings, blue squares are entrances, purple diamonds are steps and brown triangles are slopes. Dotted orange lines are footpaths missing surface, smoothness or width. Every point is listed in the table below.">
    <figcaption>{legend()} <span class="credit">Map © OpenStreetMap contributors (ODbL), OpenFreeMap, © OpenMapTiles. Data as of {meta["osm_base"][:10]}.</span></figcaption>
  </figure>
  <p class="howto"><strong>How to use this sheet.</strong> Start at M, go in number order and come back to M. Tick what you see; write numbers in the gaps. Skip anything you can’t reach safely and write “skipped”. On the way, note <span class="dotted">dotted orange</span> footpaths: surface, smoothness and narrowest width (StreetComplete asks these for you).</p>
  <table class="tasks stack">
    <caption class="sr-only">Zone {z["zone"]} checklist: {len(z["points"])} points in walking order</caption>
    <thead><tr><th scope="col">No.</th><th scope="col">Where and what</th><th scope="col">Record</th></tr></thead>
    <tbody>
{"".join(rows)}
    </tbody>
  </table>
  <p class="sheet-foot">Back at M: hand this sheet to the data lead. Notes, skipped points and anything odd (blocked kerb ramp, broken door button):</p>
  <div class="notes" aria-hidden="true"></div>
</section>'''


def legend():
    items = [('crossing', 'Crossing'), ('entrance', 'Entrance'), ('steps', 'Steps'), ('slope', 'Slope')]
    return ('<span class="legend">' + ''.join(f'<span>{shape(k)} {w}</span>' for k, w in items) +
            '<span><svg class="shape" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#111" stroke="#FACC15" stroke-width="3"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Arial">M</text></svg> Meeting point</span>'
            '<span><svg class="shape" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><line x1="1" y1="12" x2="23" y2="12" stroke="#C2410C" stroke-width="3" stroke-dasharray="3 2"/></svg> Footpath to note</span></span>')


def zone_table(zones):
    rows = []
    for z in zones:
        c = z['counts']
        t_word, _ = terrain(z)
        rows.append(f'''<tr><th scope="row"><span class="zone-badge" style="background:{z["colour"]}">{z["zone"]}</span> <a href="#zone-{z["zone"]}">{E(", ".join(z["streets"][:2]))}</a></th>
<td>{E(z["meeting_point"]["name"])}</td>
<td class="num">{c.get("crossing", 0) + c.get("crossing_partial", 0) + c.get("crossing_node", 0)}</td>
<td class="num">{c.get("entrance", 0) + c.get("entrance_check", 0)}</td>
<td class="num">{c.get("steps", 0)}</td><td class="num">{c.get("slope", 0)}</td>
<td class="num">{round(z["path_m"] / 1000, 1)}</td><td class="num">{z["loop_km"]}</td>
<td class="num">{z["person_hours"]}</td><td>{t_word}</td></tr>''')
    tot = lambda f: sum(f(z) for z in zones)
    cnt = lambda *ks: tot(lambda z: sum(z['counts'].get(k, 0) for k in ks))
    rows.append(f'''<tr class="total"><th scope="row">All six zones</th><td></td>
<td class="num">{cnt("crossing", "crossing_partial", "crossing_node")}</td><td class="num">{cnt("entrance", "entrance_check")}</td>
<td class="num">{cnt("steps")}</td><td class="num">{cnt("slope")}</td>
<td class="num">{round(tot(lambda z: z["path_m"]) / 1000, 1)}</td><td class="num">{round(tot(lambda z: z["loop_km"]), 1)}</td>
<td class="num">{round(tot(lambda z: z["person_hours"]), 1)}</td><td></td></tr>''')
    return '''<div class="table-wrap"><table class="data">
<caption>The six zones. Hours are person-hours, including walking, rests and 25% for editing and upload.</caption>
<thead><tr><th scope="col">Zone</th><th scope="col">Meet at</th><th scope="col" class="num">Crossings</th><th scope="col" class="num">Entrances</th>
<th scope="col" class="num">Steps</th><th scope="col" class="num">Slopes</th><th scope="col" class="num">Footpaths to note (km)</th>
<th scope="col" class="num">Loop (km)</th><th scope="col" class="num">Person-hours</th><th scope="col">Terrain</th></tr></thead>
<tbody>''' + ''.join(rows) + '</tbody></table></div>'


def coverage_table():
    sys_path = HERE
    import sys
    sys.path.insert(0, sys_path)
    from coverage import TARGETS, LOWER_IS_BETTER
    cb = json.load(open(os.path.join(ROOT, 'data', 'coverage-before.json')))
    rows = []
    for key, target, words in TARGETS:
        v = cb.get(key)
        unit = '' if key in LOWER_IS_BETTER else '%'
        rows.append(f'<tr><th scope="row">{E(words)}</th><td class="num">{"—" if v is None else f"{v}{unit}"}</td>'
                    f'<td class="num">{"≤" if key in LOWER_IS_BETTER else "≥"} {target}{unit}</td><td class="num after">&nbsp;</td></tr>')
    return ('<div class="table-wrap"><table class="data"><caption>Town centre, OpenStreetMap as of ' + E(cb['osm_base'][:10]) +
            '. Fill in “After” from the script once the day’s edits are in.</caption><thead><tr><th scope="col">Measure</th>'
            '<th scope="col" class="num">Before</th><th scope="col" class="num">“Done” target</th><th scope="col" class="num">After</th></tr></thead><tbody>'
            + ''.join(rows) + '</tbody></table></div>')


def add_roles(m):
    """Stacked tables lose their table semantics in some browsers when restyled; say them explicitly."""
    t = m.group(0)
    t = re.sub(r'<table class="([^"]*)">', r'<table class="\1" role="table">', t, count=1)
    t = re.sub(r'<(thead|tbody)>', r'<\1 role="rowgroup">', t)
    t = re.sub(r'<tr>', '<tr role="row">', t)
    t = re.sub(r'<th scope="col"', '<th role="columnheader" scope="col"', t)
    t = re.sub(r'<th scope="row"', '<th role="rowheader" scope="row"', t)
    t = re.sub(r'<td>', '<td role="cell">', t)
    return t


def main():
    zj = json.load(open(os.path.join(ROOT, 'data', 'zones.json')))
    meta, zones = zj['meta'], zj['zones']
    src = open(os.path.join(ROOT, 'kit.src.html')).read()
    tot = meta['totals']
    cb = json.load(open(os.path.join(ROOT, 'data', 'coverage-before.json')))
    values = dict(
        osm_date=meta['osm_base'][:10], points=tot['points'], person_hours=tot['person_hours'],
        pair_hours=round(tot['person_hours'] / 2 / len(zones), 1),
        crossings=tot.get('crossing', 0) + tot.get('crossing_partial', 0) + tot.get('crossing_node', 0),
        crossing_nodes=tot.get('crossing_node', 0),
        entrances=tot.get('entrance', 0) + tot.get('entrance_check', 0), entrances_new=tot.get('entrance', 0),
        steps=tot.get('steps', 0), slopes=tot.get('slope', 0), path_km=tot['path_km'], venues=meta['venues_in_centre'],
        kerb_both=cb['crossings_kerb_both_pct'], entrance_pct=cb['venues_entrance_pct'], crossing_ways=cb['crossing_ways'],
        built=datetime.date.today().strftime('%-d %B %Y'),
    )
    out = src
    out = out.replace('<!--@ZONE_TABLE-->', zone_table(zones))
    out = out.replace('<!--@COVERAGE_TABLE-->', coverage_table())
    out = out.replace('<!--@LEGEND-->', legend())
    out = out.replace('@OVERVIEW_IMG', img('overview.jpg'))
    sheets = ''.join(zone_sheet(z, meta) for z in zones)
    out = out.replace('<!--@ZONE_SHEETS-->', sheets)
    out = re.sub(r'\{\{(\w+)\}\}', lambda m: str(values[m.group(1)]), out)
    out = re.sub(r'<table class="[^"]*\bstack\b[^"]*">.*?</table>', add_roles, out, flags=re.S)
    open(os.path.join(ROOT, 'kit.html'), 'w').write(out)

    # Zone sheets on their own, sharing the kit's styles.
    style = re.search(r'<style>.*?</style>', out, re.S).group(0)
    only = f'''<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Map Manly zone sheets A–F · Roam Access</title>{style}</head>
<body class="sheets-only"><main id="main"><h1 class="sr-only">Map Manly: zone sheets A to F</h1>
<h2 class="sr-only">Zone sheets</h2>{re.sub(r"\{\{(\w+)\}\}", lambda m: str(values[m.group(1)]), sheets)}</main></body></html>'''
    only = re.sub(r'<table class="[^"]*\bstack\b[^"]*">.*?</table>', add_roles, only, flags=re.S)
    open(os.path.join(ROOT, 'zone-sheets.html'), 'w').write(only)
    print('kit.html', round(os.path.getsize(os.path.join(ROOT, 'kit.html')) / 1e6, 2), 'MB; zone-sheets.html written')


if __name__ == '__main__':
    main()
