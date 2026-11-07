// Who wrote a review — the one place that decides what a reader may see.
//
// Rules (Brief L, AGENTS.md → Honesty rules):
// - A person who has never chosen (relationship NULL — every account from
//   before this feature, until they act) keeps the old display: their lived
//   experience from the review's needs snapshot ("Wheelchair user"), no name.
// - Once chosen: their public name, or "Roam Access member" when they post
//   anonymously (or an admin cleared the name); their self-described
//   relationship (lived · carer · ally, nothing for "prefer not to say"); and
//   their access needs ONLY if they opted in (show_needs). Without that opt-in
//   the needs never leave the server — not in the review, its photos, the
//   entrance it marked or arrival steps — so a filter can't reveal them either.
// - Only a named person has a profile link (public_id, never the Clerk id).
import type { Relationship } from '../db/schema';
import type { ReviewVM } from '../venues';
import { RA2_NEEDS } from '../pilot-data';

export const RELATIONSHIPS: Relationship[] = ['lived', 'carer', 'ally', 'unsaid'];
/** The ones shown on a review (and offered as review filters). */
export const SHOWN_RELATIONSHIPS = ['lived', 'carer', 'ally'] as const;
export type ShownRelationship = typeof SHOWN_RELATIONSHIPS[number];

export const PUBLIC_NAME_MAX = 30;
/** People who joined before this date are founding members (Sydney time). */
export const FOUNDING_BEFORE = new Date('2027-03-01T00:00:00+11:00');

export type AuthorRow = {
  publicName: string | null; postAnonymously: boolean; relationship: Relationship | null;
  showNeeds: boolean; publicId: string;
};

/** What a reader may see about an author. `legacy`: never chosen (old display). */
export type ReviewAuthor = {
  legacy: boolean;
  name: string | null;          // null → "Roam Access member" (or legacy)
  publicId: string | null;      // only with a name
  rel: ShownRelationship | null;
  showNeeds: boolean;           // the review's needs may be shown
};

export function authorOf(a: AuthorRow | null | undefined): ReviewAuthor {
  if (!a || !a.relationship) return { legacy: true, name: null, publicId: null, rel: null, showNeeds: true };
  const name = !a.postAnonymously && a.publicName?.trim() ? a.publicName.trim() : null;
  return {
    legacy: false, name, publicId: name ? a.publicId : null,
    rel: (SHOWN_RELATIONSHIPS as readonly string[]).includes(a.relationship) ? a.relationship as ShownRelationship : null,
    showNeeds: a.showNeeds,
  };
}

/** True when this person's reviews may show their needs. */
export const needsVisible = (a: AuthorRow | null | undefined) => authorOf(a).showNeeds;

/** Clean a public name: one line, no control characters, ≤ 30 characters. */
export function cleanPublicName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const s = raw.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, '').replace(/\s+/g, ' ').trim();
  return s ? [...s].slice(0, PUBLIC_NAME_MAX).join('') : null;
}

/** The default: first name plus last initial ("Sam K."), or the name given in setup. */
export function suggestPublicName(first?: string | null, last?: string | null, fallback?: string | null) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (f) return cleanPublicName(l ? `${f} ${[...l][0].toUpperCase()}.` : f) ?? '';
  const parts = (fallback || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return cleanPublicName(parts.length > 1 ? `${parts[0]} ${[...parts[parts.length - 1]][0].toUpperCase()}.` : parts[0]) ?? '';
}

export type AuthoredReviewVM = ReviewVM & {
  author: ReturnType<typeof authorOf>; thanks: number; thankedByMe: boolean;
};

/** A review as a reader may see it: the author line, and needs only with consent. */
export function withAuthor(vm: ReviewVM, row: AuthorRow | null | undefined, thanks = 0, thankedByMe = false): AuthoredReviewVM {
  const base = authorOf(row);
  if (base.legacy) return { ...vm, author: base, thanks, thankedByMe };
  // The relationship the review was WRITTEN as (a carer's review stays a
  // carer's review if they later change it); older reviews use the current one.
  const rel = vm.writtenAs ? (vm.writtenAs === 'unsaid' ? null : vm.writtenAs) : base.rel;
  const author = { ...base, rel };
  const needs = author.showNeeds ? RA2_NEEDS.filter(n => vm.needs.includes(n.id)) : [];
  const parts = [
    author.name ?? 'Roam Access member',
    author.rel ? { lived: 'Lived experience', carer: 'Carer', ally: 'Ally' }[author.rel] : null,
    needs[0] ? needs[0].who + (needs.length > 1 ? ` (+${needs.length - 1})` : '') : null,
  ].filter(Boolean);
  return {
    ...vm,
    who: parts.join(' · '),
    needs: needs.map(n => n.id), filters: needs.map(n => n.filter),
    whoNeed: needs[0]?.id ?? null, whoMore: Math.max(0, needs.length - 1),
    author, thanks, thankedByMe,
  };
}
