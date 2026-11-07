// English (Australia) — facts about a place, built on the server from reviews
// (lib/venues.ts → Fact.i18n). Keys 'facts.*'. {what}/{label}/{where}/{who}/
// {need} are filled with other translated strings (data.*, trust.entrance.*).
const facts = {
  // short reasons: "Step-free entry — 3 reports"
  'facts.s.reports': { one: '{what} — {count} report', other: '{what} — {count} reports' },
  'facts.quick.all': { one: ' (quick answer)', other: ' (quick answers)' },
  'facts.quick.some': { one: ' ({count} by quick answer)', other: ' ({count} by quick answer)' },

  // the entrance
  'facts.t.stepsMainEntrance': 'Steps at the main entrance',
  'facts.s.stepMainAltEntrance': {
    one: 'Step at main entrance, step-free way in {where} — {count} report',
    other: 'Step at main entrance, step-free way in {where} — {count} reports',
  },
  'facts.t.noStepFreeAtAll': 'Steps at the entry, and no other step-free way in',
  'facts.s.noStepFree': { one: 'No step-free way in — {count} report', other: 'No step-free way in — {count} reports' },
  'facts.t.altEntrance': 'Step-free entrance {where}',

  // people disagree
  'facts.t.mixed': 'Mixed reports on {label}: {yes} yes, {no} no',
  'facts.s.mixed': 'Mixed: {label} — {yes} yes, {no} no',

  // overall experience, by lived experience
  'facts.t.exp.works': { one: '{count} {who} said it worked for them', other: '{count} {whoPlural} said it worked for them' },
  'facts.t.exp.check': { one: '{count} {who} managed, but with workarounds', other: '{count} {whoPlural} managed, but with workarounds' },
  'facts.t.exp.barrier': { one: '{count} {who} said it didn’t work for them', other: '{count} {whoPlural} said it didn’t work for them' },
  'facts.s.exp.works': { one: 'Worked for {need} — {count} person', other: 'Worked for {need} — {count} people' },
  'facts.s.exp.check': { one: 'Workarounds needed for {need} — {count} person', other: 'Workarounds needed for {need} — {count} people' },
  'facts.s.exp.barrier': { one: 'Didn’t work for {need} — {count} person', other: 'Didn’t work for {need} — {count} people' },

  // OpenStreetMap hints: ALWAYS "not yet confirmed" (honesty rule)
  'facts.t.osm.stepfree.yes': 'Listed as wheelchair accessible on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.stepfree.limited': 'Listed as partly wheelchair accessible on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.stepfree.no': 'Listed as not wheelchair accessible on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.bathroom.yes': 'Listed as having an accessible toilet on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.bathroom.limited': 'Listed as partly having an accessible toilet on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.bathroom.no': 'Listed as not having an accessible toilet on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.hearing.yes': 'Listed as having a hearing loop on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.hearing.limited': 'Listed as partly having a hearing loop on OpenStreetMap — not yet confirmed by the community',
  'facts.t.osm.hearing.no': 'Listed as not having a hearing loop on OpenStreetMap — not yet confirmed by the community',
  'facts.s.osm.stepfree.yes': 'Step-free on OpenStreetMap · not checked',
  'facts.s.osm.stepfree.limited': 'Partly step-free on OpenStreetMap · not checked',
  'facts.s.osm.stepfree.no': 'Not step-free on OpenStreetMap · not checked',
  'facts.s.osm.bathroom.yes': 'Accessible loo on OpenStreetMap · not checked',
  'facts.s.osm.bathroom.limited': 'Partly accessible loo on OpenStreetMap · not checked',
  'facts.s.osm.bathroom.no': 'No accessible loo on OpenStreetMap · not checked',
  'facts.s.osm.hearing.yes': 'Hearing loop on OpenStreetMap · not checked',
  'facts.s.osm.hearing.limited': 'Partial hearing loop on OpenStreetMap · not checked',
  'facts.s.osm.hearing.no': 'No hearing loop on OpenStreetMap · not checked',
};

export default facts;
