// English (Australia) — photos on reviews and the venue gallery. Keys 'photos.*'.
const photos = {
  'photos.kind.entrance': 'Entrance',
  'photos.kind.toilet': 'Toilet',
  'photos.kind.step': 'Step or ramp',
  'photos.kind.seating': 'Seating',
  'photos.kind.other': 'Something else',

  // venue gallery
  'photos.gallery.title': 'Photos from reviewers',
  'photos.gallery.description': { one: '{count} photo taken by people in the pilot, with a description.', other: '{count} photos taken by people in the pilot, each with a description.' },

  // review form
  'photos.add.title': 'Add photos',
  'photos.add.description': 'The entrance, a step, the toilet or seating help most. Up to {max}. We remove the location from your photos. Please avoid people’s faces.',
  'photos.add.first': 'Add a photo',
  'photos.add.another': 'Add another photo',
  'photos.add.full': '{max} photos added — the most for one review',
  'photos.card': 'Photo {n}',
  'photos.preparing': 'Preparing your photo…',
  'photos.uploading': 'Uploading…',
  'photos.retry': 'Try again',
  'photos.retryAria': 'Try uploading photo {n} again',
  'photos.remove': 'Remove',
  'photos.removeAria': 'Remove photo {n}',
  'photos.uploadFailed': 'Couldn’t upload this photo.',
  'photos.unreadable': 'That file isn’t a photo we can read.',
  'photos.whatShows': 'What does it show?',
  'photos.describe': 'Describe it for people who can’t see it',
  'photos.required': '(required)',
  'photos.describeSuggested': 'Suggested from your photo — check it’s right, then confirm or edit it.',
  'photos.describeLoading': 'Looking at your photo to suggest a description…',
  'photos.describeExample': 'e.g. “Two steps up to the front door of {name}, no handrail”',
  'photos.confirm': 'This description is right',
  'photos.suggestUnavailable': 'Suggestions aren’t available right now — write your own description.',
  'photos.suggestLimit': 'You’ve used today’s photo suggestions — write your own description.',
  'photos.suggests': 'Your photo suggests {answer}',
  'photos.useAnswer': 'Use this answer',
  'photos.useAnswerAria': 'Use the photo’s suggestion: {answer} for “{question}”',

  // announcements (screen readers)
  'photos.say.preparing': 'Preparing photo…',
  'photos.say.added': 'Photo added. Now describe it.',
  'photos.say.uploadFailed': 'Couldn’t upload that photo.',
  'photos.say.unreadable': 'Couldn’t read that photo.',
  'photos.say.removed': 'Photo removed.',
  'photos.say.ready': 'Suggestions ready from your photo: a description to check. Nothing is used until you confirm it.',
  'photos.say.readyAnswers': { one: 'Suggestions ready from your photo: a description to check, and an answer to {count} question below. Nothing is used until you confirm it.', other: 'Suggestions ready from your photo: a description to check, and answers to {count} questions below. Nothing is used until you confirm it.' },

  // who took it (viewer, story)
  'photos.by': 'From a review · {who} · {when}',
};

export default photos;
