// English (Australia) — source strings for the 'arrival' namespace (Getting
// there, I1: the step-free entrance and directions to it). Plain, first-person,
// short sentences; en-AU spelling. See lib/i18n/README.md.
// Entrances tell people which door to use; they never change a verdict.
const arrival = {
  'arrival.title': 'Getting there',

  // Kinds of door. `chip` = the answer in the form; `title` = a heading;
  // `short` = inside "Directions to the step-free entrance ({short})";
  // `enter` = the one line on the map card.
  'arrival.kind.main.chip': 'Main entrance',
  'arrival.kind.main.title': 'Step-free main entrance',
  'arrival.kind.main.short': 'main door',
  'arrival.kind.main.enter': 'Enter by the main door',
  'arrival.kind.side.chip': 'At the side',
  'arrival.kind.side.title': 'Step-free entrance at the side',
  'arrival.kind.side.short': 'side',
  'arrival.kind.side.enter': 'Enter at the side',
  'arrival.kind.back.chip': 'At the back',
  'arrival.kind.back.title': 'Step-free entrance at the back',
  'arrival.kind.back.short': 'back',
  'arrival.kind.back.enter': 'Enter at the back',
  'arrival.kind.lift.chip': 'Via a lift',
  'arrival.kind.lift.title': 'Step-free way in via a lift',
  'arrival.kind.lift.short': 'lift',
  'arrival.kind.lift.enter': 'Enter via the lift',
  'arrival.kind.other.chip': 'Another door',
  'arrival.kind.other.title': 'Step-free entrance through another door',
  'arrival.kind.other.short': 'another door',
  'arrival.kind.other.enter': 'Enter through another door',

  // Compass points, inside "About 35 m south-west of the street address".
  'arrival.compass.n': 'north',
  'arrival.compass.ne': 'north-east',
  'arrival.compass.e': 'east',
  'arrival.compass.se': 'south-east',
  'arrival.compass.s': 'south',
  'arrival.compass.sw': 'south-west',
  'arrival.compass.w': 'west',
  'arrival.compass.nw': 'north-west',

  // Where a pin is, in words.
  'arrival.pin.atAddress': 'On the street address',
  'arrival.pin.fromAddress': 'About {m} m {dir} of the street address',
  'arrival.pin.notMoved': 'The pin is on the street address. Drag it to the entrance, tap the map, or use the buttons below.',
  'arrival.pin.tooFar': 'That’s more than {max} m from this place. Put the pin closer.',
  'arrival.pin.reset': 'Put the pin back',
  'arrival.pin.resetDone': 'The pin is back on the street address.',
  'arrival.pin.move': 'Move the pin:',
  'arrival.pin.moveGroup': 'Move the entrance pin',
  'arrival.pin.moveN': 'Move the pin {m} metres north',
  'arrival.pin.moveS': 'Move the pin {m} metres south',
  'arrival.pin.moveE': 'Move the pin {m} metres east',
  'arrival.pin.moveW': 'Move the pin {m} metres west',
  'arrival.notOnMap': 'Not on the map yet — described in words only.',

  // The review form.
  'arrival.mark.open': 'Show where the step-free entrance is',
  'arrival.mark.title': 'Show people where this entrance is',
  'arrival.mark.hint': 'Map apps send people to the street address. Put the pin on the step-free door and Roam Access will send them there.',
  'arrival.mark.kind': 'Which door is it?',
  'arrival.mark.describe': 'Describe where it is',
  'arrival.mark.describeHint': 'You can do this instead of using the map.',
  'arrival.mark.placeholder': 'e.g. Ramp at the back, via the car park',
  'arrival.mark.orDescribe': 'No map? Describe where it is in the “Where?” box above.',
  'arrival.photo.title': 'Photo of this entrance',
  'arrival.photo.add': 'Add a photo of this entrance',

  // "Use my current location".
  'arrival.gps.use': 'Use my current location',
  'arrival.gps.finding': 'Finding you…',
  'arrival.gps.done': 'The pin is where you are. We only save this point, not where you go.',
  'arrival.gps.rough': 'Your location is only accurate to about {m} m. Check the pin and move it if you need to.',
  'arrival.gps.far': 'You seem to be about {m} m away from this place. Move the pin by hand instead.',
  'arrival.gps.denied': 'Location is turned off for this site. Move the pin by hand, or describe where it is.',
  'arrival.gps.failed': 'We couldn’t find your location. Move the pin by hand, or describe where it is.',
  'arrival.gps.unavailable': 'This browser can’t share your location. Move the pin by hand, or describe where it is.',

  // The mini-map.
  'arrival.map.editLabel': 'Map for placing the entrance pin at {name}',
  'arrival.map.viewLabel': 'Map of {name} with its street address and step-free entrance.',
  'arrival.map.canvas': 'Map. Use the arrow keys to move the map.',
  'arrival.map.key': 'Map key',
  'arrival.map.keyAddress': 'Street address',
  'arrival.map.keyEntrance': 'Step-free entrance',
  'arrival.map.keyUnconfirmed': 'Not confirmed or may have changed',
  'arrival.map.failed': 'The map didn’t load. The entrance is described below.',
  'arrival.map.credit': 'Map data',

  // Source and recency.
  'arrival.source.marked': '{who} · marked {date}',
  'arrival.source.confirmed': { one: 'Still the way in for 1 more person · {date}', other: 'Still the way in for {count} more people · latest {date}' },
  'arrival.source.osm': 'From OpenStreetMap — not yet confirmed by anyone here.',
  'arrival.changed.title': 'This may have changed',
  'arrival.changed.body': 'Someone said this way in changed on {date}. Directions go to the street address until someone says it’s still the way in.',

  // "Still the way in?"
  'arrival.still.question': 'Still the way in?',
  'arrival.still.yes': 'Yes',
  'arrival.still.changed': 'Changed',
  'arrival.still.yesAria': 'Yes, the {door} is still the way in',
  'arrival.still.changedAria': 'The {door} has changed',
  'arrival.still.youSaidYes': '(you said yes)',
  'arrival.still.youSaidChanged': '(you said it changed)',
  'arrival.still.mine': 'You marked this entrance. Thank you.',
  'arrival.still.thanksYes': 'Thanks — that helps the next person find the door.',
  'arrival.still.thanksChanged': 'Thanks. Directions now go to the street address. Can you tell people what’s different?',
  'arrival.still.review': 'Write a review',
  'arrival.still.failed': 'That didn’t save. Please try again.',

  // Nobody has marked one yet.
  'arrival.none.description': 'Which door to use, and directions to it.',
  'arrival.none.body': 'Nobody has marked the step-free entrance yet. Map apps take you to the street address.',
  'arrival.none.mark': 'Mark the entrance',
  'arrival.none.markAria': 'Mark the step-free entrance at {name} in a review',

  // Directions.
  'arrival.dir.toEntrance': 'Directions to the step-free entrance ({where})',
  'arrival.dir.toAddress': 'Directions to the street address',
  'arrival.dir.toEntranceAria': 'Directions to the step-free entrance of {name} ({where}), opens {app}',
  'arrival.dir.toAddressAria': 'Directions to the street address of {name}, opens {app}',
  'arrival.dir.caption': 'Directions go to the step-free entrance ({where}) in {app}.',
  'arrival.app.label': 'Open directions in',
  'arrival.app.apple': 'Apple Maps',
  'arrival.app.google': 'Google Maps',

  // The map card line when the door may have changed.
  'arrival.line.changed': 'Entrance may have changed — check first',

  // Getting there 4 (I4): entrance kinds on the mini-map.
  'arrival.kind.main.map': 'Main',
  'arrival.kind.side.map': 'Side',
  'arrival.kind.back.map': 'Back',
  'arrival.kind.lift.map': 'Lift',
  'arrival.kind.other.map': 'Other',
  'arrival.map.keyItemDashed': '{door} (dashed: not confirmed or may have changed)',
  'arrival.map.viewLabelMany': { one: 'Map of {name} with its street address and {count} step-free entrance.', other: 'Map of {name} with its street address and {count} step-free entrances.' },
  'arrival.map.pinDesc': '{door}: {where}.',
};
export default arrival;
