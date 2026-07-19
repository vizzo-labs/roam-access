// Roam Access pilot v2 — sample data.
//
// Every venue is FICTIONAL — invented name, invented address. None of them is
// a real business and none of this is real accessibility information. Keep it
// that way: this ships on the live domain, and an invented access claim
// attached to a real, named business is a published claim about that business.

// ── Needs (first-person, as in the setup screen) ──────────────────────────
const RA2_NEEDS = [{
  id: 'mobility',
  label: 'I use a wheelchair or mobility aid',
  tags: ['stepfree', 'bathroom'],
  chip: 'Wheelchair access',
  short: 'wheelchair access'
}, {
  id: 'vision',
  label: "I'm blind or have low vision",
  tags: ['vision'],
  chip: 'Low vision friendly',
  short: 'vision support'
}, {
  id: 'hearing',
  label: "I'm deaf or hard of hearing",
  tags: ['hearing'],
  chip: 'Hearing support',
  short: 'hearing support'
}, {
  id: 'autism',
  label: "I'm autistic or sensory-sensitive",
  tags: ['quiet'],
  chip: 'Sensory-friendly',
  short: 'quiet spaces'
}, {
  id: 'cognitive',
  label: 'Easy-to-understand places help me',
  tags: ['simple'],
  chip: 'Easy to navigate',
  short: 'simple layouts'
}, {
  id: 'mental',
  label: 'Calm, low-stress places help me',
  tags: ['calm'],
  chip: 'Calm spaces',
  short: 'calm spaces'
}, {
  id: 'chronic',
  label: 'I need seats and rest spots (fatigue, pain)',
  tags: ['seats'],
  chip: 'Seats & rest spots',
  short: 'seating'
}];

