/* eslint-disable @next/next/no-html-link-for-pages -- links into the app need a full page load (its layout script sets up the phone shell) */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/community/PublicShell';
import { getPublicProfile } from '@/lib/data/contributors';
import { auDate } from '@/lib/data/summary';
import { serverT } from '@/lib/i18n/server';
import type { T } from '@/lib/i18n/core';

// A contributor's public profile (Brief L): /u/<public_id> — a random id, never
// the Clerk id or email. Only for people who show a name; anonymous people
// have no profile, and their reviews don't link here. Shows only what the
// person allowed: name, self-described label, needs only if they opted in,
// member since, contributor badges, counts, "Helped N people", and their
// visible reviews. No photos (those are for signed-in testers). Not indexed.

export async function generateMetadata({ params }: PageProps<'/u/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const p = await getPublicProfile(id);
  const t = serverT();
  return {
    title: p ? t('contrib.page.metaTitle', { name: p.name }) : 'Not found · Roam Access',
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: PageProps<'/u/[id]'>) {
  return (
    <PublicShell>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Profile params={params}/>
      </Suspense>
    </PublicShell>
  );
}

const PILL_ICON = { works: '✓', check: '!', barrier: '✗' } as const;

function relLine(t: T, rel: string | null) {
  return rel ? `${t(`contrib.rel.${rel}`)} (${t('contrib.rel.selfDescribed')})` : null;
}

async function Profile({ params }: { params: PageProps<'/u/[id]'>['params'] }) {
  const { id } = await params;
  const p = await getPublicProfile(id);
  if (!p) notFound();
  const t = serverT();
  const earned = p.badges.filter(b => b.earned);
  const needs = p.needs.map(n => t(`data.need.${n}.who`));
  const rel = relLine(t, p.rel);
  const stats: [number, string][] = [
    [p.counts.reviews, t('contrib.top.reviews', { count: p.counts.reviews }).replace(/^\d+\s*/, '')],
    [p.counts.helped, t('contrib.helped.count', { count: p.counts.helped })],
  ];

  return (
    <>
      <p className="pub-eyebrow">{t('contrib.page.eyebrow')}</p>
      <h1>{p.name}{!/[.!?。]$/.test(p.name) && <span className="dot">.</span>}</h1>
      {rel && <p style={{ fontSize: 18, fontWeight: 700, color: '#0A4F4F', margin: '0 0 4px' }}>{rel}</p>}
      {needs.length > 0 && <p style={{ margin: '0 0 4px' }}>{t('contrib.page.needs', { list: needs.join(', ') })}</p>}
      <p className="pub-muted">{t('contrib.page.memberSince', { date: auDate(new Date(p.memberSince)) })}</p>

      <h2>{t('contrib.page.stats')}</h2>
      <div className="pub-card">
        <ul className="pub-list">
          <li><strong>{t('contrib.top.reviews', { count: p.counts.reviews })}</strong></li>
          <li><span aria-hidden="true">♥ </span>{t('contrib.helped.count', { count: p.counts.helped })}</li>
        </ul>
      </div>

      <h2>{t('contrib.page.badges')}</h2>
      {earned.length ? (
        <div className="pub-card">
          <ul className="pub-list">
            {earned.map(b => (
              <li key={b.id}><strong>{t(`contrib.badge.${b.id}`)}</strong> <span className="pub-muted">— {t(`contrib.badge.${b.id}.desc`)}</span></li>
            ))}
          </ul>
        </div>
      ) : <p className="pub-muted">{t('contrib.page.noBadges')}</p>}

      <h2>{t('contrib.page.reviews')}</h2>
      {p.reviews.length ? (
        <ul className="pub-list">
          {p.reviews.map(r => (
            <li key={r.id}>
              <p style={{ margin: '0 0 4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px' }}>
                <a href={`/v/${encodeURIComponent(r.venueId)}`} style={{ fontWeight: 700, fontSize: 18, color: '#0A4F4F' }}>{r.venueName}</a>
                {r.verdict === 'works' || r.verdict === 'check' || r.verdict === 'barrier' ? (
                  <span className={`pub-pill ${r.verdict}`}>
                    <span className="pub-pill-ico" aria-hidden="true">{PILL_ICON[r.verdict]}</span>{t(`review.v.${r.verdict}`)}
                  </span>
                ) : <span className="pub-muted">{t('contrib.page.observation')}</span>}
              </p>
              {r.note?.trim() && <p style={{ margin: '0 0 4px' }}>“{r.note.trim()}”</p>}
              <p className="pub-muted pub-small" style={{ margin: 0 }}>
                {[r.suburb, auDate(new Date(r.createdAt)), r.thanks > 0 ? t('contrib.helped.count', { count: r.thanks }) : null].filter(Boolean).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      ) : <p className="pub-muted">{t('contrib.page.noReviews')}</p>}

      <p className="pub-muted pub-small" style={{ marginTop: 24 }}>{t('contrib.page.about')}</p>
      <div className="pub-actions">
        <a className="pub-btn primary" href="/">{t('contrib.page.open')}</a>
      </div>
    </>
  );
}
