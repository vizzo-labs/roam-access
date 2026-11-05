// The pre-arrival "my needs" card: plain, first-person sentences built from a
// tester's needs + their own note. Shared by the card screen (share via SMS,
// email, copy) and the venue dashboard (cards sent in-app). Never includes a
// name — the venue sees "a guest".

import { RA2_NEEDS, type NeedId } from './pilot-data';
import type { T } from './i18n/core';

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

/** A visit date ("2026-11-06") in any language; UTC so the day never shifts. */
export function formatVisitDateIn(iso: string | null | undefined, intl: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(intl, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

type CardInput = { needs: string[]; note?: string | null; visitOn?: string | null; venueName?: string | null };
// Without `lang` the card is English (what the venue dashboard shows). With
// it, the card is written in the tester's language (#21): `t` from useT() and
// the Intl locale for the date. The English sentences live here (CARD_LINES)
// and are re-used as the English dictionary entries (messages/en/card.ts).
type CardLang = { t: T; intl: string };

export function cardLines(input: CardInput, lang?: CardLang) {
  const lines: string[] = [];
  const t = lang?.t;
  const when = lang ? formatVisitDateIn(input.visitOn, lang.intl) : formatVisitDate(input.visitOn);
  const name = input.venueName || '';
  if (t) {
    lines.push(t(when ? (name ? 'card.text.helloPlaceOn' : 'card.text.helloOn') : (name ? 'card.text.helloPlace' : 'card.text.hello'), { place: name, date: when }));
    lines.push(t('card.text.helps'));
  } else {
    const where = name ? ` ${name}` : '';
    lines.push(when ? `Hello! I’m planning to visit${where} on ${when}.` : `Hello! I’m planning to visit${where} soon.`);
    lines.push('Here’s what helps me:');
  }
  for (const n of RA2_NEEDS) if (input.needs.includes(n.id)) lines.push(`• ${t ? t(`card.line.${n.id}`) : CARD_LINES[n.id]}`);
  const note = (input.note || '').trim();
  if (note) lines.push(`• ${note}`);
  lines.push(t ? t('card.text.thanks') : 'Thank you!');
  return lines;
}

export const cardText = (input: CardInput, lang?: CardLang) =>
  cardLines(input, lang).join('\n') + '\n\n' + (lang ? lang.t('card.text.footer') : '— sent with Roam Access');
