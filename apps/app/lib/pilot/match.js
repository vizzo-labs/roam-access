// Match engine and query parsing — pure functions, no React.

import { RA2_NEEDS } from '@/lib/pilot-data';

// ── Match engine ──────────────────────────────────────────────────────────
function ra2NeedTags(needIds) {
  return RA2_NEEDS.filter(n => needIds.includes(n.id)).flatMap(n => n.tags);
}

// One verdict per venue, personalised. A fact with no tags applies to
// everyone; with needs set, only facts touching those needs count — that
// personalisation is the product's whole thesis (a step doesn't stop a deaf
// user; loud music doesn't stop a wheelchair user).
function ra2Verdict(venue, needIds) {
  const tags = ra2NeedTags(needIds);
  const relevant = list => tags.length
    ? list.filter(f => f.tags.length === 0 || f.tags.some(t => tags.includes(t)))
    : list;
  const barriers = relevant(venue.barriers);
  const checks = relevant(venue.check);
  const works = relevant(venue.works);
  // Nothing known that touches this person's needs → say so. Claiming
  // "works for you" on zero information would betray the product's one promise.
  if (!barriers.length && !checks.length && !works.length) {
    return { kind: 'unknown', why: 'No info for your needs yet — help us verify it', barriers, checks, works };
  }
  const kind = barriers.length ? 'barrier' : checks.length ? 'check' : 'works';
  const why = (kind === 'barrier' ? barriers : kind === 'check' ? [...checks, ...works] : works)
    .slice(0, 3).map(f => f.s).join(' · ');
  return { kind, why, barriers, checks, works };
}

// ── Query parsing (voice + text) ──────────────────────────────────────────
const RA2_CAT_WORDS = {
  food:  /\b(cafes?|coffee|espresso|restaurants?|lunch|dinner|breakfast|brunch|eat|food|drinks?|bars?|pubs?|pizza|seafood|fish|gelato|ice[- ]?cream|bakery|bakeries|takeaway|burgers?)\b/,
  parks: /\b(parks?|outdoors?|walks?|gardens?|wildlife|zoo|beach(es)?|nature|pools?|swim\w*|ocean|reserves?)\b/,
  arts:  /\b(museums?|galler(y|ies)|arts?|exhibits?|librar(y|ies)|cultur\w*)\b/,
  music: /\b(music|gigs?|concerts?|shows?|events?|theatres?|venues?|plays?)\b/,
  stay:  /\b(hotels?|stay|accommodation)\b/,
};
const RA2_TAG_WORDS = {
  stepfree: /\b(step[- ]?free|wheelchairs?|ramps?|no steps?|roll in|accessible entry|mobility)\b/,
  bathroom: /\b(bathrooms?|toilets?|loos?|restrooms?)\b/,
  quiet:    /\b(quiet|low[- ]?stim\w*|sensory|peaceful|not (too )?loud)\b/,
  calm:     /\b(calm|relax\w*|low[- ]?stress|chill)\b/,
  hearing:  /\b(hearing|loops?|auslan|deaf|captions?|captioned)\b/,
  vision:   /\b(blind|low vision|braille|audio[- ]?descri\w*|guide dogs?|large[- ]?print)\b/,
  seats:    /\b(seats?|seating|rest spots?|sit down|benches|fatigue)\b/,
  simple:   /\b(easy to (understand|navigate)|simple|clear signage)\b/,
};
const RA2_CAT_LABEL = {
  food: 'cafes & food', parks: 'parks & beaches', arts: 'arts & culture',
  music: 'shows & venues', stay: 'places to stay',
};
const RA2_TAG_LABEL = {
  stepfree: 'step-free', bathroom: 'accessible bathroom', hearing: 'hearing support',
  vision: 'vision support', seats: 'seating', simple: 'easy to navigate', calm: 'calm',
};

// Phrases whose words would otherwise read as categories: "show me…" is not
// a show, "a quiet room" is not a hotel, "park the car" is not a park.
const RA2_NOISE = /\b(show me|can you show|(where|somewhere|place|can i|to) park( my| the)?( car)?|parking|(can'?t|cannot|not) walk( far| much)?)\b/g;

function ra2ParseQuery(text) {
  const t = (text || '').toLowerCase().replace(RA2_NOISE, ' ');
  const cats = Object.keys(RA2_CAT_WORDS).filter(c => RA2_CAT_WORDS[c].test(t));
  const tags = Object.keys(RA2_TAG_WORDS).filter(k => RA2_TAG_WORDS[k].test(t));
  let label;
  if (!cats.length && !tags.length) {
    label = text ? `“${text.length > 42 ? text.slice(0, 42) + '…' : text}”` : 'All places';
  } else {
    const quiet = tags.includes('quiet');
    const catWord = cats.length ? cats.map(c => RA2_CAT_LABEL[c]).join(' & ') : 'places';
    const extras = tags.filter(x => x !== 'quiet' && x !== 'calm').map(x => RA2_TAG_LABEL[x]);
    label = `${quiet ? 'Quiet ' : ''}${catWord}${extras.length ? ', ' + extras.join(', ') : ''}`;
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }
  return { cats, tags, label, raw: text };
}

function ra2Search(venues, query, needIds) {
  const { cats, tags } = query || { cats: [], tags: [] };
  const rank = { works: 3, check: 2, unknown: 1, barrier: 0 };
  return venues
    .filter(v => !cats.length || cats.includes(v.cat))
    .map(v => {
      const verdict = ra2Verdict(v, needIds);
      const all = [...v.works, ...v.check];
      const tagHits = tags.filter(tag => all.some(f => f.tags.includes(tag))).length;
      return { ...v, verdict, score: rank[verdict.kind] * 10 + tagHits * 2 - v.mins / 60 };
    })
    .sort((a, b) => b.score - a.score);
}

export { ra2NeedTags, ra2Verdict, RA2_CAT_WORDS, RA2_TAG_WORDS, RA2_CAT_LABEL, RA2_TAG_LABEL, RA2_NOISE, ra2ParseQuery, ra2Search };
