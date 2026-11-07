// Text helpers for how a person appears on reviews (Brief L). Always pass the
// `t` from useT(). The rules themselves live in lib/contributors/author.ts.
import { RA2_NEEDS } from '@/lib/pilot-data';
import { whoText } from '../trust/text';

export const REL_ICON = { lived: 'user', carer: 'users', ally: 'heart' };
export const RELATIONSHIPS = ['lived', 'carer', 'ally', 'unsaid'];
export const PUBLIC_NAME_MAX = 30;

/** Never chosen (accounts from before names): old anonymous display. */
export const isLegacy = pub => !pub || !pub.relationship;

/** "Sam K. · Lived experience · Wheelchair or mobility aid user" for my own
 *  settings (`pub`) and needs — what my reviews show. */
export function previewLine(t, pub, needs) {
  const ns = RA2_NEEDS.filter(n => (needs || []).includes(n.id));
  if (isLegacy(pub)) return ns[0] ? whoText(t, ns[0].id, ns.length - 1) : t('review.who.member');
  const name = !pub.postAnonymously && (pub.publicName || '').trim() ? pub.publicName.trim() : t('contrib.member');
  const parts = [name];
  if (pub.relationship && pub.relationship !== 'unsaid') parts.push(t(`contrib.rel.${pub.relationship}`));
  if (pub.showNeeds && ns[0]) parts.push(whoText(t, ns[0].id, ns.length - 1));
  return parts.join(' · ');
}

/** "Sam K." from Clerk's first/last name, else the setup name ("Jo Bloggs" → "Jo B."). */
export function suggestPublicName(first, last, fallback) {
  const clip = s => [...s].slice(0, PUBLIC_NAME_MAX).join('');
  const f = (first || '').trim(), l = (last || '').trim();
  if (f) return clip(l ? `${f} ${[...l][0].toUpperCase()}.` : f);
  const parts = (fallback || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return clip(parts.length > 1 ? `${parts[0]} ${[...parts[parts.length - 1]][0].toUpperCase()}.` : parts[0]);
}
