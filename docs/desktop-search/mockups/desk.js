/* Roam Access — desktop search mockups. One shared engine; each option page
   sets <body data-option="a|b|c">. Everything a person can see is rendered
   here from data.js (real places) so the three options stay comparable.
   Design-phase code: plain JS, no framework, no network. */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const option = document.body.dataset.option || 'a';
  const params = new URLSearchParams(location.search);
  if (params.get('bare') === '1') document.body.classList.add('bare');

  // ── Icons (24×24 strokes; category pins reuse PilotMap's PLACE_ICONS) ──
  const I = {
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
    mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6',
    close: 'M6 6l12 12M18 6 6 18', check: 'M5 12.5 10 17.5 19 7', back: 'M15 5l-7 7 7 7', forward: 'M9 5l7 7-7 7', down: 'm6 9 6 6 6-6', up: 'm6 15 6-6 6 6',
    directions: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
    bookmark: 'M6 4h12v17l-6-4-6 4V4Z', share: 'M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
    sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5', locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
    plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', key: 'M4 6h16M4 12h16M4 18h16', speaker: 'M4 10v4h4l5 4V6L8 10H4ZM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
    edit: 'M4 20h4l11-11-4-4L4 16v4ZM13.5 6.5l4 4', flag: 'M5 21V4h10l1 2h4v9h-9l-1-2H5', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
    photo: 'M4 7h3l2-3h6l2 3h3v12H4V7ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', ear: 'M6 10a6 6 0 0 1 12 0c0 3-2 4-3 6s-1 5-4 5M9 10a3 3 0 0 1 6 0',
    question: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v5M12 8h.01',
    door: 'M5 21V3h14v18M5 21h14M15 12h.01', warn: 'M12 3 2 21h20L12 3ZM12 10v5M12 18h.01', tree: 'M12 3 6 12h4l-4 7h12l-4-7h4L12 3ZM12 19v2',
    food: 'M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.5 1-2.5 3-2.5 6v3h3v9', palette: 'M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8ZM7.5 12h.01M10 8h.01M14.5 8h.01',
    toilet: 'M6 3h5v7H6zM4 10h15v1.5A6.5 6.5 0 0 1 12.5 18h-2A6.5 6.5 0 0 1 4 11.5V10ZM9 18l-1 3h7l-1-3', bed: 'M3 6v13M3 14h18M21 19v-5a3 3 0 0 0-3-3h-8v3M6.5 11.5a1.5 1.5 0 1 0 0-.01',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2', pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    external: 'M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5', heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  };
  const PLACE = {
    cafe: 'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M12 3.5v2.5',
    food: 'M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.5 1-2.5 3-2.5 6v3h3v9',
    bar: 'M6 3h12l-1.2 6.5a4.9 4.9 0 0 1-9.6 0L6 3ZM12 14.5V21M8 21h8',
    park: 'M12 3 6 12h4l-4 7h12l-4-7h4L12 3ZM12 19v2',
    water: 'M3 9c2 0 2-2 4.5-2S10 9 12 9s2-2 4.5-2S19 9 21 9M3 15c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2',
    arts: 'M4 10 12 4l8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16',
    stay: 'M3 6v13M3 14h18M21 19v-5a3 3 0 0 0-3-3h-8v3M6.5 11.5a1.5 1.5 0 1 0 0-.01',
  };
  const KIND_ICON = { Cafe: 'cafe', Restaurant: 'food', Takeaway: 'food', 'Ice cream': 'food', Bar: 'bar', Pub: 'bar', Park: 'park', Garden: 'park', 'Nature reserve': 'park', Beach: 'water', 'Ocean pool': 'water', 'Swimming pool': 'water', Gallery: 'arts', 'Arts centre': 'arts', Library: 'arts', Hotel: 'stay', Motel: 'stay', Hostel: 'stay' };
  const icon = (n, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="${I[n] || PLACE[n]}"/></svg>`;
  const placeIcon = (p, cls = 'lg') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="${PLACE[KIND_ICON[p.kind] || 'food']}"/></svg>`;

  // ── Verdicts (the same rule as lib/pilot/match.js ra2Verdict) ────────
  const V = { works: ['✓', 'Works for you'], check: ['!', 'Check first'], barrier: ['✗', 'Has barriers'], unknown: ['?', 'No info yet'] };
  const PIN_COLOR = { works: '#1E5F8B', check: '#854D0E', barrier: '#9C2D0E', unknown: '#475569' };
  const OSM = { yes: 'Step-free on OpenStreetMap · not checked', limited: 'Partly step-free on OpenStreetMap · not checked', designated: 'Step-free on OpenStreetMap · not checked', no: 'Not step-free on OpenStreetMap · not checked' };
  const relevant = (facts, tags) => facts.filter(f => !f.tags.length || f.tags.some(t => tags.includes(t)));
  function verdictFor(p, needs) {
    const tags = needs.flatMap(n => RA.needTags[n] || []);
    const s = RA.samples[p.id] || {};
    const works = relevant(s.works || [], tags), checks = relevant(s.check || [], tags), barriers = relevant(s.barriers || [], tags);
    const covered = [...works, ...checks, ...barriers].some(f => f.tags.includes('stepfree'));
    const osm = p.osm && OSM[p.osm] && tags.includes('stepfree') && !covered ? [{ s: OSM[p.osm], n: 0, src: 'osm', tags: ['stepfree'] }] : [];
    const chk = [...checks.map(f => ({ ...f, src: 'community' })), ...osm];
    if (!barriers.length && !chk.length && !works.length) return { kind: 'unknown', reason: null, works: [], checks: [], barriers: [] };
    const kind = barriers.length ? 'barrier' : chk.length ? 'check' : 'works';
    const first = kind === 'barrier' ? barriers[0] : kind === 'check' ? chk[0] : works[0];
    const reason = { kind: kind === 'check' ? 'check' : kind, text: first.src === 'osm' ? first.s : `${first.s} · ${first.n} ${first.n === 1 ? 'person' : 'people'}`, sample: first.src !== 'osm' };
    return { kind, reason, works, checks: chk, barriers };
  }
  const verdictPill = (k, big = false) => `<span class="verdict v-${k}${big ? ' big' : ''}"><span class="mark" aria-hidden="true">${V[k][0]}</span>${V[k][1]}</span>`;

  // ── Query parsing (a subset of ra2ParseQuery) ──────────────────────────
  const CAT_WORDS = { food: /\b(cafes?|coffee|restaurants?|lunch|dinner|breakfast|brunch|eat|food|drinks?|bars?|pubs?|pizza|gelato|ice[- ]?cream|bakery|takeaway|burgers?)\b/i, parks: /\b(parks?|walks?|gardens?|beach(es)?|pools?|swim\w*|ocean|reserves?)\b/i, arts: /\b(museums?|galler(y|ies)|arts?|librar(y|ies)|cultur\w*)\b/i, stay: /\b(hotels?|stay|accommodation|hostels?|motels?)\b/i };
  const CAT_LABEL = { food: 'Food & drink', parks: 'Parks & beaches', arts: 'Arts & culture', stay: 'Places to stay' };
  const CAT_PLURAL = { food: 'cafes and food places', parks: 'parks and beaches', arts: 'arts and culture places', stay: 'places to stay' };
  function parse(text) {
    const t = (text || '').trim();
    const cats = Object.keys(CAT_WORDS).filter(c => CAT_WORDS[c].test(t));
    const name = cats.length ? '' : t;
    return { raw: t, cats, name };
  }

  // ── State ──────────────────────────────────────────────────────────────
  const S = {
    q: params.get('q') || '', cats: [], works: false, needs: [...RA.me.needs], openNow: false, dist: 0, hideBarriers: false, sort: 'match',
    page: 0, searched: false, place: null, preview: null, zoom: 1, saved: [...RA.me.saved], panned: false, hot: null,
    origin: { ...RA.origin, label: 'Manly Wharf' }, area: null, view: null,
  };
  const state0 = params.get('state');
  if (state0 === 'results' || params.get('q')) { S.searched = true; S.q = S.q || 'cafe'; }
  if (state0 === 'place') { S.searched = true; S.q = S.q || 'cafe'; S.place = params.get('place') || 'hugos-n458715841'; }
  if (state0 === 'results' && params.get('cat')) { S.cats = [params.get('cat')]; }
  if (params.get('scale')) document.documentElement.style.setProperty('--scale', params.get('scale'));

  const walkMins = (o, v) => { const R = 6371000, rad = Math.PI / 180; const dLat = (v.lat - o.lat) * rad, dLng = (v.lng - o.lng) * rad; const h = Math.sin(dLat / 2) ** 2 + Math.cos(o.lat * rad) * Math.cos(v.lat * rad) * Math.sin(dLng / 2) ** 2; return Math.max(1, Math.round((2 * R * Math.asin(Math.sqrt(h)) * 1.25) / 80)); };
  const all = RA.venues.map(p => ({ ...p }));
  const inArea = p => !S.area || (Math.abs(p.lat - S.area.lat) <= S.area.spanLat / 2 && Math.abs(p.lng - S.area.lng) <= S.area.spanLng / 2);
  const byId = Object.fromEntries(all.map(p => [p.id, p]));
  const walk = m => `${m} min walk`;
  function enrich(p) { const v = verdictFor(p, S.needs); return { ...p, verdict: v, mins: walkMins(S.origin, p) }; }
  const hasInfo = p => p.verdict.kind !== 'unknown';

  function results() {
    const q = parse(S.q);
    const cats = S.cats.length ? S.cats : q.cats;
    let list = all.filter(p => (!cats.length || cats.includes(p.cat)) && inArea(p));
    if (q.name) list = list.filter(p => p.name.toLowerCase().includes(q.name.toLowerCase()));
    list = list.map(enrich);
    const counts = { works: 0, check: 0, barrier: 0, unknown: 0 };
    list.forEach(p => counts[p.verdict.kind]++);
    const before = list.length;
    if (S.works) list = list.filter(p => p.verdict.kind === 'works');
    else if (S.hideBarriers) list = list.filter(p => p.verdict.kind !== 'barrier');
    if (S.dist) list = list.filter(p => p.mins <= S.dist);
    const rank = { works: 3, check: 2, unknown: 1, barrier: 0 };
    list.sort(S.sort === 'near' ? (a, b) => a.mins - b.mins : (a, b) => (rank[b.verdict.kind] - rank[a.verdict.kind]) || (a.mins - b.mins));
    const label = q.name ? `“${q.raw}”` : cats.length ? cats.map(c => CAT_PLURAL[c]).join(' and ') : 'places';
    return { list, counts, label, before, cats };
  }
  const PAGE = 10;
  const pageOf = list => list.slice(S.page * PAGE, (S.page + 1) * PAGE);
  // Before a search: the nearest places that anyone has said something about, then the nearest.
  function nearYou() {
    const by = all.map(enrich).sort((a, b) => a.mins - b.mins);
    const known = by.filter(p => (RA.samples[p.id] || {}).reviews).slice(0, 5);
    return [...known, ...by.filter(p => !known.includes(p))].slice(0, 5);
  }

  // ── Rendering: top bar + chips ─────────────────────────────────────────
  function renderTop() {
    $('#topbar').innerHTML = `
      <a class="brand" href="index.html">roam<span class="slash">/</span>access<span class="sr-only"> home</span><span class="tag" aria-hidden="true">Pilot · Manly &amp; surrounds</span></a>
      <form class="search" role="search" aria-label="Search for a place or a kind of place" id="searchform">
        <span class="lead" aria-hidden="true">${icon('search')}</span>
        <label class="sr-only" for="q">Search for a place or a kind of place</label>
        <input id="q" name="q" type="text" autocomplete="off" enterkeyhint="search" placeholder="Cafe, beach, Hugos…" value="${esc(S.searched ? S.q : '')}">
        ${S.searched && S.q ? `<button type="button" class="iconbtn ghost" id="clearq" aria-label="Clear search">${icon('close')}</button>` : ''}
        <button type="button" class="iconbtn ghost teal" id="micbtn" aria-label="Search by voice">${icon('mic')}</button>
        <button type="submit" class="iconbtn filled" aria-label="Search">${icon('forward')}</button>
      </form>
      <nav class="topnav" aria-label="Saved places and me">
        <a class="navbtn" href="#" data-toast="Saved opens the Saved list in the panel">${icon('bookmark')}Saved${RA.me.unseen ? `<span class="pip" aria-hidden="true">${RA.me.unseen}</span><span class="sr-only">, ${RA.me.unseen} updates</span>` : ''}</a>
        <a class="navbtn" href="#" data-toast="Me: needs, how I appear, text size and contrast, language, account"><span class="avatar" aria-hidden="true">${RA.me.name[0]}</span>Me</a>
      </nav>`;
    $('#searchform').addEventListener('submit', e => { e.preventDefault(); S.q = $('#q').value.trim(); S.cats = []; S.searched = !!S.q; S.page = 0; S.place = null; S.preview = null; renderAll(); announce(); focusPanelHeading(); });
    $('#clearq')?.addEventListener('click', () => { S.q = ''; S.searched = false; S.cats = []; S.page = 0; S.place = null; renderAll(); $('#q').focus(); });
    $('#micbtn').addEventListener('click', () => toast('Listening… (in the app the field shows “Listening…” and the words you say)'));
  }

  function renderChips() {
    const r = results();
    const needsLabel = S.needs.length ? S.needs.map(n => RA.needLabel[n].split(' ')[0]).join(' · ') : 'Add your needs';
    const catLabel = S.cats.length ? S.cats.map(c => CAT_LABEL[c]).join(', ') : r.cats.length ? r.cats.map(c => CAT_LABEL[c]).join(', ') : 'Category';
    const more = (S.hideBarriers ? 1 : 0);
    $('#filterbar').innerHTML = `
      <div role="group" aria-label="Filter places" style="display:contents">
        ${r.counts.works || S.works ? `<button type="button" class="chip" id="c-works" aria-pressed="${S.works}">${icon('check', 'sm tick')}Works for me<span class="count"><span class="sr-only">, </span>${r.counts.works}</span></button>` : ''}
        <button type="button" class="chip menu ${S.cats.length || r.cats.length ? 'on' : ''}" id="c-cat" aria-haspopup="dialog" aria-expanded="false">${catLabel}${icon('down')}</button>
        <button type="button" class="chip menu on" id="c-needs" aria-haspopup="dialog" aria-expanded="false">${icon('user', 'sm')}For: ${esc(needsLabel)}${icon('down')}</button>
        <button type="button" class="chip" id="c-open" aria-pressed="${S.openNow}">${icon('check', 'sm tick')}Open now</button>
        <button type="button" class="chip menu ${S.dist ? 'on' : ''}" id="c-dist" aria-haspopup="dialog" aria-expanded="false">${S.dist ? `Up to ${S.dist} min walk` : 'Any distance'}${icon('down')}</button>
        <button type="button" class="chip" id="c-more" aria-haspopup="dialog" aria-expanded="false">${icon('sliders', 'sm')}More filters${more ? `<span class="count"><span class="sr-only">, </span>${more} on</span>` : ''}</button>
        ${S.area ? `<button type="button" class="chip on" id="c-area" aria-label="Remove filter: In the map area">In the map area${icon('close', 'sm')}</button>` : ''}
      </div>
      <span class="lbl" style="margin-left:auto">Filters only narrow the list. They never change a verdict.</span>
      <dialog class="pop" id="pop-cat" aria-label="Category"><h2>Kind of place</h2>
        ${Object.keys(CAT_LABEL).map(c => `<label class="check"><input type="checkbox" data-cat="${c}" ${(S.cats.length ? S.cats : r.cats).includes(c) ? 'checked' : ''}>${CAT_LABEL[c]}<span class="n">${all.filter(p => p.cat === c).length}</span></label>`).join('')}
        <label class="check"><input type="checkbox" data-toast="Toilets open the accessible-toilets list (a listing, not a verdict)">Accessible toilets<span class="n">list</span></label>
        <div class="foot"><button type="button" class="btn sm" data-close>Show places</button><button type="button" class="btn sm plain" data-clearcat>Any kind</button></div></dialog>
      <dialog class="pop" id="pop-needs" aria-label="Your needs"><h2>Verdicts are for these needs</h2>
        ${Object.keys(RA.needLabel).map(n => `<label class="check"><input type="checkbox" data-need="${n}" ${S.needs.includes(n) ? 'checked' : ''}>${RA.needLabel[n]}</label>`).join('')}
        <p class="hint">Untick one to see a place for someone else. Your saved needs stay the same (change them in Me).</p>
        <div class="foot"><button type="button" class="btn sm" data-close>Done</button></div></dialog>
      <dialog class="pop" id="pop-dist" aria-label="Distance"><h2>How far will you walk?</h2>
        ${[0, 5, 10, 20].map(d => `<label class="check"><input type="radio" name="dist" value="${d}" ${S.dist === d ? 'checked' : ''}>${d ? `Up to ${d} min` : 'Any distance'}</label>`).join('')}
        <p class="hint">Walking from Manly Wharf. <a href="#" data-toast="Uses your location (asks first)">Use my location</a></p>
        <div class="foot"><button type="button" class="btn sm" data-close>Done</button></div></dialog>
      <dialog class="pop" id="pop-more" aria-label="More filters"><h2>More filters</h2>
        <label class="check"><input type="checkbox" id="f-hide" ${S.hideBarriers || S.works ? 'checked' : ''} ${S.works ? 'disabled' : ''}>Hide places with barriers</label>
        <label class="check"><input type="checkbox" data-toast="Needs community sensory reports (none in the dev data)">Quiet now</label>
        <label class="check"><input type="checkbox" data-toast="Needs community sensory reports (none in the dev data)">Has quiet times</label>
        <p class="hint">Filters only narrow the list. They never change a verdict.</p>
        <div class="foot"><button type="button" class="btn sm" data-close>Show ${results().list.length} places</button></div></dialog>`;
    $('#c-area')?.addEventListener('click', () => { S.area = null; S.origin = { ...RA.origin, label: 'Manly Wharf' }; S.page = 0; renderAll(); announce(); $('#c-more').focus(); });
    $('#c-works')?.addEventListener('click', () => { S.works = !S.works; S.page = 0; renderAll(); announce(); $('#c-works').focus(); });
    $('#c-open').addEventListener('click', () => { S.openNow = !S.openNow; renderChips(); toast(S.openNow ? 'Open now: shown only where we have opening hours (most OpenStreetMap places have none yet)' : 'Open now off'); $('#c-open').focus(); });
    wirePop('#c-cat', '#pop-cat'); wirePop('#c-needs', '#pop-needs'); wirePop('#c-dist', '#pop-dist'); wirePop('#c-more', '#pop-more');
    $$('#pop-cat [data-cat]').forEach(cb => cb.addEventListener('change', () => { S.cats = $$('#pop-cat [data-cat]:checked').map(x => x.dataset.cat); S.q = S.cats.length ? '' : S.q; S.searched = true; S.page = 0; S.place = null; renderPanel(); renderMap(); announce(); }));
    $('[data-clearcat]').addEventListener('click', () => { S.cats = []; S.q = ''; S.searched = false; renderAll(); });
    $$('#pop-needs [data-need]').forEach(cb => cb.addEventListener('change', () => { S.needs = $$('#pop-needs [data-need]:checked').map(x => x.dataset.need); renderPanel(); renderMap(); renderDetails(); announce(); }));
    $$('#pop-dist [name=dist]').forEach(rb => rb.addEventListener('change', () => { S.dist = +rb.value; S.page = 0; renderPanel(); renderMap(); announce(); }));
    $('#f-hide').addEventListener('change', e => { S.hideBarriers = e.target.checked; S.page = 0; renderPanel(); renderMap(); announce(); });
  }
  function wirePop(btnSel, popSel) {
    const btn = $(btnSel), pop = $(popSel);
    btn.addEventListener('click', () => {
      if (pop.open) { pop.close(); return; }
      $$('dialog.pop[open]').forEach(d => d.close());
      const r = btn.getBoundingClientRect(), bar = $('#filterbar').getBoundingClientRect();
      pop.style.left = Math.min(r.left - bar.left, bar.width - 340) + 'px'; pop.style.top = (r.bottom - bar.top + 6) + 'px';
      pop.show(); btn.setAttribute('aria-expanded', 'true');
      (pop.querySelector('input, button') || pop).focus();
    });
    pop.addEventListener('close', () => { btn.setAttribute('aria-expanded', 'false'); renderChips(); $(btnSel)?.focus(); });
    pop.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); pop.close(); } });
    pop.querySelector('[data-close]')?.addEventListener('click', () => pop.close());
  }
  document.addEventListener('click', e => {
    const open = $('dialog.pop[open]');
    if (open && !open.contains(e.target) && !e.target.closest('.chip')) open.close();
    const t = e.target.closest('[data-toast]');
    if (t) { e.preventDefault(); toast(t.dataset.toast); }
  });

  // ── Rendering: the results panel ───────────────────────────────────────
  function cardHtml(p, selected) {
    const r = p.verdict.reason;
    const why = r ? `<span class="why"><span class="rmark ${r.kind}" aria-hidden="true">${V[r.kind][0]}</span><span><span class="sr-only">${r.kind === 'works' ? 'Yes:' : r.kind === 'barrier' ? 'No:' : 'Check:'} </span>${esc(r.text)}${r.sample ? ' <span class="sample">sample</span>' : ''}</span></span>`
      : `<span class="why">Been here? Be the first</span>`;
    const photo = (RA.samples[p.id] || {}).photos;
    return `<li><a class="card" href="#place=${p.id}" data-id="${p.id}" ${selected ? 'aria-current="true"' : ''}>
      <span class="thumb ${photo ? 'photo' : ''}" aria-hidden="true">${photo ? icon('photo') : placeIcon(p)}</span>
      <span class="body2"><span class="title" id="t-${p.id}">${esc(p.name)}</span><span class="sub" id="s-${p.id}">${esc(p.kind)} · ${esc(p.area)} · ${walk(p.mins)}</span>
        <span class="meta"><span id="v-${p.id}">${verdictPill(p.verdict.kind)}</span><span id="why-${p.id}">${why}</span></span></span>
      <span class="chev" aria-hidden="true">${icon('forward')}</span></a></li>`;
  }
  function wireCards(root) {
    $$('.card', root).forEach(a => {
      const id = a.dataset.id;
      a.addEventListener('click', e => { e.preventDefault(); openPlace(id, a); });
      a.addEventListener('mouseenter', () => hot(id)); a.addEventListener('mouseleave', () => hot(null));
      a.addEventListener('focus', () => hot(id)); a.addEventListener('blur', () => hot(null));
    });
  }
  function renderPanel() {
    const panel = $('#panel');
    if (option === 'c' && S.place) { panel.innerHTML = detailsHtml(byId[S.place], 'panel'); wireDetails(panel); return; }
    if (!S.searched) {
      const near = nearYou();
      panel.innerHTML = `<div class="pad">
        <h1 tabindex="-1" id="panel-h">Find a place<span class="dot" aria-hidden="true">.</span></h1>
        <p class="lead">Places around Manly, checked by people with needs like yours.</p>
        <nav aria-label="Browse" class="grid">
          <a class="tile wide" href="#near" data-near>${icon('locate')}Near me now</a>
          <a class="tile" href="#cat=food" data-cat="food">${icon('cafe')}Food &amp; drink</a>
          <a class="tile" href="#cat=parks" data-cat="parks">${icon('tree')}Parks &amp; beaches</a>
          <a class="tile" href="#cat=arts" data-cat="arts">${icon('palette')}Arts &amp; culture</a>
          <a class="tile" href="#toilets" data-toast="Opens the accessible-toilets list (a listing, not a verdict)">${icon('toilet')}Toilets</a>
        </nav>
        <section aria-labelledby="near-h" class="sec">
          <h2 id="near-h">Near you</h2>
          <p class="small muted">Walking from ${esc(S.origin.label)}. ${S.origin.label === 'your location' ? '' : '<a href="#" data-locate>Use my location</a>'}</p>
          <ul class="cards" aria-labelledby="near-h">${near.map(p => cardHtml(p, p.id === S.place)).join('')}</ul>
          <a class="btn secondary full" href="#all" data-all style="margin-top:14px">See all ${all.length} places</a>
        </section></div>`;
      $$('[data-cat]', panel).forEach(a => a.addEventListener('click', e => { e.preventDefault(); S.cats = [a.dataset.cat]; S.q = ''; S.searched = true; S.page = 0; renderAll(); announce(); focusPanelHeading(); }));
      $('[data-locate]', panel)?.addEventListener('click', e => { e.preventDefault(); S.origin = { lat: -33.7977, lng: 151.2895, label: 'your location' }; renderAll(); toast('Pretend location: Manly Beach. Walks and “Nearest first” now measure from here.'); });
      $('[data-near]', panel).addEventListener('click', e => { e.preventDefault(); S.q = ''; S.cats = []; S.searched = true; S.sort = 'near'; S.page = 0; renderAll(); announce(); focusPanelHeading(); toast('Near me now: all places, nearest first (asks for your location in the app)'); });
      $('[data-all]', panel).addEventListener('click', e => { e.preventDefault(); S.q = ''; S.cats = []; S.searched = true; S.page = 0; renderAll(); announce(); focusPanelHeading(); });
      wireCards(panel); return;
    }
    const r = results();
    const pages = Math.max(1, Math.ceil(r.list.length / PAGE));
    S.page = Math.min(S.page, pages - 1);
    const rows = pageOf(r.list);
    const c = r.counts;
    const counts = [c.works && `${c.works} work${c.works === 1 ? 's' : ''} for you`, c.check && `${c.check} check first`, c.barrier && `${c.barrier} ha${c.barrier === 1 ? 's' : 've'} barriers`, c.unknown && `${c.unknown} no info yet`].filter(Boolean).join(' · ');
    const filtered = r.list.length !== r.before;
    panel.innerHTML = `<div class="pad">
      <button type="button" class="back" id="backfind">${icon('back', 'sm')}Back to Find</button>
      <div class="resulthead" style="margin-top:6px">
        <div><h1 tabindex="-1" id="panel-h">${r.list.length} ${esc(r.label)}<span class="dot" aria-hidden="true">.</span><span class="sr-only"> Search results.</span></h1>
          <p class="counts">${counts ? counts + '.' : ''}${filtered ? ` <span class="muted">${r.before} before filters.</span>` : ''} <span class="muted">Walking from ${esc(S.origin.label)}.</span></p></div>
        <label class="sort">Sort <select id="sort"><option value="match" ${S.sort === 'match' ? 'selected' : ''}>Best for me</option><option value="near" ${S.sort === 'near' ? 'selected' : ''}>Nearest first</option></select></label>
      </div>
      ${rows.length ? `<ul class="cards" aria-label="Places: ${esc(r.label)}, page ${S.page + 1} of ${pages}">${rows.map(p => cardHtml(p, p.id === S.place)).join('')}</ul>` : `
        <div class="empty"><p><strong>${filtered ? 'No places match your filters' : `Nothing matched ${esc(r.label)}`}</strong></p><p class="small" style="margin-top:6px">${filtered ? `${r.before} places match without them.` : 'Try a kind of place, like cafe or beach.'}</p>
          <button type="button" class="btn secondary" style="margin-top:12px" id="clearall">${filtered ? 'Clear filters' : 'See all places'}</button></div>`}
      ${pages > 1 ? `<nav class="pager" aria-label="Pages of results">
        <button type="button" class="btn ghost sm" id="prevp" ${S.page === 0 ? 'disabled' : ''}>${icon('back', 'sm')}Previous</button>
        <span class="where" aria-live="polite">Page ${S.page + 1} of ${pages}</span>
        <button type="button" class="btn ghost sm" id="nextp" ${S.page >= pages - 1 ? 'disabled' : ''}>Next ${PAGE}${icon('forward', 'sm')}</button></nav>
        <p class="small muted" style="margin-top:8px">The map shows the places on this page.</p>` : ''}
    </div>`;
    $('#backfind').addEventListener('click', () => { S.searched = false; S.q = ''; S.cats = []; S.works = false; S.dist = 0; S.hideBarriers = false; S.place = null; renderAll(); focusPanelHeading(); });
    $('#sort').addEventListener('change', e => { S.sort = e.target.value; S.page = 0; renderPanel(); renderMap(); announce(); $('#sort').focus(); });
    $('#prevp')?.addEventListener('click', () => { S.page--; renderPanel(); renderMap(); announce(); $('#prevp:not(:disabled), #nextp').focus(); });
    $('#nextp')?.addEventListener('click', () => { S.page++; renderPanel(); renderMap(); announce(); $('#nextp:not(:disabled), #prevp').focus(); });
    $('#clearall')?.addEventListener('click', () => { S.works = false; S.dist = 0; S.hideBarriers = false; if (!filtered) { S.q = ''; S.cats = []; } S.page = 0; renderAll(); announce(); focusPanelHeading(); });
    wireCards(panel);
  }
  const focusPanelHeading = () => requestAnimationFrame(() => $('#panel-h')?.focus());

  // ── Rendering: the map ────────────────────────────────────────────────
  // Illustrative ground (drawn water and a few streets in real coordinates),
  // real pins. Pins mirror the list on screen; overlapping pins are hidden,
  // never clustered; "No info yet" places hide at the overview zoom.
  const WATER = [
    // The harbour: Manly Cove (wharf, East and West Esplanade), Little Manly, Collins Flat, Store and Quarantine beaches, west to Fairlight and Castle Rock
    [[-33.8005, 151.2730], [-33.8003, 151.2760], [-33.8000, 151.2792], [-33.7996, 151.2818], [-33.8013, 151.2840], [-33.8013, 151.2856], [-33.8032, 151.2862], [-33.8060, 151.2858], [-33.8076, 151.2874], [-33.8092, 151.2902], [-33.8122, 151.2880], [-33.8160, 151.2860], [-33.8400, 151.2950], [-33.8400, 151.2400], [-33.8125, 151.2560], [-33.8030, 151.2690]],
    // The ocean: Freshwater, Queenscliff, North Steyne and Manly Beach, round Fairy Bower to Shelly Beach
    [[-33.7700, 151.2960], [-33.7822, 151.2928], [-33.7880, 151.2896], [-33.7933, 151.2888], [-33.7977, 151.2906], [-33.7996, 151.2932], [-33.8005, 151.2952], [-33.7996, 151.2974], [-33.8003, 151.2996], [-33.8035, 151.3012], [-33.8400, 151.3200], [-33.7700, 151.3200]],
  ];
  const ROADS = [
    [[-33.8003, 151.2843], [-33.7975, 151.2878]], // The Corso
    [[-33.8035, 151.2862], [-33.8003, 151.2843], [-33.7990, 151.2800]], // East / West Esplanade
    [[-33.7930, 151.2862], [-33.7985, 151.2838], [-33.8025, 151.2825]], // Belgrave Street / Pittwater Road
    [[-33.7975, 151.2878], [-33.7880, 151.2905]], // North Steyne
    [[-33.7975, 151.2878], [-33.8015, 151.2910], [-33.8005, 151.2965]], // South Steyne → Shelly Beach
    [[-33.7990, 151.2800], [-33.7950, 151.2740], [-33.7960, 151.2660]], // Sydney Road
  ];
  function mapPlaces() {
        if (!S.searched) return all.map(enrich).filter(hasInfo).sort((a, b) => a.mins - b.mins).slice(0, 12);
    return pageOf(results().list);
  }
  function renderMap() {
    const map = $('#map'); const H = map.clientHeight;
    const mr = map.getBoundingClientRect(); const dr = option === 'a' && S.place ? $('#drawer').getBoundingClientRect() : null;
    let padL = dr ? Math.max(0, dr.right - mr.left) : 0;
    const covered = dr && mr.width - padL < 360;
    document.body.classList.toggle('map-covered', !!covered);
    map.toggleAttribute('inert', !!covered); map.setAttribute('aria-hidden', covered ? 'true' : 'false');
    if (covered) padL = 0;
    const W = map.clientWidth - padL;
    map.style.setProperty('--maplead', padL + 'px');
    const pts = mapPlaces();
    const focusPts = pts.length ? pts : [RA.origin];
    let minLat = Math.min(...focusPts.map(p => p.lat)), maxLat = Math.max(...focusPts.map(p => p.lat));
    let minLng = Math.min(...focusPts.map(p => p.lng)), maxLng = Math.max(...focusPts.map(p => p.lng));
    const cLat = (minLat + maxLat) / 2, cLng = (minLng + maxLng) / 2, k = Math.cos(cLat * Math.PI / 180);
    let spanLng = Math.max((maxLng - minLng) * 1.35, 0.006), spanLat = Math.max((maxLat - minLat) * 1.35, 0.004);
    // keep the aspect ratio, then apply the (mock) zoom
    if (spanLng * k / spanLat < W / H) spanLng = spanLat * (W / H) / k; else spanLat = spanLng * k / (W / H);
    spanLng /= S.zoom; spanLat /= S.zoom;
    const X = lng => padL + ((lng - (cLng - spanLng / 2)) / spanLng) * W, Y = lat => (((cLat + spanLat / 2) - lat) / spanLat) * H;
    S.view = { lat: cLat, lng: cLng, spanLat, spanLng };
    const street = S.zoom >= 2.2; // mock zoom: ≥ 2.2 ≈ street level (zoom 15+ in the app)
    const poly = pts2 => pts2.map(([la, ln], i) => `${i ? 'L' : 'M'}${X(ln).toFixed(1)} ${Y(la).toFixed(1)}`).join(' ') + 'Z';
    const line = pts2 => pts2.map(([la, ln], i) => `${i ? 'L' : 'M'}${X(ln).toFixed(1)} ${Y(la).toFixed(1)}`).join(' ');
    const grid = []; for (let x = (X(cLng) % 90); x < W + padL; x += 90) grid.push(`M${x.toFixed(0)} 0V${H}`); for (let y = (Y(cLat) % 90); y < H; y += 90) grid.push(`M0 ${y.toFixed(0)}H${W}`);
    // Three tiers, never a cluster bubble: the better match wins the full pin; a place
    // that would overlap it becomes a small marker (verdict shape + category); a place
    // that would overlap even that becomes a dot. Every place on the page stays on the map.
    const rank = { works: 3, barrier: 2, check: 1, unknown: 0 };
    const placed = []; const hidden = [];
    const ordered = [...pts].sort((a, b) => (rank[b.verdict.kind] - rank[a.verdict.kind]) || (a.mins - b.mins));
    const near = (x, y, r) => placed.some(q => Math.abs(q.x - x) < r && Math.abs(q.y - y) < r);
    ordered.forEach(p => {
      const x = X(p.lng), y = Y(p.lat); const sel = S.preview === p.id || S.place === p.id || S.hot === p.id;
      let tier = street || sel ? 'full' : 'small';
      if (tier === 'full' && !sel && near(x, y, 44)) tier = 'small';
      if (tier === 'small' && near(x, y, 30)) tier = 'dot';
      if (tier === 'dot' && near(x, y, 10)) { hidden.push(p); return; }
      placed.push({ ...p, x, y, tier });
    });
    const dots = placed.filter(p => p.tier === 'dot').length;
    const unknownHidden = !S.searched ? all.map(enrich).filter(p => !hasInfo(p)).length : 0;
    map.innerHTML = `
      <a class="skip skipmap" href="#after-map">Skip the map</a>
      <svg class="ground" aria-hidden="true" focusable="false">
        <path d="${grid.join('')}" stroke="#DCE2D6" stroke-width="1" fill="none"/>
        ${WATER.map(w => `<path d="${poly(w)}" fill="#CFE0E6"/>`).join('')}
        ${ROADS.map(r => `<path d="${line(r)}" stroke="#F7F6F1" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')}
        <circle cx="${X(RA.origin.lng)}" cy="${Y(RA.origin.lat)}" r="7" fill="#1E5F8B" stroke="#FAF9F6" stroke-width="3"/>
      </svg>
      ${placed.map(p => p.tier === 'dot' ? dotHtml(p) : pinHtml(p)).join('')}
      ${S.searched ? `<button type="button" class="searcharea" id="searcharea">${icon('search', 'sm')}Search this area</button>` : ''}
      ${!S.searched ? `<p class="mapnote">The ${pts.length} nearest places with any information. Places with no info yet appear when you zoom in.</p>` : dots || hidden.length ? `<p class="mapnote">${dots + hidden.length} ${dots + hidden.length === 1 ? 'place is' : 'places are'} a dot or under another pin. Zoom in to see ${dots + hidden.length === 1 ? 'it' : 'them'}.</p>` : ''}
      <div class="mapctl tr"><button type="button" class="iconbtn floating" id="locate" aria-label="Show my location">${icon('locate')}</button></div>
      <div class="mapctl br"><button type="button" class="iconbtn floating" id="zin" aria-label="Zoom in">${icon('plus')}</button><button type="button" class="iconbtn floating" id="zout" aria-label="Zoom out">${icon('minus')}</button></div>
      <div class="mapctl bl"><button type="button" class="btn ghost sm" id="keybtn" aria-haspopup="dialog" aria-expanded="false" style="background:var(--paper);box-shadow:var(--shadow-2)">${icon('key', 'sm')}Key</button></div>
      <dialog class="pop" id="pop-key" aria-label="What the pins mean" style="left:16px;bottom:96px;top:auto"><h2>What the pins mean</h2>
        <p class="small">The colour and the mark say if a place works for you. Only reviews from people with needs like yours can make a place “Works for you”.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">${Object.keys(V).map(k => verdictPill(k)).join('')}</div>
        <p class="small">Zoomed out, a pin is a small shape with the kind of place in it: a circle works for you, a diamond is check first, an octagon has barriers. A dot is a place on the list that is under another pin — zoom in to see it.</p><div style="display:flex;gap:10px;align-items:center;margin:8px 0" aria-hidden="true">${smallSvg('works')}${smallSvg('check')}${smallSvg('barrier')}<span class="dot-m" style="position:static;transform:none;background:${PIN_COLOR.check}"></span></div><p class="small">The picture in a pin is the kind of place: cafe, food, bar, park, beach or pool, arts, stay.</p>
        <div class="foot"><button type="button" class="btn sm" data-close>Close</button></div></dialog>
      <span class="credit">Illustrative map · pins are real places from OpenStreetMap</span>
      <span id="after-map" tabindex="-1"></span>
      <div id="previewhost"></div>`;
    $$('.pin', map).forEach(b => {
      const id = b.dataset.id;
      b.addEventListener('click', () => { S.preview = S.preview === id ? null : id; renderPreview(true); });
      b.addEventListener('mouseenter', () => hotCard(id, true)); b.addEventListener('mouseleave', () => hotCard(id, false));
    });
    $('#zin').addEventListener('click', () => { S.zoom = Math.min(4, S.zoom * 1.5); S.panned = true; renderMap(); $('#zin').focus(); });
    $('#zout').addEventListener('click', () => { S.zoom = Math.max(0.5, S.zoom / 1.5); S.panned = true; renderMap(); $('#zout').focus(); });
    $('#locate').addEventListener('click', () => toast('Asks for your location, then shows it on the map and measures walks from there'));
    $('#searcharea')?.addEventListener('click', () => { S.area = { ...S.view }; S.searched = true; S.origin = { lat: S.view.lat, lng: S.view.lng, label: 'the middle of the map' }; S.page = 0; S.place = null; S.preview = null; renderAll(); announce(); toast('Now showing the places in this map area, walks measured from its middle.'); focusPanelHeading(); });
    const kb = $('#keybtn'), kp = $('#pop-key');
    kb.addEventListener('click', () => { if (kp.open) kp.close(); else { kp.show(); kb.setAttribute('aria-expanded', 'true'); kp.querySelector('button').focus(); } });
    kp.addEventListener('close', () => { kb.setAttribute('aria-expanded', 'false'); kb.focus(); });
    kp.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); kp.close(); } });
    kp.querySelector('[data-close]').addEventListener('click', () => kp.close());
    map.addEventListener('keydown', e => { if (e.key === 'Escape' && S.preview) { S.preview = null; renderPreview(true); } });
    renderPreview(false);
  }
  const PIN_PATH = 'M16 39C16 39 3 24.5 3 15.5a13 13 0 0 1 26 0C29 24.5 16 39 16 39Z';
  function pinSvg(p) {
    const k = p.verdict.kind, color = PIN_COLOR[k], unknown = k === 'unknown';
    const w = 40, h = 50;
    return `<svg width="${w}" height="${h}" viewBox="0 0 32 40" aria-hidden="true" focusable="false" style="overflow:visible">
        <path d="${PIN_PATH}" fill="${unknown ? '#FAF9F6' : color}" stroke="${unknown ? color : '#FAF9F6'}" stroke-width="2"/>
        <g transform="translate(8.5 8) scale(0.625)"><path d="${PLACE[KIND_ICON[p.kind] || 'food']}" fill="none" stroke="${unknown ? color : '#FAF9F6'}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>
        <circle cx="27" cy="5" r="6.5" fill="#FAF9F6" stroke="${color}" stroke-width="1.5"/><text x="27" y="8.2" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="800" font-size="9" fill="${color}">${V[k][0]}</text>
      </svg>`;
  }
  const SHAPE = { works: 'M14 2a12 12 0 1 1 0 24 12 12 0 0 1 0-24Z', check: 'M14 1 27 14 14 27 1 14Z', barrier: 'M9 1h10l8 8v10l-8 8H9l-8-8V9z', unknown: 'M14 2a12 12 0 1 1 0 24 12 12 0 0 1 0-24Z' };
  function smallSvg(k, iconId = 'cafe') {
    const color = PIN_COLOR[k];
    return `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="${SHAPE[k]}" fill="${color}" stroke="#FAF9F6" stroke-width="2"/><g transform="translate(7 7) scale(0.58)"><path d="${PLACE[iconId]}" fill="none" stroke="#FAF9F6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
  }
  function dotHtml(p) {
    return `<span class="dot-m" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px;background:${PIN_COLOR[p.verdict.kind]}" aria-hidden="true"></span>`;
  }
  function pinHtml(p) {
    if (p.tier === 'small') {
      return `<button type="button" class="pin small" data-id="${p.id}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px" aria-pressed="false" aria-label="${esc(p.name)}, ${esc(p.kind)}, ${V[p.verdict.kind][1]}">${smallSvg(p.verdict.kind, KIND_ICON[p.kind] || 'food')}</button>`;
    }
    const sel = S.preview === p.id || S.place === p.id;
    return `<button type="button" class="pin ${S.hot === p.id ? 'hot' : ''}" data-id="${p.id}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px" aria-pressed="${sel}" aria-label="${esc(p.name)}, ${esc(p.kind)}, ${V[p.verdict.kind][1]}">${pinSvg(p)}</button>`;
  }
  function hot(id) { S.hot = id; $$('.pin').forEach(b => b.classList.toggle('hot', b.dataset.id === id)); }
  function hotCard(id, on) { const c = $(`.card[data-id="${id}"]`); if (c) c.style.borderColor = on ? 'var(--teal)' : ''; }

  // Pin → preview card (explore/PlacePreviewCard): a non-modal dialog by the pin.
  function renderPreview(focus) {
    const host = $('#previewhost'); if (!host) return;
    $$('.pin').forEach(b => b.setAttribute('aria-pressed', String(S.preview === b.dataset.id || S.place === b.dataset.id)));
    if (!S.preview) { host.innerHTML = ''; return; }
    const p = enrich(byId[S.preview]); const pin = $(`.pin[data-id="${p.id}"]`); if (!pin) { host.innerHTML = ''; return; }
    const s = RA.samples[p.id] || {}; const map = $('#map');
    const facts = keyFacts(p).slice(0, 3);
    host.innerHTML = `<div class="preview" role="dialog" aria-modal="false" aria-labelledby="pv-h" tabindex="-1" id="preview">
      <div class="head"><span class="thumb ${s.photos ? 'photo' : ''}" aria-hidden="true" style="width:56px;height:56px">${s.photos ? icon('photo') : placeIcon(p)}</span>
        <div style="flex:1;min-width:0"><h2 id="pv-h">${esc(p.name)}</h2><p class="small muted">${esc(p.kind)} · ${esc(p.area)} · ${walk(p.mins)}</p></div>
        <button type="button" class="iconbtn ghost" id="pv-close" aria-label="Close">${icon('close')}</button></div>
      <div style="margin-top:10px">${verdictPill(p.verdict.kind)}</div>
      ${facts.length ? `<ul class="facts" style="margin-top:10px;gap:6px;font-size:15px">${facts.map(f => `<li><span class="m ${f.m}" aria-hidden="true" style="width:20px;height:20px;min-width:20px;font-size:11px">${f.mark}</span><span><span class="sr-only">${f.sr} </span>${esc(f.text)} <span class="muted">${esc(f.src)}</span></span></li>`).join('')}</ul>`
        : `<p class="small" style="margin-top:10px">No info for your needs yet. <a href="#" data-toast="Answer 1 question: “Step-free way in?” Yes · No · Not sure">Answer 1 question</a></p>`}
      <div class="foot"><button type="button" class="btn sm" id="pv-details">See details</button><button type="button" class="btn ghost sm" aria-pressed="${S.saved.includes(p.id)}" data-save="${p.id}" aria-label="${S.saved.includes(p.id) ? 'Remove ' + esc(p.name) + ' from saved' : 'Save ' + esc(p.name)}">${icon('bookmark', 'sm')}${S.saved.includes(p.id) ? 'Saved' : 'Save'}</button></div></div>`;
    const card = $('#preview'); const pr = pin.getBoundingClientRect(), mr = map.getBoundingClientRect();
    const cw = 400, ch = card.offsetHeight || 220;
    let x = pr.left - mr.left + pr.width / 2 - cw / 2, y = pr.top - mr.top - ch - 10;
    if (y < 12) y = pr.bottom - mr.top + 10; x = Math.max(12, Math.min(mr.width - cw - 12, x));
    card.style.left = x + 'px'; card.style.top = y + 'px';
    const close = () => { S.preview = null; renderPreview(false); pin.focus(); };
    $('#pv-close').addEventListener('click', close);
    $('#pv-details').addEventListener('click', () => { const id = p.id; S.preview = null; renderPreview(false); openPlace(id, pin); });
    $('[data-save]', card).addEventListener('click', () => { toggleSave(p.id); renderPreview(true); });
    card.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    if (focus) card.focus();
  }
  function toggleSave(id) { const i = S.saved.indexOf(id); if (i >= 0) S.saved.splice(i, 1); else S.saved.push(id); toast(i >= 0 ? 'Removed from Saved' : 'Saved. It waits in Saved, on every device.'); }

  // ── Place details (phone order) ───────────────────────────────────────
  function keyFacts(p) {
    const tags = S.needs.flatMap(n => RA.needTags[n] || []);
    const s = RA.samples[p.id] || {}; const out = [];
    const uniq = [...new Set(tags)];
    uniq.forEach(tag => {
      const w = (s.works || []).find(f => f.tags.includes(tag)), b = (s.barriers || []).find(f => f.tags.includes(tag)), c = (s.check || []).find(f => f.tags.includes(tag));
      const meta = f => `${f.n} ${f.n === 1 ? 'review' : 'reviews'} · last one ${s.last} · sample`;
      if (b) out.push({ m: 'no', mark: '✗', sr: 'No:', text: b.s, src: meta(b) });
      else if (c) out.push({ m: 'mixed', mark: '!', sr: 'Check:', text: c.s, src: meta(c) });
      else if (w) out.push({ m: 'yes', mark: '✓', sr: 'Yes:', text: w.s, src: meta(w) });
      else if (tag === 'stepfree' && p.osm && OSM[p.osm]) out.push({ m: 'unc', mark: '?', sr: 'Not checked:', text: RA.featureLabel.stepfree, src: 'On OpenStreetMap · not checked' });
    });
    return out;
  }
  function detailsHtml(p0, mode) {
    const p = enrich(p0); const s = RA.samples[p.id] || {}; const k = p.verdict.kind;
    const sentence = { works: 'People with needs like yours say it worked.', check: 'Something to know before you go.', barrier: 'People with needs like yours hit a barrier here.', unknown: 'Nobody with your needs has reviewed this place yet.' }[k];
    const source = s.reviews ? `From ${s.reviews} community ${s.reviews === 1 ? 'review' : 'reviews'} (sample). Last checked ${s.last}.` : p.osm ? 'From OpenStreetMap only. Not checked by anyone yet.' : '';
    const facts = keyFacts(p);
    const saved = S.saved.includes(p.id);
    const actions = `<ul class="actions" aria-label="Actions for ${esc(p.name)}">
      <li><a class="action primary" href="#" data-toast="Opens Google Maps (Apple Maps on iOS) ${s.entrance ? 'to the step-free door' : 'to the street address'}" aria-label="Directions to ${esc(p.name)} (opens Google Maps)"><span class="ring" aria-hidden="true">${icon('directions')}</span>Directions</a></li>
      <li><button type="button" class="action" aria-pressed="${saved}" data-save="${p.id}" aria-label="${saved ? 'Remove ' + esc(p.name) + ' from saved' : 'Save ' + esc(p.name)}"><span class="ring" aria-hidden="true">${icon('bookmark')}</span>${saved ? 'Saved' : 'Save'}</button></li>
      ${p.phone ? `<li><a class="action" href="#" data-toast="Calls the venue" aria-label="Call ${esc(p.name)}"><span class="ring" aria-hidden="true">${icon('phone')}</span>Call</a></li>` : ''}
      ${p.website ? `<li><a class="action" href="#" data-toast="Opens the venue's website in a new tab" aria-label="${esc(p.name)} website (opens in a new tab)"><span class="ring" aria-hidden="true">${icon('globe')}</span>Website</a></li>` : ''}
      <li><button type="button" class="action" data-toast="Copies the public link /v/${p.id}" aria-label="Share ${esc(p.name)}"><span class="ring" aria-hidden="true">${icon('share')}</span>Share</button></li></ul>
      ${s.entrance ? `<p class="small" style="text-align:center;margin-top:6px">Directions go to the step-free door.</p>` : ''}`;
    const vcard = `<section class="vcard vk-${k}" aria-labelledby="v-h"><h2 id="v-h" class="sr-only">Does it work for you?</h2>${verdictPill(k, true)}
      <p class="sentence">${sentence}</p>${source ? `<p class="source">${source}</p>` : ''}
      <div class="row"><button type="button" class="btn outline sm" data-toast="Reads the summary aloud">${icon('speaker', 'sm')}Read aloud</button><a href="#" class="btn plain sm" data-toast="/how-it-works">How we decide</a></div>
      ${s.reviews ? `<div class="still"><span>Still right?</span><button type="button" class="btn ghost sm" data-toast="Thanks. We updated the date. Only reviews change the verdict.">Yes</button><button type="button" class="btn ghost sm" data-toast="Opens “Report a problem” (listing is wrong) or “Tell us how it was”">Something changed</button></div>` : ''}</section>`;
    const today = `${(s.today || []).map(t => `<div class="banner warn">${icon('warn')}<div><strong>${esc(t.text)}</strong><span class="small muted">${esc(t.when)} · sample</span><div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn ghost sm" data-toast="Thanks">Still there</button><button type="button" class="btn ghost sm" data-toast="Thanks">It’s fixed</button></div></div></div>`).join('')}
      <button type="button" class="btn outline full" data-toast="One dialog: what’s wrong today? It shows on ${esc(p.name)} for a day, then goes. It never changes the verdict." style="min-height:56px">${icon('warn', 'sm')}Report a problem today</button>`;
    const needsHtml = S.needs.length ? (facts.length ? `<ul class="facts">${facts.map(f => `<li><span class="m ${f.m}" aria-hidden="true">${f.mark}</span><span><span class="f"><span class="sr-only">${f.sr} </span>${esc(f.text)}</span><span class="src">${esc(f.src)}</span></span></li>`).join('')}</ul>` : `<p>Nobody has told us about this yet.</p>`) : `<a href="#" data-toast="Me → What I need">Set your needs to see what matters to you</a>`;
    const arrive = s.entrance ? `<div class="scard"><h3 class="h" style="font-size:17px;margin:0">${esc(s.entrance.kind)}: step-free</h3><p style="margin-top:4px">“${esc(s.entrance.note)}”</p><p class="small muted" style="margin:4px 0 12px">Marked by a ${esc(s.entrance.who)} · ${esc(s.entrance.date)} · sample</p>
        <div style="display:flex;flex-direction:column;gap:8px"><a class="btn full" href="#" data-toast="Opens Google Maps to the main door">${icon('directions', 'sm')}Directions to the main door</a><button type="button" class="btn ghost full" data-toast="Getting there screen: both doors, mini-map, parking and transport, steps from the street">More about getting there${icon('forward', 'sm')}</button></div></div>`
      : `<div class="scard"><p>Nobody has marked the step-free door yet. Directions go to the street address.</p><button type="button" class="btn ghost full" style="margin-top:12px" data-toast="Getting there screen">More about getting there${icon('forward', 'sm')}</button></div>`;
    const reviews = s.quote ? `<div class="scard filled"><p>“${esc(s.quote.text)}”</p><div class="byline"><span class="who">${esc(s.quote.who)}</span><span class="muted">${esc(s.quote.when)}</span><span class="sample">sample</span><button type="button" class="btn ghost sm" style="margin-left:auto" data-toast="Thanks — “Helped ${s.quote.helped + 1} people”">${icon('heart', 'sm')}This helped me (${s.quote.helped})</button></div></div>
        <button type="button" class="btn secondary full" style="margin-top:10px" data-toast="All ${s.reviews} reviews">Read all ${s.reviews} reviews</button>`
      : `<p>No reviews yet. Been here? Tell us how it was.</p>`;
    const more = [['photo', 'Photos', s.photos ? `${s.photos} photos` : 'None yet'], ['ear', 'Noise, light and crowds', 'Nothing yet'], ['list', 'What to expect, step by step', 'Nothing yet'], ['question', 'Ask about this place', ''], ['flag', 'What the venue says', 'Nothing yet'], ['info', 'Place details and corrections', 'OpenStreetMap']]
      .map(([ic, t, sum]) => `<details class="disc"><summary>${icon(ic)}${t}${sum ? `<span class="sum">${sum}</span>` : ''}${icon('down', 'sm chev')}</summary><div class="inner"><p class="muted">Nothing here yet.</p></div></details>`).join('');
    const tell = `<button type="button" class="btn lg full" data-toast="Review: 3 short steps — how was it → two questions for your needs → anything else" aria-label="Tell us how it was at ${esc(p.name)}">${icon('edit')}Tell us how it was</button>`;
    const subtitle = `${esc(p.kind)} · ${p.address ? esc(p.address) + ', ' : ''}${esc(p.area)} · ${walk(p.mins)}`;
    const sum = (facts) => { const y = facts.filter(f => f.m === 'yes').length, n = facts.filter(f => f.m === 'no').length, c = facts.filter(f => f.m === 'mixed' || f.m === 'unc').length; return [y && `${y} yes`, n && `${n} no`, c && `${c} to check`].filter(Boolean).join(' · ') || 'Nothing yet'; };

    if (mode === 'drawer') {
      // Option A: verdict + actions open; everything else is a disclosure whose summary carries the gist.
      const disc = (id, ic, title, summary, body, open = false) => `<details class="disc" ${open ? 'open' : ''}><summary>${icon(ic)}<span>${title}</span>${summary ? `<span class="sum">${summary}</span>` : ''}${icon('down', 'sm chev')}</summary><div class="inner">${body}</div></details>`;
      return `<div class="dhead"><div class="ttl"><h2 class="name" id="d-h" tabindex="-1">${esc(p.name)}<span class="dot" aria-hidden="true">.</span></h2><p class="subtitle">${subtitle}</p></div>
          <button type="button" class="iconbtn ghost" id="d-close" aria-label="Close ${esc(p.name)}">${icon('close')}</button></div>
        <div class="dbody">
          <div class="hero ${s.photos ? '' : 'none'}" aria-hidden="true">${s.photos ? `${s.photos} community photos (sample)` : 'No photos yet — add the first in a review'}</div>
          ${vcard}${actions}
          <div style="margin-top:16px">
            ${disc('today', 'clock', 'Today', s.today?.length ? `${s.today.length} report` : 'Nothing reported', today, !!s.today?.length)}
            ${disc('needs', 'user', 'For your needs', sum(facts), needsHtml, true)}
            ${disc('arrive', 'door', 'Getting there', s.entrance ? 'Step-free door marked' : 'No door marked yet', arrive)}
            ${disc('reviews', 'edit', `Reviews (${s.reviews || 0})`, s.quote ? `Newest ${s.quote.when}` : 'None yet', reviews)}
            ${disc('more', 'info', 'More about this place', '', more)}
          </div></div>
        <div class="bar">${tell}</div>`;
    }
    if (mode === 'page') {
      // Option B: two calm columns. Left: the phone order. Right: photo, mini-map, details, the one main action.
      return `<div class="wrap">
        <button type="button" class="back" id="p-back">${icon('back', 'sm')}Back to results</button>
        <div class="cols">
          <div>
            <h1 class="name" id="p-h" tabindex="-1">${esc(p.name)}<span class="dot" aria-hidden="true">.</span></h1><p class="subtitle">${subtitle}</p>
            ${vcard}${actions}
            <section class="sec" aria-labelledby="t-h"><h2 id="t-h">Today</h2>${today}</section>
            <section class="sec" aria-labelledby="n-h"><h2 id="n-h">For your needs</h2>${needsHtml}</section>
            <section class="sec" aria-labelledby="a-h"><h2 id="a-h">Getting there</h2>${arrive}</section>
            <section class="sec" aria-labelledby="r-h"><h2 id="r-h">Reviews (${s.reviews || 0})</h2>${reviews}</section>
            <section class="sec" aria-labelledby="m-h"><h2 id="m-h">More about this place</h2>${more}</section>
          </div>
          <aside class="side" aria-label="About this place">
            <div class="photo ${s.photos ? '' : 'none'}" aria-hidden="true">${s.photos ? `${s.photos} community photos (sample)` : 'No photos yet — add the first in a review'}</div>
            <div class="minimap" role="img" aria-label="Map: ${esc(p.name)} is ${walk(p.mins)} from Manly Wharf"><span class="me" aria-hidden="true">${pinSvg(p)}</span></div>
            <ul class="kv">
              <li>${icon('pin')}<span>${p.address ? esc(p.address) + ', ' : ''}${esc(p.area)} · ${walk(p.mins)} from Manly Wharf</span></li>
              ${p.phone ? `<li>${icon('phone')}<span>Phone listed · <a href="#" data-toast="Calls the venue">Call</a></span></li>` : ''}
              ${p.website ? `<li>${icon('globe')}<span><a href="#" data-toast="Opens the website">Website</a> <span class="muted">(opens in a new tab)</span></span></li>` : ''}
              <li>${icon('info')}<span class="muted">Place details from OpenStreetMap. <a href="#" data-toast="Wrong name or location? → Place details and corrections">Wrong name or location?</a></span></li>
            </ul>
            ${tell}
          </aside></div></div>`;
    }
    // Option C: the phone place page inside the panel (today's structure, cleaner).
    return `<div class="pad">
        <button type="button" class="back" id="c-back">${icon('back', 'sm')}Back to results</button>
        <h1 class="name" id="panel-h" tabindex="-1" style="margin-top:8px">${esc(p.name)}<span class="dot" aria-hidden="true">.</span></h1><p class="subtitle">${subtitle}</p>
        ${vcard}${actions}
        <section class="sec" aria-labelledby="t-h"><h2 id="t-h">Today</h2>${today}</section>
        <section class="sec" aria-labelledby="n-h"><h2 id="n-h">For your needs</h2>${needsHtml}</section>
        <section class="sec" aria-labelledby="a-h"><h2 id="a-h">Getting there</h2>${arrive}</section>
        <section class="sec" aria-labelledby="r-h"><h2 id="r-h">Reviews (${s.reviews || 0})</h2>${reviews}</section>
        <section class="sec" aria-labelledby="m-h"><h2 id="m-h">More about this place</h2>${more}</section>
      </div><div class="bar">${tell}</div>`;
  }
  function wireDetails(root) {
    $$('[data-save]', root).forEach(b => b.addEventListener('click', () => { toggleSave(b.dataset.save); renderDetails(); renderPanel(); }));
    $('#d-close', root)?.addEventListener('click', () => closePlace());
    $('#p-back', root)?.addEventListener('click', () => closePlace());
    $('#c-back', root)?.addEventListener('click', () => closePlace());
  }
  let opener = null;
  function openPlace(id, from) {
    opener = from || document.activeElement; S.place = id; S.preview = null;
    renderPanel(); renderDetails(true); renderMap();
  }
  function closePlace() {
    const id = S.place; S.place = null; renderDetails(); renderPanel(); renderMap();
    const back = $(`.card[data-id="${id}"]`) || $(`.pin[data-id="${id}"]`) || $('#panel-h');
    requestAnimationFrame(() => back?.focus());
  }
  function renderDetails(focus) {
    const p = S.place ? byId[S.place] : null;
    if (option === 'a') {
      const d = $('#drawer'); if (!p) { d.removeAttribute('open'); d.innerHTML = ''; return; }
      d.innerHTML = detailsHtml(p, 'drawer'); d.setAttribute('open', ''); wireDetails(d);
      d.onkeydown = e => { if (e.key === 'Escape') { e.stopPropagation(); closePlace(); } };
      if (focus) requestAnimationFrame(() => $('#d-h').focus());
    } else if (option === 'b') {
      const pg = $('#page'); if (!p) { pg.removeAttribute('open'); pg.innerHTML = ''; $('#filterbar').hidden = false; $('#panel').hidden = false; $('#map').hidden = false; return; }
      pg.innerHTML = detailsHtml(p, 'page'); pg.setAttribute('open', ''); wireDetails(pg); pg.scrollTop = 0; $('#filterbar').hidden = true; $('#panel').hidden = true; $('#map').hidden = true;
      if (focus) requestAnimationFrame(() => $('#p-h').focus());
    } else if (focus) {
      requestAnimationFrame(() => $('#panel-h').focus());
    }
  }

  // ── Live region, toast, demo toolbar ───────────────────────────────────
  function announce() { const r = results(); $('#live').textContent = S.searched ? `${r.list.length} ${r.label}. ${pageOf(r.list).length} on the map.` : ''; }
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => { t.textContent = ''; }, 3200); }
  function renderDemo() {
    const d = $('#demo'); if (!d) return;
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim() || '1';
    const qs = (o) => `${o}.html${location.search}`;
    d.innerHTML = `<span class="lab">Mockup</span>
      <a href="index.html">Options</a>
      <span class="sep">·</span>
      ${['a', 'b', 'c'].map(o => `<a href="${qs('option-' + o)}" ${o === option ? 'aria-current="page" style="background:#FAF9F6;color:#1A1A1A"' : ''}>${o.toUpperCase()}</a>`).join('')}
      <span class="sep">·</span><span class="lab">State</span>
      <button type="button" data-state="empty">Before search</button><button type="button" data-state="results">Results</button><button type="button" data-state="place">Place</button>
      <span class="sep">·</span><span class="lab">Text</span>
      ${['1', '1.5', '2'].map(s => `<button type="button" data-scale="${s}" aria-pressed="${scale === s}">${Math.round(+s * 100)} %</button>`).join('')}
      <span class="sep">·</span><span class="lab" id="vp"></span>`;
    $$('[data-state]', d).forEach(b => b.addEventListener('click', () => {
      const st = b.dataset.state; S.place = null; S.preview = null;
      if (st === 'empty') { S.searched = false; S.q = ''; S.cats = []; }
      if (st === 'results') { S.searched = true; S.q = 'cafe'; S.cats = []; S.page = 0; }
      if (st === 'place') { S.searched = true; S.q = 'cafe'; S.cats = []; S.page = 0; S.place = 'hugos-n458715841'; }
      renderAll(); renderDetails(false); renderMap();
    }));
    $$('[data-scale]', d).forEach(b => b.addEventListener('click', () => { document.documentElement.style.setProperty('--scale', b.dataset.scale); renderAll(); renderDetails(false); renderMap(); }));
    const vp = () => { const e = $('#vp'); if (e) e.textContent = `${innerWidth}×${innerHeight}`; }; vp(); addEventListener('resize', vp);
  }

  function renderAll() { renderTop(); renderChips(); renderPanel(); renderMap(); renderDemo(); }
  addEventListener('resize', () => renderMap());
  renderAll(); renderDetails(false); renderMap(); announce();
})();