// ── Venues ────────────────────────────────────────────────────────────────
// facts: works / check / barriers. `t` is the plain-language line, `s` a short
// form for result cards, `tags` say which needs the fact touches (empty tags =
// applies to everyone).
const RA2_VENUES = [{
  id: 'tin-whistle',
  name: 'Tin Whistle Coffee',
  kind: 'Cafe',
  cat: 'food',
  area: 'Surry Hills',
  mins: 5,
  coords: [0.44, 0.56],
  verified: 12,
  note: 'Quiet after 2pm',
  works: [{
    t: 'Roll straight in — no step, wide door',
    s: 'Step-free entry',
    tags: ['stepfree']
  }, {
    t: 'Accessible bathroom on the ground floor',
    s: 'Accessible bathroom',
    tags: ['bathroom']
  }, {
    t: 'Staff will read the menu aloud if you ask',
    s: 'Menu read aloud',
    tags: ['vision']
  }, {
    t: 'Quiet, calm space after 2pm',
    s: 'Quiet after 2pm',
    tags: ['quiet', 'calm']
  }, {
    t: 'Seats with backs, and a bench outside for a rest',
    s: 'Plenty of seating',
    tags: ['seats']
  }],
  check: [{
    t: 'Music can be loud before 2pm — ask staff to lower it',
    s: 'Loud before 2pm',
    tags: ['quiet']
  }, {
    t: 'No hearing loop at the counter',
    s: 'No hearing loop',
    tags: ['hearing']
  }],
  barriers: [],
  reviews: [{
    id: 'r1',
    who: 'Wheelchair user',
    tag: 'Wheelchair',
    when: '3 days ago',
    v: 'works',
    helpful: 4,
    text: 'Walked straight in — no step, wide enough for my chair. Loo is roomy too. Counter is a touch high but staff offered to help.'
  }, {
    id: 'r2',
    who: 'Hearing aid user',
    tag: 'Deaf',
    when: '1 week ago',
    v: 'check',
    helpful: 3,
    text: 'No loop at the counter, but staff were happy to write things down. Tables near the window are quietest.'
  }, {
    id: 'r3',
    who: 'Autistic person',
    tag: 'Autistic',
    when: '2 weeks ago',
    v: 'check',
    helpful: 6,
    text: 'After 2pm it is genuinely calm and lovely. Mornings can be overwhelming. They will turn the music down if you ask.'
  }, {
    id: 'r4',
    who: 'Blind person',
    tag: 'Blind / low vision',
    when: '3 weeks ago',
    v: 'works',
    helpful: 5,
    text: 'Staff read the specials to me without being asked twice. Layout is simple to learn — tables along the left wall.'
  }]
}, {
  id: 'copper-kettle',
  name: 'Copper Kettle Espresso',
  kind: 'Cafe',
  cat: 'food',
  area: 'Redfern',
  mins: 8,
  coords: [0.3, 0.3],
  verified: 9,
  note: 'Calm back room',
  works: [{
    t: 'Step-free entry from the laneway',
    s: 'Step-free entry',
    tags: ['stepfree']
  }, {
    t: 'Calm back room away from the machines',
    s: 'Calm back room',
    tags: ['quiet', 'calm']
  }, {
    t: 'Large-print menu at the counter',
    s: 'Large-print menu',
    tags: ['vision']
  }],
  check: [{
    t: 'Bathroom is standard size — accessible one is next door at the library',
    s: 'Bathroom next door',
    tags: ['bathroom']
  }],
  barriers: [],
  reviews: [{
    id: 'r1',
    who: 'Person with chronic illness',
    tag: 'Chronic illness',
    when: '5 days ago',
    v: 'works',
    helpful: 2,
    text: 'The back room is a lifesaver — soft chairs, no queue noise. Staff let me sit as long as I needed.'
  }]
}, {
  id: 'little-wren',
  name: 'Little Wren Coffee',
  kind: 'Cafe',
  cat: 'food',
  area: 'Chippendale',
  mins: 12,
  coords: [0.58, 0.22],
  verified: 4,
  note: 'Bathroom being verified',
  works: [{
    t: 'Wide entry with a gentle ramp',
    s: 'Ramped entry',
    tags: ['stepfree']
  }, {
    t: 'Courtyard is quiet on weekdays',
    s: 'Quiet courtyard',
    tags: ['quiet', 'calm']
  }],
  check: [{
    t: 'Bathroom not verified yet — 2 community members are checking',
    s: 'Bathroom not verified yet',
    tags: ['bathroom']
  }],
  barriers: [],
  reviews: []
}, {
  id: 'ironbark',
  name: 'Ironbark Roasters',
  kind: 'Cafe',
  cat: 'food',
  area: 'Surry Hills',
  mins: 10,
  coords: [0.24, 0.68],
  verified: 7,
  note: 'Step at entry',
  works: [{
    t: 'Staff are friendly and will bring orders to the door',
    s: 'Staff help at door',
    tags: []
  }],
  check: [{
    t: 'Very loud at peak times',
    s: 'Loud at peak',
    tags: ['quiet', 'calm']
  }],
  barriers: [{
    t: 'Step at the entry — about 15cm, no ramp',
    s: 'Step at entry',
    tags: ['stepfree']
  }, {
    t: 'Narrow doorway — under 76cm',
    s: 'Narrow doorway',
    tags: ['stepfree']
  }],
  reviews: [{
    id: 'r1',
    who: 'Wheelchair user',
    tag: 'Wheelchair',
    when: '1 month ago',
    v: 'barrier',
    helpful: 8,
    text: 'Could not get in. The step is too high and the doorway is narrow. Staff were kind about it, but the building is the building.'
  }]
}, {
  id: 'foundry',
  name: 'The Foundry Museum',
  kind: 'Museum',
  cat: 'arts',
  area: 'Ultimo',
  mins: 6,
  coords: [0.36, 0.4],
  verified: 22,
  note: 'Sensory mornings Sun 9–11am',
  works: [{
    t: 'Lifts to every floor, wide gallery aisles',
    s: 'Lifts everywhere',
    tags: ['stepfree']
  }, {
    t: 'Accessible bathrooms on all floors',
    s: 'Accessible bathrooms',
    tags: ['bathroom']
  }, {
    t: 'Audio guide and large-print labels throughout',
    s: 'Audio guide',
    tags: ['vision']
  }, {
    t: 'Captioned video and monthly Auslan tours',
    s: 'Auslan tours',
    tags: ['hearing']
  }, {
    t: 'Sensory mornings every Sunday 9–11am',
    s: 'Sensory mornings',
    tags: ['quiet']
  }, {
    t: 'Simple map, plenty of staff to ask',
    s: 'Easy to navigate',
    tags: ['simple']
  }, {
    t: 'Seats in every gallery',
    s: 'Seats throughout',
    tags: ['seats']
  }],
  check: [],
  barriers: [],
  reviews: [{
    id: 'r1',
    who: 'Parent of autistic child',
    tag: 'Autistic',
    when: '4 days ago',
    v: 'works',
    helpful: 9,
    text: 'Sunday sensory morning was the first museum trip we have finished in years. Lights low, no announcements, quiet room ready.'
  }, {
    id: 'r2',
    who: 'Wheelchair user',
    tag: 'Wheelchair',
    when: '2 weeks ago',
    v: 'works',
    helpful: 5,
    text: 'Every floor reachable, wide aisles, and the staff actually know where the lifts are. Rare.'
  }]
}, {
  id: 'harbour-playhouse',
  name: 'The Harbour Playhouse',
  kind: 'Theatre',
  cat: 'music',
  area: 'Dawes Point',
  mins: 15,
  coords: [0.62, 0.14],
  verified: 38,
  note: 'Audio described shows monthly',
  works: [{
    t: 'Lifts to all levels, wheelchair seats bookable online',
    s: 'Wheelchair seating',
    tags: ['stepfree']
  }, {
    t: 'Hearing loops in every hall',
    s: 'Hearing loops',
    tags: ['hearing']
  }, {
    t: 'Audio described performances monthly',
    s: 'Audio described',
    tags: ['vision']
  }, {
    t: 'Quiet room off the foyer',
    s: 'Quiet room',
    tags: ['quiet', 'calm']
  }],
  check: [{
    t: 'Foyer is crowded at interval — staff can seat you early',
    s: 'Crowded at interval',
    tags: ['quiet', 'calm']
  }],
  barriers: [],
  reviews: [{
    id: 'r1',
    who: 'Blind person',
    tag: 'Blind / low vision',
    when: '1 week ago',
    v: 'works',
    helpful: 7,
    text: 'Audio description was flawless and the pre-show touch tour made the set real for me. Booking was easy by phone.'
  }]
}, {
  id: 'salt-line',
  name: 'The Salt Line',
  kind: 'Bar',
  cat: 'food',
  area: 'Circular Quay',
  mins: 14,
  coords: [0.72, 0.48],
  verified: 14,
  note: 'Crowded at peak — go early',
  works: [{
    t: 'Step-free along the promenade',
    s: 'Step-free entry',
    tags: ['stepfree']
  }, {
    t: 'Accessible bathroom 50m away',
    s: 'Bathroom nearby',
    tags: ['bathroom']
  }],
  check: [{
    t: 'Very crowded and loud at peak hours — early evening is calmer',
    s: 'Crowded at peak',
    tags: ['quiet', 'calm']
  }, {
    t: 'Outdoor seating only — weather dependent',
    s: 'Outdoor only',
    tags: ['seats']
  }],
  barriers: [],
  reviews: []
}, {
  id: 'marigold',
  name: 'Hotel Marigold',
  kind: 'Hotel',
  cat: 'stay',
  area: 'Surry Hills',
  mins: 9,
  coords: [0.52, 0.66],
  verified: 9,
  note: 'Roll-in shower rooms on level 1',
  works: [{
    t: 'Accessible rooms with roll-in showers on level 1',
    s: 'Roll-in showers',
    tags: ['stepfree', 'bathroom']
  }, {
    t: 'Calm lobby, housekeeping on request only',
    s: 'Calm lobby',
    tags: ['calm', 'quiet']
  }, {
    t: 'Lift to all floors',
    s: 'Lift access',
    tags: ['stepfree', 'seats']
  }],
  check: [{
    t: 'Visual fire alarms in accessible rooms only — ask when booking',
    s: 'Ask about visual alarms',
    tags: ['hearing']
  }],
  barriers: [],
  reviews: []
}, {
  id: 'headland',
  name: 'Headland Wildlife Park',
  kind: 'Park',
  cat: 'parks',
  area: 'Mosman',
  mins: 25,
  coords: [0.78, 0.1],
  verified: 31,
  note: 'Sensory bags at entry',
  works: [{
    t: 'Sensory bags free at the entry gate',
    s: 'Sensory bags',
    tags: ['quiet']
  }, {
    t: 'Audio guide and touch encounters bookable',
    s: 'Touch encounters',
    tags: ['vision']
  }, {
    t: 'Captioned signs throughout',
    s: 'Captioned signs',
    tags: ['hearing']
  }, {
    t: 'Quiet spots along the rainforest walk',
    s: 'Quiet rainforest walk',
    tags: ['calm', 'quiet']
  }],
  check: [{
    t: 'Some paths are steep — the upper loop is hard work in a manual chair',
    s: 'Steep upper paths',
    tags: ['stepfree']
  }, {
    t: 'Long distances — scooter hire available at the gate',
    s: 'Long distances',
    tags: ['seats']
  }],
  barriers: [],
  reviews: []
}, {
  id: 'lyric',
  name: 'The Lyric Arcade',
  kind: 'Shopping',
  cat: 'arts',
  area: 'CBD',
  mins: 11,
  coords: [0.4, 0.2],
  verified: 19,
  note: 'Echoey at peak times',
  works: [{
    t: 'Lifts at both ends, smooth floors',
    s: 'Lift access',
    tags: ['stepfree']
  }, {
    t: 'Large-print maps at the info desk',
    s: 'Large-print maps',
    tags: ['vision']
  }, {
    t: 'Benches along the arcade',
    s: 'Seats throughout',
    tags: ['seats']
  }],
  check: [{
    t: 'Heritage layout can be confusing — staff at info desk help',
    s: 'Confusing layout',
    tags: ['simple']
  }, {
    t: 'Echoey acoustics, busy at lunchtime',
    s: 'Echoey at peak',
    tags: ['quiet', 'hearing']
  }],
  barriers: [],
  reviews: []
}];

// ── Browse tiles ──────────────────────────────────────────────────────────
const RA2_TILES = [{
  id: 'food',
  label: 'Food & drink',
  cats: ['food']
}, {
  id: 'parks',
  label: 'Parks & outdoors',
  cats: ['parks']
}, {
  id: 'arts',
  label: 'Arts & museums',
  cats: ['arts']
}, {
  id: 'music',
  label: 'Music & events',
  cats: ['music']
}];
const RA2_DEMO_QUERY = 'Find a quiet cafe with step-free entry near me';
const RA2_VOICE_EXAMPLES = ['“Cafes with accessible bathrooms”', '“Museums with Auslan tours”', '“Somewhere quiet for lunch”'];
const RA2_DEFAULT_STATS = {
  reviews: 12,
  helped: 38,
  votes: 214
};
Object.assign(window, {
  RA2_NEEDS,
  RA2_VENUES,
  RA2_TILES,
  RA2_DEMO_QUERY,
  RA2_VOICE_EXAMPLES,
  RA2_DEFAULT_STATS
});