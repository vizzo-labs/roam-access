'use client';

import React from 'react';
import { C2, M2 } from '../ui/palette';
import { Badge, Banner, Card, Icon, RADIUS, SPACE, SectionHeader, SkeletonText, TYPE } from '../ds';
import { useT } from '../i18n';
import { NewBadge } from './NewBadge';
import { REL_ICON, isLegacy, previewLine } from './authorText';

// Me → recognition (Brief L): how I appear on reviews, "Helped N people",
// my contributor badges, and the top contributors this month.
function useContrib(version) {
  const [data, setData] = React.useState(null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    fetch('/api/contributors').then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => { if (live) setData(d); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [version]);
  return { data, failed };
}

function MeContrib({ app }) {
  const t = useT();
  const pub = app.user?.pub;
  const legacy = isLegacy(pub);
  const { data, failed } = useContrib(app.reviewsVersion);
  const named = !legacy && !pub.postAnonymously && !!(pub.publicName || '').trim();
  const helped = data?.me?.counts?.helped ?? 0;
  const badges = data?.me?.badges || [];
  const earned = badges.filter(b => b.earned).length;

  return (
    <>
      <NewBadge app={app} showLink={false} style={{ marginBottom: SPACE.sm }}/>

      {/* How I appear on reviews */}
      <Card variant="filled" as="section" aria-labelledby="appear-h" style={{ marginBottom: SPACE.sm }}>
        <SectionHeader id="appear-h" title={t('contrib.me.appear.title')} size="sm" style={{ marginBottom: SPACE.xs }}
          action={legacy
            ? { label: t('contrib.me.appear.choose'), ariaLabel: t('contrib.me.appear.chooseAria'), onClick: () => app.goto('profile') }
            : { label: t('common.edit'), ariaLabel: t('contrib.me.appear.edit'), onClick: () => app.goto('profile') }}/>
        <p style={{ ...TYPE.headline, color: C2.teal, margin: 0, overflowWrap: 'anywhere' }}>{previewLine(t, pub, app.user?.needs)}</p>
        {legacy && <p style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>{t('contrib.me.appear.legacy')}</p>}
        {(named || helped > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 16px', marginTop: SPACE.xs }}>
            {helped > 0 && (
              <span style={{ ...TYPE.label, display: 'inline-flex', alignItems: 'center', gap: 6, color: C2.char }}>
                <span style={{ color: C2.rust }}><Icon name="heart" size={18}/></span>{t('contrib.helped.count', { count: helped })}
              </span>
            )}
            {named && (
              <a href={`/u/${encodeURIComponent(pub.publicId)}`} style={{ ...TYPE.label, color: C2.teal, display: 'inline-flex', alignItems: 'center', minHeight: 44, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {t('contrib.me.profileLink')}
              </a>
            )}
          </div>
        )}
      </Card>

      {/* My badges */}
      <Card as="section" aria-labelledby="badges-h" style={{ marginBottom: SPACE.sm }}>
        <SectionHeader id="badges-h" title={t('contrib.me.badges.title')} size="sm"
          description={data ? t('contrib.me.badges.count', { earned, total: badges.length }) : undefined}
          style={{ marginBottom: SPACE.xs }}/>
        {!data && !failed && <><SkeletonText lines={3}/><span className="ra-sr-only" role="status">{t('contrib.me.loading')}</span></>}
        {failed && <Banner tone="warn">{t('contrib.me.failed')}</Banner>}
        {data && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: SPACE.xs }}>
            {badges.map(b => (
              <li key={b.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: RADIUS.md,
                background: b.earned ? C2.tealSoft : C2.paper, border: `1.5px ${b.earned ? 'solid' : 'dashed'} ${b.earned ? C2.teal : C2.line}`,
              }}>
                <span aria-hidden="true" style={{ color: b.earned ? C2.teal : C2.slate, paddingTop: 2 }}><Icon name={b.icon} size={20}/></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ ...TYPE.label, display: 'block', color: C2.char, lineHeight: 1.3 }}>{t(`contrib.badge.${b.id}`)}</span>
                  <span style={{ ...TYPE.caption, fontWeight: 500, display: 'block', color: C2.slate }}>{t(`contrib.badge.${b.id}.desc`)}</span>
                  <span style={{ ...TYPE.caption, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, color: b.earned ? C2.teal : C2.slate }}>
                    {b.earned && <Icon name="check" size={14} strokeWidth={2.6}/>}
                    {b.earned ? t('contrib.badge.earned') : b.goal > 1 ? t('contrib.badge.progress', { have: b.have, goal: b.goal }) : t('contrib.badge.notYet')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Top contributors this month */}
      <Card as="section" aria-labelledby="top-h" style={{ marginBottom: SPACE.lg }}>
        <SectionHeader id="top-h" title={t('contrib.top.title')} size="sm" description={t('contrib.top.lead')} style={{ marginBottom: SPACE.xs }}/>
        {!data && !failed && <SkeletonText lines={3}/>}
        {data && !data.top.length && <p style={{ ...TYPE.footnote, color: C2.slate, margin: 0 }}>{t('contrib.top.empty')}</p>}
        {data && data.top.length > 0 && (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.top.map((p, i) => {
              const me = named && p.publicId === pub.publicId;
              return (
                <li key={p.publicId} style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, padding: '6px 0', borderTop: i ? `1px solid ${C2.hair}` : 0 }}>
                  <span style={{ fontFamily: M2, fontWeight: 700, fontSize: 16, width: 22, textAlign: 'right', color: C2.slate }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0 8px' }}>
                    <a href={`/u/${encodeURIComponent(p.publicId)}`} style={{ ...TYPE.label, color: C2.teal, minHeight: 44, display: 'inline-flex', alignItems: 'center', textDecoration: 'underline', textUnderlineOffset: 3, overflowWrap: 'anywhere' }}>
                      {p.name}
                    </a>
                    {me && <Badge size="sm" tone="neutral" icon={null}>{t('contrib.top.you')}</Badge>}
                    {p.rel && <Badge size="sm" tone={p.rel === 'ally' ? 'neutral' : 'teal'} icon={REL_ICON[p.rel]}>{t(`contrib.rel.${p.rel}`)}</Badge>}
                  </span>
                  <span style={{ ...TYPE.footnote, color: C2.char, whiteSpace: 'nowrap' }}>{t('contrib.top.reviews', { count: p.reviews })}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </>
  );
}

export { MeContrib };
