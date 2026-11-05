// English (Australia) — source strings for the 'community' namespace (F4:
// "Help fill the gaps" quick answers). Plain, first-person, short sentences;
// en-AU spelling. See lib/i18n/README.md.
const community = {
  // One plain question per access feature (lib/community/questions.ts mirrors these in English).
  'community.q.stepfree': 'Is there a step-free way in?',
  'community.q.bathroom': 'Is there an accessible bathroom?',
  'community.q.quiet': 'Is it usually quiet, not loud?',
  'community.q.calm': 'Is it calm, not hectic?',
  'community.q.seats': 'Are there seats and places to rest?',
  'community.q.hearing': 'Is there hearing support, like a hearing loop, captions or staff who write things down?',
  'community.q.vision': 'Is it good for low vision, with good lighting, large print or staff who help?',
  'community.q.simple': 'Is it easy to find your way around?',

  // Why this question, for this place
  'community.hint.unconfirmed.yes': 'OpenStreetMap says “yes”, but nobody has confirmed it yet.',
  'community.hint.unconfirmed.partly': 'OpenStreetMap says “partly”, but nobody has confirmed it yet.',
  'community.hint.unconfirmed.no': 'OpenStreetMap says “no”, but nobody has confirmed it yet.',
  'community.hint.none': 'Nobody has answered this yet.',
  'community.hint.mixed': 'People disagree so far: {yes} yes, {no} no.',
  'community.hint.one': 'Only one person has answered so far.',
  'community.helps': 'Helps {who}.',
  'community.helpsEveryone': 'Helps everyone.',

  // Home / Thanks prompt
  'community.prompt.overline': 'Help fill the gaps',
  'community.prompt.title': { one: '{count} place near you needs one quick answer', other: '{count} places near you need one quick answer' },
  'community.prompt.sub': 'Yes or no — one tap each. Only if you’ve been there.',

  // The screen
  'community.gaps.overline': 'Help fill the gaps',
  'community.gaps.loading': 'Finding places near you…',
  'community.gaps.error': 'Couldn’t load the questions',
  'community.gaps.nothing': 'Nothing needs an answer near you right now',
  'community.gaps.done': 'Done — thank you',
  'community.gaps.allForNow': 'That’s all for now',
  'community.gaps.intro': 'Only answer if you’ve been there. Each answer shows on the place as a “quick answer” and helps people with the same needs as you.',
  'community.gaps.event': 'Your answers count toward {event}.',
  'community.gaps.leaderboard': 'See the leaderboard',
  'community.gaps.questionOf': 'Question {n} of {total}',
  'community.gaps.placeLine': '{kind} · {walk} · {area}',
  'community.gaps.skip': 'Not sure — skip this one',
  'community.gaps.seeFirst': 'See {name} first',
  'community.gaps.saved': 'Saved: {answer} for {name}. Thank you.',
  'community.gaps.answerYes': 'yes',
  'community.gaps.answerNo': 'no',
  'community.gaps.live': { one: 'Your answer is live', other: 'Your {count} answers are live' },
  'community.gaps.noneNear': 'Every place within a 25-minute walk already has answers for your needs, or you’ve answered them. Been somewhere lately? A full review helps even more.',
  'community.gaps.more': 'Answer a few more',
  'community.gaps.backHome': 'Back to home',
};

export default community;
