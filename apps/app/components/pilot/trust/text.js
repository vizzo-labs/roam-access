// Translated text for server-built data (#21): facts, reviews, photos.
// Always pass the `t` (and `fmt`) from useT()/useFormat().
import { textOf } from '@/lib/trust/text';

/** A fact's full sentence / short reason in the reader's language. */
export const factText = (t, f) => textOf(t, f.i18n?.t) ?? f.t;
export const factShort = (t, f) => textOf(t, f.i18n?.s) ?? f.s;

/** "Wheelchair or mobility aid user (+1)" / "Community member". */
export function whoText(t, whoNeed, whoMore, fallback) {
  if (!whoNeed) return fallback && whoNeed === undefined ? fallback : t('review.who.member');
  const who = t(`data.need.${whoNeed}.who`);
  return whoMore ? t('review.who.needMore', { who, more: whoMore }) : t('review.who.need', { who });
}

/** The author line as text: legacy reviews keep "Wheelchair user"; chosen
 *  ones read "Sam K. · Lived experience · Wheelchair user" (needs only with
 *  consent — the server leaves them out otherwise). See contrib/ReviewAuthor. */
export function reviewWho(t, r) {
  const a = r.author;
  if (!a || a.legacy) return whoText(t, r.whoNeed, r.whoMore, r.who);
  const parts = [a.name || t('contrib.member')];
  if (a.rel) parts.push(t(`contrib.rel.${a.rel}`));
  if (r.whoNeed) parts.push(whoText(t, r.whoNeed, r.whoMore));
  return parts.join(' · ');
}
/** The reviewer's own words, or the translated default for their verdict. */
export const reviewText = (t, r) => (r.own === false && r.textKey ? t(r.textKey) : r.text);
export const reviewWhen = (fmt, r) => (r.at ? fmt.ago(r.at) : r.when);

/** "✓ Step-free entry · ✗ No accessible loo · Quiet · Usually quiet: before 10am" */
export function reviewItems(t, fmt, r) {
  if (!r.items) return r.details ? [{ ok: null, text: r.details }] : [];
  return r.items.map(it => {
    let text = it.slots
      ? t('review.item.quietTimes', { list: fmt.list(it.slots.map(s => t(`review.item.slot.${s}`))) })
      : textOf(t, it.text);
    if (it.quote) text += ` (“${it.quote}”)`;
    return { ok: it.ok, text, own: !!it.quote };
  });
}

/** A photo with its kind, who and when in the reader's language — for
 *  PhotoGrid / PhotoViewer and the What-to-expect story. */
export function localPhoto(t, fmt, p) {
  return {
    ...p,
    kindLabel: t(`photos.kind.${p.kind}`),
    who: whoText(t, p.whoNeed, p.whoMore, p.who),
    when: p.at ? fmt.ago(p.at) : p.when,
  };
}
