// Shared by server (view models) and client (screens). Plain data only.

export type NeedId = 'mobility' | 'vision' | 'hearing' | 'autism' | 'cognitive' | 'mental' | 'chronic';
export type FeatureId = 'stepfree' | 'bathroom' | 'vision' | 'hearing' | 'quiet' | 'calm' | 'seats' | 'simple';
export type VerdictKind = 'works' | 'check' | 'barrier';
export type Cat = 'food' | 'parks' | 'arts' | 'music' | 'stay';

// First-person needs, as in the setup screen. `tags` = which access features
// matter to that need — the personalisation the whole product rests on.
export const RA2_NEEDS: {
  id: NeedId; label: string; tags: FeatureId[]; chip: string; short: string;
  who: string; whoPlural: string; filter: string;
}[] = [
  { id: 'mobility',  label: 'I use a wheelchair or mobility aid',          tags: ['stepfree', 'bathroom'], chip: 'Wheelchair access',   short: 'wheelchair access', who: 'Wheelchair or mobility aid user', whoPlural: 'wheelchair or mobility aid users', filter: 'Wheelchair' },
  { id: 'vision',    label: "I'm blind or have low vision",                tags: ['vision'],               chip: 'Low vision friendly', short: 'vision support',    who: 'Blind / low-vision person',       whoPlural: 'blind or low-vision people',       filter: 'Blind / low vision' },
  { id: 'hearing',   label: "I'm deaf or hard of hearing",                 tags: ['hearing'],              chip: 'Hearing support',     short: 'hearing support',   who: 'Deaf / hard-of-hearing person',   whoPlural: 'deaf or hard-of-hearing people',   filter: 'Deaf' },
  { id: 'autism',    label: "I'm autistic or sensory-sensitive",           tags: ['quiet'],                chip: 'Sensory-friendly',    short: 'quiet spaces',      who: 'Autistic / sensory-sensitive person', whoPlural: 'autistic or sensory-sensitive people', filter: 'Autistic' },
  { id: 'cognitive', label: 'Easy-to-understand places help me',           tags: ['simple'],               chip: 'Easy to navigate',    short: 'simple layouts',    who: 'Person who needs simple layouts', whoPlural: 'people who need simple layouts',   filter: 'Easy to understand' },
  { id: 'mental',    label: 'Calm, low-stress places help me',             tags: ['calm'],                 chip: 'Calm spaces',         short: 'calm spaces',       who: 'Person who needs calm spaces',    whoPlural: 'people who need calm spaces',      filter: 'Calm' },
  { id: 'chronic',   label: 'I need seats and rest spots (fatigue, pain)', tags: ['seats'],                chip: 'Seats & rest spots',  short: 'seating',           who: 'Person with chronic illness',     whoPlural: 'people with chronic illness',      filter: 'Chronic illness' },
];
export const NEED_IDS = RA2_NEEDS.map(n => n.id);

// What a reviewer can tell us beyond the 1-tap verdict. `noSeverity` decides
// how a majority "no" counts: a step stops a wheelchair user (barrier); most
// other gaps are worth knowing before you go (check).
export const RA2_FEATURES: {
  id: FeatureId; question: string; yes: string; yesShort: string; no: string; noShort: string;
  noSeverity: 'barrier' | 'check'; label: string;
}[] = [
  { id: 'stepfree', question: 'Step-free way in?',              yes: 'Step-free way in',                     yesShort: 'Step-free entry',      no: 'Steps at the entry',                  noShort: 'Step at entry',         noSeverity: 'barrier', label: 'step-free access' },
  { id: 'bathroom', question: 'Accessible bathroom?',           yes: 'Accessible bathroom',                  yesShort: 'Accessible bathroom',  no: 'No accessible bathroom',              noShort: 'No accessible loo',     noSeverity: 'check',   label: 'the bathroom' },
  { id: 'quiet',    question: 'Quiet enough?',                  yes: 'Quiet, low-noise space',               yesShort: 'Quiet',                no: 'Can get loud',                        noShort: 'Can be loud',           noSeverity: 'check',   label: 'noise' },
  { id: 'calm',     question: 'Calm, not hectic?',              yes: 'Calm, relaxed atmosphere',             yesShort: 'Calm',                 no: 'Busy and hectic at times',            noShort: 'Can be hectic',         noSeverity: 'check',   label: 'atmosphere' },
  { id: 'seats',    question: 'Seats and rest spots?',          yes: 'Plenty of seats and rest spots',       yesShort: 'Plenty of seating',    no: 'Few places to sit or rest',           noShort: 'Few seats',             noSeverity: 'check',   label: 'seating' },
  { id: 'hearing',  question: 'Hearing support (loop, captions, staff who write things down)?', yes: 'Hearing support available', yesShort: 'Hearing support', no: 'No hearing support', noShort: 'No hearing support', noSeverity: 'check', label: 'hearing support' },
  { id: 'vision',   question: 'Good for low vision (lighting, large print, help)?',             yes: 'Low-vision friendly',       yesShort: 'Low-vision friendly', no: 'Hard going with low vision', noShort: 'Hard for low vision', noSeverity: 'check', label: 'vision support' },
  { id: 'simple',   question: 'Easy to find your way around?',  yes: 'Easy to find your way around',         yesShort: 'Easy to navigate',     no: 'Confusing layout',                    noShort: 'Confusing layout',      noSeverity: 'check',   label: 'layout' },
];
export const FEATURE_IDS = RA2_FEATURES.map(f => f.id);

export const RA2_TILES: { id: Cat; label: string; cats: Cat[] }[] = [
  { id: 'food',  label: 'Food & drink',     cats: ['food'] },
  { id: 'parks', label: 'Parks & beaches',  cats: ['parks'] },
  { id: 'arts',  label: 'Arts & culture',   cats: ['arts', 'music'] },
  { id: 'stay',  label: 'Places to stay',   cats: ['stay'] },
];

export const RA2_VOICE_EXAMPLES = [
  '“Cafes with accessible bathrooms”',
  '“A quiet place for lunch”',
  '“Step-free beach access”',
];

// The pilot area. Distances are measured from here until a tester shares
// their location.
export const PILOT_AREA = {
  name: 'Manly & surrounds',
  origin: { name: 'Manly Wharf', lat: -33.8003, lng: 151.2843 },
};
