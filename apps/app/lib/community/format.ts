// en-AU date/time wording for mapping days, always in Sydney time.
const TZ = 'Australia/Sydney';

const day = (d: Date) => d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const time = (d: Date) => d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }).replace(/\s+/g, ' ');

/** "Saturday 21 November 2026, 9:30 am to 12:30 pm" */
export function eventWhen(e: { startsAt: Date; endsAt: Date }) {
  const a = day(e.startsAt), b = day(e.endsAt);
  return a === b ? `${a}, ${time(e.startsAt)} to ${time(e.endsAt)}` : `${a}, ${time(e.startsAt)} to ${b}, ${time(e.endsAt)}`;
}

export const STATUS_WORD = { upcoming: 'Coming up', live: 'On now', ended: 'Finished' } as const;
