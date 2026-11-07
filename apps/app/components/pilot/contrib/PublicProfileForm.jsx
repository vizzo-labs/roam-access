'use client';

import React from 'react';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { Card, CheckRow, ChoiceGroup, RADIUS, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { previewLine, PUBLIC_NAME_MAX, RELATIONSHIPS } from './authorText';

// "How I appear on reviews" (Brief L) — used in setup (step 3) and in
// Me → How I appear on reviews. Controlled: `value` is
// { publicName, postAnonymously, relationship, showNeeds }.
// - Name shown on your reviews (default: first name + last initial), or
//   "Post anonymously" → "Roam Access member".
// - Which describes you? (self-described).
// - A separate, explicit opt-in to show access needs — never pre-ticked.
// - A live preview of the byline, and that reviews are public.
function PublicProfileForm({ value, onChange, needs, nameError, idBase = 'pub' }) {
  const t = useT();
  const set = partial => onChange({ ...value, ...partial });
  const preview = previewLine(t, { ...value, relationship: value.relationship || 'unsaid' }, needs);
  const named = !value.postAnonymously && !!(value.publicName || '').trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
      <div>
        <label htmlFor={`${idBase}-name`} style={{ ...TYPE.headline, display: 'block', marginBottom: 4, color: C2.char }}>
          {t('contrib.form.name.label')}
        </label>
        <p id={`${idBase}-name-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.xs}px` }}>{t('contrib.form.name.hint')}</p>
        <input id={`${idBase}-name`} value={value.publicName || ''} maxLength={PUBLIC_NAME_MAX}
          onChange={e => set({ publicName: e.target.value })} disabled={value.postAnonymously}
          autoComplete="nickname" placeholder={t('contrib.form.name.placeholder')}
          aria-describedby={`${idBase}-name-hint${nameError ? ` ${idBase}-name-err` : ''}`} aria-invalid={nameError ? true : undefined}
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 56, borderRadius: RADIUS.lg, padding: '0 16px',
            border: `1.5px solid ${nameError ? C2.red : C2.slate}`, fontSize: RA2_INPUT_FONT + 1, fontFamily: F2,
            color: C2.char, background: value.postAnonymously ? C2.stone : C2.paper,
          }}/>
        {nameError && <p id={`${idBase}-name-err`} style={{ ...TYPE.footnote, color: C2.red, fontWeight: 600, margin: '6px 0 0' }}>{nameError}</p>}
        <CheckRow style={{ marginTop: SPACE.xs }} checked={value.postAnonymously} onChange={on => set({ postAnonymously: on })}
          label={t('contrib.form.anon.label')} hint={t('contrib.form.anon.hint')}/>
      </div>

      <ChoiceGroup legend={t('contrib.form.rel.legend')} hint={t('contrib.form.rel.hint')} name={`${idBase}-rel`}
        value={value.relationship} onChange={rel => set({ relationship: rel })}
        options={RELATIONSHIPS.map(r => ({ value: r, label: t(`contrib.form.rel.${r}`), sub: t(`contrib.form.rel.${r}.sub`) }))}/>

      <CheckRow checked={value.showNeeds} onChange={on => set({ showNeeds: on })}
        label={t('contrib.form.needs.label')} hint={t('contrib.form.needs.hint')}/>

      <Card variant="filled" as="section" aria-labelledby={`${idBase}-preview-h`}>
        <h2 id={`${idBase}-preview-h`} style={{ ...TYPE.overline, color: C2.slate, margin: '0 0 6px' }}>{t('contrib.form.preview')}</h2>
        <p style={{ ...TYPE.headline, color: C2.teal, margin: '0 0 6px', overflowWrap: 'anywhere' }}>{preview}</p>
        <p style={{ ...TYPE.footnote, color: C2.char, margin: 0 }}>
          {named ? t('contrib.form.public.named') : t('contrib.form.public.anon')}
        </p>
      </Card>
    </div>
  );
}

/** The value to start the form with: saved choices, else the suggestion. */
function initialPublic(pub, suggestion) {
  const chosen = !!pub?.relationship;
  return {
    // Once chosen, never re-suggest: a name an admin cleared must not come back.
    publicName: chosen ? pub.publicName ?? '' : suggestion ?? '',
    postAnonymously: chosen ? !!pub.postAnonymously : false,
    relationship: chosen ? pub.relationship : null,
    showNeeds: chosen ? !!pub.showNeeds : false,
  };
}

/** null when it can be saved, else the message for the name field. */
function publicError(t, v) {
  return !v.postAnonymously && !(v.publicName || '').trim() ? t('contrib.form.name.required') : null;
}

export { PublicProfileForm, initialPublic, publicError };
