// Beach access mode — seed items, each with its sources (checked 6 November
// 2026). Seeded once by migrations/202611060143_access_layers_seed.sql
// (ON CONFLICT DO NOTHING), then edited in /admin/layers. Re-generate the
// seed SQL with `npm run layers:import -- --sql`.
//
// Facts here are what the council / NPWS / Transport for NSW publish — shown
// as "Listed by …", never as community-confirmed.

import type { BeachDetails, FacilityKind } from './defs';

const COUNCIL_EQUIPMENT = { label: 'Northern Beaches Council — Inclusive infrastructure and equipment', url: 'https://www.northernbeaches.nsw.gov.au/services/disability/Inclusive-infrastructure-and-equipment' };
const OPEN_SPACE = { label: 'Open Space Bookings (council)', phone: '02 8495 5009' };
const portal = (assetId: number, label: string) => ({
  label, url: `https://bookings.northernbeaches.nsw.gov.au/#/facility-detail?Time=Any&AssetId=${assetId}&Attendees=0`,
});
const WHEELCHAIR = 'Free beach wheelchair for people with disability aged 5 and over, hired by a support person — book ahead';

export type BeachSeed = {
  id: string; kind: FacilityKind; name: string; suburb: string; address?: string;
  lat: number; lng: number; description: string; bookingUrl?: string; bookingPhone?: string;
  source: string; sourceUrl: string; sort: number; details: BeachDetails;
};

