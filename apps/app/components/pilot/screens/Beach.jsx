'use client';

import React from 'react';
import { MLAK_URL, CHANGING_PLACES_FINDER } from '@/lib/layers/defs';
import { V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Button, Card, GUTTER, List, SkeletonList, SPACE, TYPE } from '../ds';
import { ExtLink, FacilityRow, ListedNote, SectionHead, withParts } from '../layers/bits';
import { MattingQuestion, TempReportBanner } from '../layers/TempReports';
import { distanceLabel, metres, reportBanner, reportType, toiletTagLabels } from '../layers/layerUtils';
import { useT } from '../i18n';

// ─────────────────────────────────────────────────────────────
// BEACH ACCESS — free beach wheelchairs, Liberty Swings, MLAK,
// the ferry ramp at low tide, and today's community reports
// ─────────────────────────────────────────────────────────────
function V2Beach({ app }) {
  const t = useT();
  const h = useV2Heading('beach');
  const L = app.layers;
  const items = L.facilities.filter(f => f.layer === 'beach');
  const of = kind => items.filter(f => f.kind === kind);
  const beaches = of('beach');
  const swings = of('liberty_swing').sort((a, b) => metres(app.origin, a) - metres(app.origin, b));
  const getting = [...of('ferry'), ...of('walk')];
  const today = items.flatMap(f => L.reportsFor('facility', f.id).map(r => ({ r, f })));
  const manly = beaches.find(b => b.id === 'beach-manly') || beaches[0];
  const nearToilets = manly ? L.facilities
    .filter(f => f.kind === 'toilet' && (f.details?.accessible || f.details?.adultChange))
    .map(f => ({ f, m: metres(manly, f) })).sort((a, b) => a.m - b.m).slice(0, 3) : [];

  const alertFor = f => {
    const r = L.reportsFor('facility', f.id).find(x => !reportType(x.type)?.positive);
    return r ? reportBanner(t, r.type) : null;
  };
  const where = f => `${f.suburb ? `${f.suburb} · ` : ''}${distanceLabel(app.origin, f, t)}`;
  const body = { ...TYPE.body, margin: 0 };

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: `10px ${GUTTER}px 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to="home" label={t('layers.backHome')}/>
        {!app.wide && (
          <Button variant="ghost" size="sm" icon="map" onClick={() => { L.setShown('beach', true); app.goto('map'); }}>{t('layers.showOnMap')}</Button>
        )}
      </div>
      <div style={{ padding: `18px ${GUTTER}px 24px` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: '0 0 6px' }}>
          {t('layers.beach.title')}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.callout, color: C2.slate, margin: `0 0 ${SPACE.md}px` }}>{t('layers.beach.intro')}</p>
        <ListedNote>{t('layers.beach.listed')}</ListedNote>
        {!L.loaded && <SkeletonList label={t('layers.beach.loading')} count={3} padX={0}/>}
        {L.failed && <p role="status" style={{ ...TYPE.callout, color: C2.slate }}>{t('layers.beach.loadFailed')}</p>}

        {today.length > 0 && (
          <section aria-labelledby="beach-today-h">
            <SectionHead id="beach-today-h" sub={t('layers.beach.todaySub')}>{t('layers.beach.today')}</SectionHead>
            {today.map(({ r, f }) => (
              <div key={r.id}>
                <p style={{ ...TYPE.headline, fontSize: 15, margin: `0 0 ${SPACE.xs}px` }}>{f.name}</p>
                <TempReportBanner app={app} reports={[r]} placeName={f.name}/>
              </div>
            ))}
          </section>
        )}

        {beaches.length > 0 && (
          <section aria-labelledby="beach-chairs-h">
            <SectionHead id="beach-chairs-h" sub={t('layers.beach.chairsSub')}>{t('layers.beach.chairs')}</SectionHead>
            {beaches.map(f => (
              <Card key={f.id} padding={0} style={{ marginBottom: SPACE.sm }}>
                <List label={f.name}>
                  <FacilityRow app={app} f={f} subtitle={where(f)} alert={alertFor(f)}
                    tagsLang="en-AU" tags={(f.details?.features || []).slice(1, 4).map(s => s.split(' — ')[0])}/>
                </List>
                <div style={{ padding: `0 ${SPACE.md}px ${SPACE.md}px` }}>
                  <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
                    {f.bookingUrl && (
                      <Button size="sm" icon="external" href={f.bookingUrl} external aria-label={t('layers.beach.bookLabel', { name: f.name })}>
                        {t('layers.beach.book')}
                      </Button>
                    )}
                    {f.bookingPhone && (
                      <Button size="sm" variant="outline" icon="phone" href={`tel:${f.bookingPhone.replace(/[^+\d]/g, '')}`} aria-label={t('layers.beach.callLabel', { phone: f.bookingPhone, name: f.name })}>
                        {t('layers.beach.call', { phone: f.bookingPhone })}
                      </Button>
                    )}
                  </div>
                  {f.details?.mattingQuestion && <MattingQuestion app={app} facility={f}/>}
                </div>
              </Card>
            ))}
          </section>
        )}

        {swings.length > 0 && (
          <section aria-labelledby="beach-swings-h">
            <SectionHead id="beach-swings-h" sub={t('layers.beach.swingsSub')}>{t('layers.beach.swings')}</SectionHead>
            <List label={t('layers.beach.swings')} inset>
              {swings.map(f => <FacilityRow key={f.id} app={app} f={f} subtitle={where(f)} alert={alertFor(f)}/>)}
            </List>
          </section>
        )}

        <section aria-labelledby="beach-mlak-h">
          <SectionHead id="beach-mlak-h">{t('layers.beach.mlak')}</SectionHead>
          <p style={body}>
            {withParts(t('layers.beach.mlakBody'), {
              helloManly: <ExtLink href="https://hellomanly.com.au/?p=32200" lang="en-AU">Hello Manly</ExtLink>,
              mlak: <ExtLink href={MLAK_URL} lang="en-AU">Master Locksmiths Access Key</ExtLink>,
            })}
          </p>
        </section>

        {getting.length > 0 && (
          <section aria-labelledby="beach-getting-h">
            <SectionHead id="beach-getting-h">{t('layers.beach.getting')}</SectionHead>
            <List label={t('layers.beach.getting')} inset>
              {getting.map(f => (
                <FacilityRow key={f.id} app={app} f={f} alert={alertFor(f)}
                  subtitle={<>{where(f)}{f.description ? <> · <span lang="en-AU">{f.description}</span></> : null}</>}/>
              ))}
            </List>
          </section>
        )}

        {nearToilets.length > 0 && (
          <section aria-labelledby="beach-toilets-h">
            <SectionHead id="beach-toilets-h" sub={t('layers.beach.toiletsSub', { name: manly.name })}>{t('layers.beach.toilets')}</SectionHead>
            <List label={t('layers.beach.toiletsList')} inset>
              {nearToilets.map(({ f }) => (
                <FacilityRow key={f.id} app={app} f={f}
                  subtitle={`${f.suburb ? `${f.suburb} · ` : ''}${t('layers.beach.fromBeach', { distance: distanceLabel(manly, f, t) })}`}
                  tags={toiletTagLabels(f.details || {}, t)} alert={alertFor(f)}/>
              ))}
            </List>
            <Button variant="plain" size="sm" onClick={() => app.goto('toilets')} style={{ paddingLeft: 0, marginTop: SPACE.xs }}>
              {t('layers.beach.allToilets')}
            </Button>
          </section>
        )}

        <section aria-labelledby="beach-cp-h">
          <SectionHead id="beach-cp-h">{t('layers.beach.cp')}</SectionHead>
          <p style={body}>
            {withParts(t('layers.beach.cpBody'), { finder: <ExtLink href={CHANGING_PLACES_FINDER}>{t('layers.attr.finder')}</ExtLink> })}
          </p>
        </section>
      </div>
    </V2Shell>
  );
}

export { V2Beach };
