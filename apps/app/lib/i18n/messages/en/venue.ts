// English (Australia) — the place screen: summary, actions, community voice,
// "Venue says", footer links, read aloud. Keys 'venue.*'.
const venue = {
  'venue.subtitleAddress': '{address}, {area}',
  'venue.summary': 'Summary',
  'venue.howWeDecide': 'How we decide verdicts',

  // the lead sentence under the verdict
  'venue.from.reviews': { one: '{count} community review', other: '{count} community reviews' },
  'venue.from.quick': { one: '{count} quick answer', other: '{count} quick answers' },
  'venue.from.both': '{reviews} and {quick}',
  'venue.lead.works': 'What works for your needs, from {from}.',
  'venue.lead.check': 'Things to know before you go, from {from}.',
  'venue.lead.checkNone': 'Not yet confirmed by anyone in the pilot. Check before you go — then tell us how it was.',
  'venue.lead.barrier': 'People in the pilot have flagged real barriers here, from {from}.',
  'venue.lead.unknown': 'Nobody with your access needs has reviewed this place yet. Your visit could be the first data point.',

  // actions
  'venue.actions': 'Actions for {name}',
  'venue.action.directions': 'Directions',
  'venue.action.directionsAria': 'Directions to {name} (opens Google Maps)',
  'venue.action.call': 'Call',
  'venue.action.callAria': 'Call {name}',
  'venue.action.website': 'Website',
  'venue.action.websiteAria': '{name} website (opens in a new tab)',
  'venue.action.save': 'Save',
  'venue.action.saved': 'Saved',
  'venue.action.saveAria': 'Save {name}',
  'venue.action.unsaveAria': 'Remove {name} from saved',
  'venue.action.share': 'Share',
  'venue.action.shareAria': 'Share {name}',
  'venue.shareTitle': '{name} · Roam Access',
  'venue.shareText': 'Access information for {name}',
  'venue.shareCopied': 'Link copied — paste it anywhere to share this place.',
  'venue.writeReview': 'Share your experience',
  'venue.writeFirst': 'Be the first to review',

  // community voice
  'venue.community.title': 'From the community',
  'venue.community.count': { one: '{count} review from people in the pilot', other: '{count} reviews from people in the pilot' },
  'venue.community.none': 'No reviews yet',
  'venue.community.readAll': 'Read all',
  'venue.community.readAllAria': { one: 'Read the {count} review of {name}', other: 'Read all {count} reviews of {name}' },
  'venue.community.loading': 'Loading reviews…',
  'venue.community.empty': 'Been here? One tap tells people with the same needs whether it worked for you.',
  'venue.shareSummary': 'Share or print this place’s access summary',

  // read aloud
  'venue.read.what': 'the summary for {name}',
  'venue.read.place': '{name}.',
  'venue.read.verdict': 'Verdict: {verdict}.',
  'venue.read.barriers': 'Barriers: {list}.',
  'venue.read.works': 'What works: {list}.',
  'venue.read.checks': 'Check before you go: {list}.',

  // Venue says — kept apart from community facts; never changes the verdict
  'venue.says.badge': 'Venue says',
  'venue.says.title': 'From the venue',
  'venue.says.byline': 'Written by {name}, updated {when}. Not checked by the community — it doesn’t change the verdict.',
  'venue.says.reply': 'Reply from {name} · {when}',
  'venue.says.sendCard': 'Send my needs card to {name}',
  'venue.footer.from': 'Place details from',
  'venue.footer.osm': 'OpenStreetMap',
  'venue.footer.wrong': 'Wrong name, address or location?',
  'venue.footer.suggest': 'Suggest a correction on OpenStreetMap',
  'venue.footer.access': 'Access problems? Say so in your review.',
  'venue.footer.how': 'How Roam Access works',
  'venue.footer.claim': 'Is this your business? Claim it — it’s free',
};

export default venue;