export const BEACH_SEED: BeachSeed[] = [
  {
    id: 'beach-manly', kind: 'beach', name: 'Manly Beach (South Steyne)', suburb: 'Manly', address: 'South Steyne',
    lat: -33.79856, lng: 151.28967, sort: 10,
    description: 'Patrolled all year. The beach wheelchair is kept at South Steyne.',
    bookingUrl: portal(5531, '').url, bookingPhone: OPEN_SPACE.phone,
    source: 'Northern Beaches Council', sourceUrl: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/manly-beach',
    details: {
      features: [
        WHEELCHAIR,
        'Accessible beach showers',
        'Accessible toilets and accessible parking',
        'Liberty Swing at the North Steyne playground',
        'MLAK key can be borrowed from the lifeguards',
      ],
      bookings: [portal(5531, 'Book the beach wheelchair — South Steyne'), OPEN_SPACE],
      mattingQuestion: true,
      sources: [
        { label: 'Northern Beaches Council — Manly Beach', url: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/manly-beach' },
        COUNCIL_EQUIPMENT,
        { label: 'Hello Manly — accessibility guide (MLAK from lifeguards)', url: 'https://hellomanly.com.au/?p=32200' },
      ],
    },
  },
  {
    id: 'beach-freshwater', kind: 'beach', name: 'Freshwater Beach', suburb: 'Freshwater',
    lat: -33.781573, lng: 151.290665, sort: 20,
    description: 'Free beach wheelchair, booked through the council.',
    bookingUrl: portal(6393, '').url, bookingPhone: OPEN_SPACE.phone,
    source: 'Northern Beaches Council', sourceUrl: COUNCIL_EQUIPMENT.url,
    details: {
      features: [WHEELCHAIR],
      bookings: [portal(6393, 'Book the beach wheelchair — Freshwater'), OPEN_SPACE],
      mattingQuestion: true,
      sources: [COUNCIL_EQUIPMENT],
    },
  },
  {
    id: 'beach-collaroy', kind: 'beach', name: 'Collaroy Beach', suburb: 'Collaroy',
    lat: -33.732822, lng: 151.302698, sort: 30,
    description: 'Two beach wheelchairs, a pool wheelchair for the rockpool, a ramp onto the sand and an adult lift-and-change room at the surf club.',
    bookingUrl: portal(5532, '').url, bookingPhone: OPEN_SPACE.phone,
    source: 'Northern Beaches Council', sourceUrl: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/collaroy-beach',
    details: {
      features: [
        `${WHEELCHAIR} (2 chairs)`,
        'Pool wheelchair for Collaroy Rockpool — book ahead',
        'Ramp onto the beach',
        'Accessible toilet (MLAK)',
        'Adult lift-and-change room at Collaroy Surf Life Saving Club',
        'Liberty Swing at Bruce Bartlett Reserve',
      ],
      bookings: [
        portal(5532, 'Book beach wheelchair 1 — Collaroy'),
        portal(6313, 'Book beach wheelchair 2 — Collaroy'),
        portal(5530, 'Book the pool wheelchair — Collaroy Rockpool'),
        OPEN_SPACE,
      ],
      mattingQuestion: true,
      sources: [
        { label: 'Northern Beaches Council — Collaroy Beach', url: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/collaroy-beach' },
        { label: 'Council media release — Collaroy beach now more accessible', url: 'https://www.northernbeaches.nsw.gov.au/council/news/media-releases/collaroy-beach-now-more-accessible-all' },
        COUNCIL_EQUIPMENT,
      ],
    },
  },
  {
    id: 'beach-newport', kind: 'beach', name: 'Newport Beach', suburb: 'Newport',
    lat: -33.653879, lng: 151.3229, sort: 40,
    description: 'Free beach wheelchair, booked through Newport Surf Club.',
    bookingUrl: 'https://newportsurfclub.com.au/contact',
    source: 'Northern Beaches Council', sourceUrl: COUNCIL_EQUIPMENT.url,
    details: {
      features: [WHEELCHAIR],
      bookings: [{ label: 'Contact Newport Surf Club to book', url: 'https://newportsurfclub.com.au/contact' }],
      mattingQuestion: true,
      sources: [COUNCIL_EQUIPMENT],
    },
  },
  {
    id: 'beach-bilgola', kind: 'beach', name: 'Bilgola Beach', suburb: 'Bilgola Beach',
    lat: -33.646329, lng: 151.326816, sort: 50,
    description: 'Free beach wheelchair, booked through Bilgola Surf Club.',
    bookingUrl: 'https://bilgolaslsc.org.au/contact',
    source: 'Northern Beaches Council', sourceUrl: COUNCIL_EQUIPMENT.url,
    details: {
      features: [WHEELCHAIR],
      bookings: [{ label: 'Contact Bilgola Surf Club to book', url: 'https://bilgolaslsc.org.au/contact' }],
      mattingQuestion: true,
      sources: [COUNCIL_EQUIPMENT],
    },
  },
  {
    id: 'swing-north-steyne', kind: 'liberty_swing', name: 'Liberty Swing — North Steyne playground', suburb: 'Manly', address: 'North Steyne',
    lat: -33.793688, lng: 151.287181, sort: 60,
    description: 'Inclusive playground with a Liberty Swing for wheelchair users. The swing unlocks with an MLAK key.',
    source: 'Northern Beaches Council', sourceUrl: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/north-steyne-major',
    details: {
      features: ['Liberty Swing (wheelchair swing)', 'Unlocks with an MLAK key'],
      sources: [
        { label: 'Northern Beaches Council — North Steyne Major', url: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/north-steyne-major' },
        COUNCIL_EQUIPMENT,
      ],
    },
  },
  {
    id: 'swing-baranbali', kind: 'liberty_swing', name: 'Liberty Swing — Baranbali Park', suburb: 'Seaforth',
    lat: -33.789063, lng: 151.243219, sort: 70,
    description: 'Inclusive playground with a Liberty Swing. The swing unlocks with an MLAK key.',
    source: 'Northern Beaches Council', sourceUrl: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/baranbali-park',
    details: {
      features: ['Liberty Swing (wheelchair swing)', 'Unlocks with an MLAK key'],
      sources: [
        { label: 'Northern Beaches Council — Baranbali Park', url: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/baranbali-park' },
        COUNCIL_EQUIPMENT,
      ],
    },
  },
  {
    id: 'swing-bruce-bartlett', kind: 'liberty_swing', name: 'Liberty Swing — Bruce Bartlett Reserve', suburb: 'Collaroy',
    lat: -33.733972, lng: 151.302268, sort: 80,
    description: 'Inclusive playground beside Collaroy Beach with a Liberty Swing. The swing unlocks with an MLAK key.',
    source: 'Northern Beaches Council', sourceUrl: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/bruce-bartlett-reserve',
    details: {
      features: ['Liberty Swing (wheelchair swing)', 'Unlocks with an MLAK key'],
      sources: [
        { label: 'Northern Beaches Council — Bruce Bartlett Reserve', url: 'https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/bruce-bartlett-reserve' },
        COUNCIL_EQUIPMENT,
      ],
    },
  },
  {
    id: 'ferry-manly-wharf', kind: 'ferry', name: 'Manly Wharf — ferry ramp', suburb: 'Manly', address: 'East Esplanade',
    lat: -33.799842, lng: 151.284387, sort: 90,
    description: 'Transport for NSW says ferry wharf ramps get steeper at low tide and you may need help. Ask the crew, or travel nearer high tide.',
    source: 'Transport for NSW', sourceUrl: 'https://transportnsw.info/travel-info/accessible-travel/accessible-ferry-travel',
    details: {
      features: ['Ramp gradient changes with the tide — steeper at low tide', 'Crew can help you on and off'],
      lowTideNote: true,
      sources: [{ label: 'Transport for NSW — Accessible ferry travel', url: 'https://transportnsw.info/travel-info/accessible-travel/accessible-ferry-travel' }],
    },
  },
  {
    id: 'walk-fairfax', kind: 'walk', name: 'Fairfax Walk, North Head', suburb: 'North Head', address: 'North Head Scenic Drive',
    lat: -33.821009, lng: 151.299769, sort: 100,
    description: 'A 1 km paved loop to the Fairfax lookouts, listed by NSW National Parks as Grade 1 and wheelchair accessible.',
    source: 'NSW National Parks and Wildlife Service', sourceUrl: 'https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-walk',
    details: {
      features: ['1 km loop', 'Paved, Grade 1', 'Listed as wheelchair accessible'],
      sources: [{ label: 'NSW National Parks — Fairfax Walk', url: 'https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-walk' }],
    },
  },
];
