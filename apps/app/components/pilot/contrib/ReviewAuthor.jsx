'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Badge, Icon, TYPE } from '../ds';
import { useT } from '../i18n';
import { reviewWho, whoText } from '../trust/text';
import { REL_ICON } from './authorText';

// Who wrote a review (Brief L), as a byline:
//   Sam K. [👤 Lived experience · self-described] Wheelchair or mobility aid user
// - Reviews by people who haven't chosen yet keep the old line ("Wheelchair user").
// - The name links to /u/<public_id> only when the person shows a name.
// - The relationship is a badge with an icon AND words (never colour alone),
//   always marked "self-described".
// - Needs appear only when the server sent them (the author opted in).
function ReviewAuthor({ r, style }) {
  const t = useT();
  const a = r.author;
  const strong = { fontSize: 15, fontWeight: 700, color: C2.teal, fontFamily: F2 };
  if (!a || a.legacy) return <span style={{ ...strong, ...style }}>{reviewWho(t, r)}</span>;
  const name = a.name || t('contrib.member');
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 8px', minWidth: 0, ...style }}>
      {a.publicId ? (
        <a href={`/u/${encodeURIComponent(a.publicId)}`} title={t('contrib.profileLink', { name })}
          style={{ ...strong, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          {name}
        </a>
      ) : (
        <span style={{ ...strong, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C2.slate }}><Icon name="user" size={16}/></span>{name}
        </span>
      )}
      {a.rel && (
        <Badge size="sm" tone={a.rel === 'ally' ? 'neutral' : 'teal'} icon={REL_ICON[a.rel]}>
          {t(`contrib.rel.${a.rel}`)}
          <span style={{ fontWeight: 500 }}>· {t('contrib.rel.selfDescribed')}</span>
        </Badge>
      )}
      {r.whoNeed && <span style={{ ...TYPE.footnote, color: C2.slate }}>{whoText(t, r.whoNeed, r.whoMore)}</span>}
    </span>
  );
}

export { ReviewAuthor };
