// The pre-arrival "my needs" card: plain, first-person sentences built from a
// tester's needs + their own note. Shared by the card screen (share via SMS,
// email, copy) and the venue dashboard (cards sent in-app). Never includes a
// name — the venue sees "a guest".

import { RA2_NEEDS, type NeedId } from './pilot-data';

export const CARD_LINES: Record<NeedId, string> = {
  mobility:  'I use a wheelchair or mobility aid. I need a step-free way in, room to move, and an accessible toilet if you have one.',
  vision:    'I’m blind or have low vision. Please tell me who you are when you greet me, and offer to read the menu or signs.',
  hearing:   'I’m deaf or hard of hearing. Please face me when you talk, and write things down if I ask.',
  autism:    'I’m autistic or sensory-sensitive. A quieter spot, away from speakers and bright lights, helps me a lot.',
  cognitive: 'Clear, simple information helps me. Please use plain words and give me one thing at a time.',
  mental:    'Calm, low-stress places help me. A quiet table and a little patience go a long way.',
  chronic:   'I live with fatigue or pain. I need somewhere to sit, and I may need to rest.',
};

export const NOTE_MAX = 500;

export function formatVisitDate(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function cardLines(input: { needs: string[]; note?: string | null; visitOn?: string | null; venueName?: string | null }) {
  const lines: string[] = [];
  const when = formatVisitDate(input.visitOn);
  const where = input.venueName ? ` ${input.venueName}` : '';
  lines.push(when ? `Hello! I’m planning to visit${where} on ${when}.` : `Hello! I’m planning to visit${where} soon.`);
  lines.push('Here’s what helps me:');
  for (const n of RA2_NEEDS) if (input.needs.includes(n.id)) lines.push(`• ${CARD_LINES[n.id]}`);
  const note = (input.note || '').trim();
  if (note) lines.push(`• ${note}`);
  lines.push('Thank you!');
  return lines;
}

export const cardText = (input: Parameters<typeof cardLines>[0]) =>
  cardLines(input).join('\n') + '\n\n— sent with Roam Access';
