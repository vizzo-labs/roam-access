// Sample data for the Roam Access web prototype.
//
// Every venue here is FICTIONAL — invented name, invented street address. None
// of them is a real business, and none of this is real accessibility
// information. That is deliberate and must stay that way: this file is served
// from the live domain, and an invented access rating attached to a real,
// named business is a claim about that business. Keep the suburbs and the
// categories realistic; keep the venues made up.

const RA_CATEGORIES = [{
  id: 'mobility',
  title: 'Mobility',
  sub: 'Step-free, lifts, ramps, wide doorways'
}, {
  id: 'vision',
  title: 'Vision',
  sub: 'Braille, signage, lighting, screen-readers'
}, {
  id: 'hearing',
  title: 'Hearing',
  sub: 'Hearing loops, captions, low background noise'
}, {
  id: 'cognitive',
  title: 'Cognitive',
  sub: 'Plain signage, predictable layouts'
}, {
  id: 'mental',
  title: 'Mental health',
  sub: 'Quiet rooms, low-stimulation areas'
}, {
  id: 'autism',
  title: 'Autism / sensory',
  sub: 'Low lighting, quiet hours, sensory maps'
}, {
  id: 'chronic',
  title: 'Chronic illness',
  sub: 'Seating, rest areas, climate, food needs'
}];

// 8 invented venues across Sydney. Coords are arbitrary positions on the demo map.
const RA_VENUES = [{
  id: 'tin-whistle',
  name: 'Tin Whistle Coffee',
  kind: 'Cafe',
  area: 'Surry Hills',
  addr: '18 Cobbler Lane, Surry Hills NSW',
  coords: [0.36, 0.42],
  dist: '420m',
  verified: 12,
  cover: 'coffee · cafe interior',
  status: {
    mobility: 'accessible',
    vision: 'accessible',
    hearing: 'partial',
    cognitive: 'accessible',
    mental: 'unverified',
    autism: 'partial',
    chronic: 'accessible'
  },
  notes: {
    mobility: 'Step-free entry, wide aisles, accessible loo on premises',
    vision: 'High-contrast menu, well-lit, Braille on bathrooms',
    hearing: 'Hearing loop at counter; ambient noise can be high at peak',
    cognitive: 'Clear signage, predictable ordering flow',
    mental: 'No data yet — be the first to share',
    autism: 'Quiet hour Wed 9–11am. Music loud at peak',
    chronic: 'Seating available, dietary options labelled'
  },
  reviews: [{
    id: 'r1',
    who: 'Wheelchair user',
    when: '3 days ago',
    cat: 'mobility',
    rating: 'accessible',
    text: 'Walked straight in — no step, wide enough for my chair. Loo is roomy too. Counter is a touch high but staff offered to help.'
  }, {
    id: 'r2',
    who: 'Hearing aid user',
    when: '1 week ago',
    cat: 'hearing',
    rating: 'partial',
    text: 'Hearing loop at the counter is great. Tables further back get drowned out by the espresso machine — sit near the window.'
  }, {
    id: 'r3',
    who: 'Autistic person',
    when: '2 weeks ago',
    cat: 'autism',
    rating: 'partial',
    text: 'Wed 9–11am quiet hour is real and lovely. Other times can be overwhelming. They will turn music down if asked.'
  }]
}, {
  id: 'harbour-playhouse',
  name: 'The Harbour Playhouse',
  kind: 'Venue',
  area: 'Dawes Point',
  addr: '3 Lantern Wharf, Dawes Point NSW',
  coords: [0.62, 0.18],
  dist: '1.2km',
  verified: 38,
  cover: 'theatre exterior',
  status: {
    mobility: 'accessible',
    vision: 'accessible',
    hearing: 'accessible',
    cognitive: 'accessible',
    mental: 'partial',
    autism: 'partial',
    chronic: 'accessible'
  },
  notes: {
    mobility: 'Lifts to all public levels. Accessible bathrooms on every floor.',
    vision: 'Audio described performances bookable. Braille programs available.',
    hearing: 'Hearing loops in all performance halls. Captioned shows monthly.',
    cognitive: 'Pre-visit social stories on website. Staff briefed.',
    mental: 'Quiet rooms backstage on request',
    autism: 'Sensory performances run quarterly',
    chronic: 'Seating available throughout, climate controlled'
  },
  reviews: [{
    id: 'r1',
    who: 'Wheelchair user',
    when: '5 days ago',
    cat: 'mobility',
    rating: 'accessible',
    text: 'Truly accessible. Staff knew exactly where the accessible entrance and lifts were. Booking the wheelchair seat was simple.'
  }, {
    id: 'r2',
    who: 'Blind person',
    when: '2 weeks ago',
    cat: 'vision',
    rating: 'accessible',
    text: 'The audio described matinee was excellent, and the pre-show touch tour was a real treat. Will be back.'
  }]
}, {
  id: 'ironbark-roasters',
  name: 'Ironbark Roasters',
  kind: 'Cafe',
  area: 'Surry Hills',
  addr: '61 Marlowe Street, Surry Hills NSW',
  coords: [0.42, 0.55],
  dist: '650m',
  verified: 7,
  cover: 'industrial cafe',
  status: {
    mobility: 'notAccess',
    vision: 'partial',
    hearing: 'partial',
    cognitive: 'unverified',
    mental: 'unverified',
    autism: 'notAccess',
    chronic: 'partial'
  },
  notes: {
    mobility: 'Narrow doorway. Step at entry. No accessible loo on premises.',
    vision: 'Dim lighting at back. Menu printed small.',
    hearing: 'Very loud at peak. No hearing loop.',
    cognitive: 'No data yet',
    mental: 'No data yet',
    autism: 'High stimulation environment. No quiet hour.',
    chronic: 'Limited seating, can be busy'
  },
  reviews: [{
    id: 'r1',
    who: 'Wheelchair user',
    when: '1 month ago',
    cat: 'mobility',
    rating: 'notAccess',
    text: 'Could not get in. The step is too high and the doorway is narrow. Staff were kind about it, but the building is the building.'
  }]
}, {
  id: 'foundry-museum',
  name: 'The Foundry Museum',
  kind: 'Museum',
  area: 'Ultimo',
  addr: '2 Kiln Street, Ultimo NSW',
  coords: [0.22, 0.65],
  dist: '2.1km',
  verified: 22,
  cover: 'museum entrance',
  status: {
    mobility: 'accessible',
    vision: 'accessible',
    hearing: 'accessible',
    cognitive: 'accessible',
    mental: 'accessible',
    autism: 'accessible',
    chronic: 'accessible'
  },
  notes: {
    mobility: 'Lifts everywhere. Wide gallery aisles. Accessible loos on all floors.',
    vision: 'Audio guide. Large-print labels at every exhibit.',
    hearing: 'Captioned video throughout. Auslan tours monthly.',
    cognitive: 'Visual story PDF on website. Map is simple.',
    mental: 'Sensory rest zone near east entrance.',
    autism: 'Low-stimulation mornings every Sunday 9–11am.',
    chronic: 'Plenty of seating, cafe on site, climate controlled.'
  },
  reviews: []
}, {
  id: 'salt-line',
  name: 'The Salt Line',
  kind: 'Bar',
  area: 'Circular Quay',
  addr: 'Lower Promenade, Circular Quay NSW',
  coords: [0.65, 0.21],
  dist: '1.3km',
  verified: 14,
  cover: 'harbour bar',
  status: {
    mobility: 'accessible',
    vision: 'partial',
    hearing: 'partial',
    cognitive: 'accessible',
    mental: 'unverified',
    autism: 'notAccess',
    chronic: 'accessible'
  },
  notes: {
    mobility: 'Step-free along the promenade. Accessible loo nearby.',
    vision: 'Outdoor lighting variable',
    hearing: 'Open-air, ambient harbour noise',
    cognitive: 'Clear menu, simple ordering',
    mental: 'No data yet',
    autism: 'Crowded peak hours, music loud',
    chronic: 'Seating outdoors, weather dependent'
  },
  reviews: []
}, {
  id: 'hotel-marigold',
  name: 'Hotel Marigold',
  kind: 'Hotel',
  area: 'Surry Hills',
  addr: '9 Threadneedle Street, Surry Hills NSW',
  coords: [0.5, 0.6],
  dist: '900m',
  verified: 9,
  cover: 'boutique hotel',
  status: {
    mobility: 'accessible',
    vision: 'unverified',
    hearing: 'partial',
    cognitive: 'accessible',
    mental: 'accessible',
    autism: 'accessible',
    chronic: 'accessible'
  },
  notes: {
    mobility: 'Accessible rooms on level 1 with roll-in shower',
    vision: 'Standard signage, no Braille reported',
    hearing: 'Visual fire alarm in accessible rooms only',
    cognitive: 'Helpful front-desk staff, simple keycards',
    mental: 'Calm lobby, optional housekeeping',
    autism: 'Low-stimulation common spaces',
    chronic: 'Lift to all floors, in-room kettle and fridge'
  },
  reviews: []
}, {
  id: 'headland-wildlife',
  name: 'Headland Wildlife Park',
  kind: 'Park / attraction',
  area: 'Mosman',
  addr: 'Cliffside Road, Mosman NSW',
  coords: [0.78, 0.08],
  dist: '6.4km',
  verified: 31,
  cover: 'wildlife park path',
  status: {
    mobility: 'partial',
    vision: 'accessible',
    hearing: 'accessible',
    cognitive: 'accessible',
    mental: 'accessible',
    autism: 'accessible',
    chronic: 'partial'
  },
  notes: {
    mobility: 'Some steep paths. Manual wheelchairs may struggle on the upper loop.',
    vision: 'Touch encounters bookable. Audio guide available.',
    hearing: 'Captioned signage throughout',
    cognitive: 'Maps clear, plenty of staff',
    mental: 'Quiet spaces along the rainforest walk',
    autism: 'Sensory bags available at entry',
    chronic: 'Long distances; mobility scooter hire available'
  },
  reviews: []
}, {
  id: 'lyric-arcade',
  name: 'The Lyric Arcade',
  kind: 'Shopping',
  area: 'CBD',
  addr: '120 Verity Street, Sydney NSW',
  coords: [0.3, 0.32],
  dist: '1.6km',
  verified: 19,
  cover: 'heritage arcade',
  status: {
    mobility: 'accessible',
    vision: 'accessible',
    hearing: 'partial',
    cognitive: 'partial',
    mental: 'unverified',
    autism: 'partial',
    chronic: 'accessible'
  },
  notes: {
    mobility: 'Lifts at multiple points. Tile floors smooth.',
    vision: 'Generous lighting. Maps in large print at info desk.',
    hearing: 'No hearing loop reported',
    cognitive: 'Heritage layout can be confusing',
    mental: 'No data yet',
    autism: 'Echoey acoustics, busy at peak',
    chronic: 'Seating throughout, cafes for breaks'
  },
  reviews: []
}];
const RA_DEFAULT_USER = {
  signedIn: false,
  name: 'Naomi',
  email: 'naomi@example.com',
  initials: 'NA',
  city: 'Sydney',
  memberSince: 'May 2026',
  accessProfile: ['mobility', 'vision', 'autism'],
  // categories that matter
  livedExperience: 'wheelchair user',
  savedIds: ['harbour-playhouse', 'foundry-museum', 'hotel-marigold']
};
window.RA_CATEGORIES = RA_CATEGORIES;
window.RA_VENUES = RA_VENUES;
window.RA_DEFAULT_USER = RA_DEFAULT_USER;