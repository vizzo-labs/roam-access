import { Stat, VerdictPill } from '@/components/portal/Portal';
import { textOf } from '@/lib/trust/text';
import type { T } from '@/lib/i18n/core';
import { fmtDay, tabHref, type TabProps } from './types';

type Extra = { saves: { byNeed: Map<string, number>; recent: number; all: number } };

// Overview: views and saves by need (last 30 days), what's new since the
// owner's last visit, and what people still need to know. Counts only —
// never who looked or saved.
export function Overview({ t, d, readOnly, since, saves }: TabProps & Extra) {
  const newReviews = since ? d.reviews.filter(r => new Date(r.at) > since) : [];
  const unconfirmed = d.facts.check.filter(f => f.src === 'osm');
  const fact = (f: (typeof d.facts.works)[number]) => textOf(t, f.i18n?.t) ?? f.t;
  return (
    <>
      <h2 id="tab-h" tabIndex={-1}>{t('business.tab.overview')}</h2>

      {!readOnly && (
        <div className="pt-card teal">
          <h3 style={{ marginTop: 0 }}>{t('business.overview.sinceTitle')}</h3>
          {!since ? <p style={{ margin: 0 }}>{t('business.overview.firstVisit')}</p> : newReviews.length ? (
            <p style={{ margin: 0 }}>
              {t('business.overview.newReviews', { count: newReviews.length, date: fmtDay(since) })}{' '}
              <a href={tabHref(d.venue.id, 'reviews')}>{t('business.overview.readThem')}</a>
            </p>
          ) : <p style={{ margin: 0 }}>{t('business.overview.noNew', { date: fmtDay(since) })}</p>}
        </div>
      )}

      <h3>{t('business.overview.lastDays', { days: d.days })}</h3>
      <div className="pt-grid">
        <Stat n={d.totals.views} label={t('business.stat.views')}/>
        <Stat n={d.totals.searches} label={t('business.stat.searches')}/>
        <Stat n={saves.recent} label={t('business.stat.saves')}/>
        <Stat n={d.totals.reviews} label={t('business.stat.reviews', { count: d.totals.reviews })}/>
      </div>
      <p className="muted small">{t('business.overview.anonymous')}</p>

      <div className="pt-table-wrap">
        <table>
          <caption>{t('business.overview.tableCaption', { days: d.days })}</caption>
          <thead><tr>
            <th scope="col">{t('business.col.need')}</th>
            <th scope="col" className="num">{t('business.col.views')}</th>
            <th scope="col" className="num">{t('business.col.searches')}</th>
            <th scope="col" className="num">{t('business.col.saves')}</th>
            <th scope="col">{t('business.col.info')}</th>
          </tr></thead>
          <tbody>
            {d.byNeed.map(n => (
              <tr key={n.id}>
                <th scope="row">{t(`data.need.${n.id}.chip`)}</th>
                <td className="num">{n.views}</td>
                <td className="num">{n.searches}</td>
                <td className="num">{saves.byNeed.get(n.id) ?? 0}</td>
                <td>{n.covered
                  ? <span className="pill works"><i aria-hidden="true">✓</i>{t('business.info.yes')}</span>
                  : <span className="pill check"><i aria-hidden="true">!</i>{t('business.info.none')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 id="still-need">{t('business.overview.stillNeedTitle')}</h3>
      <p className="muted small">{t('business.overview.stillNeedHint')}</p>
      {d.unmet.length || d.missing.length || unconfirmed.length ? (
        <ul>
          {d.unmet.map(n => (
            <li key={n.id}>{t('business.overview.unmet', { need: t(`data.need.${n.id}.chip`), who: t(`data.need.${n.id}.whoPlural`), count: n.views + n.searches })}</li>
          ))}
          {d.missing.map(m => (
            <li key={m.id}>{m.demand
              ? t('business.overview.missingDemand', { question: t(`community.q.${m.id}`), count: m.demand })
              : t(`community.q.${m.id}`)}</li>
          ))}
          {unconfirmed.map(f => <li key={f.t}>{t('business.overview.unconfirmed', { fact: fact(f) })}</li>)}
        </ul>
      ) : <p className="muted">{t('business.overview.allKnown')}</p>}
      {!readOnly && (
        <p className="small">
          <a href={tabHref(d.venue.id, 'profile', '#statement')}>{t('business.overview.explainLink')}</a>
        </p>
      )}

      <h3>{t('business.community.title')}</h3>
      <p className="muted">{t('business.community.hint')}</p>
      {d.facts.barriers.length + d.facts.works.length + d.facts.check.length ? (
        <ul className="pt-list">
          {d.facts.barriers.map(f => <li key={f.t}><VerdictPill kind="barrier" label={t('business.pill.barrier')}/> {fact(f)}</li>)}
          {d.facts.works.map(f => <li key={f.t}><VerdictPill kind="works" label={t('business.pill.works')}/> {fact(f)}</li>)}
          {d.facts.check.map(f => <li key={f.t}><VerdictPill kind="check" label={t('business.pill.check')}/> {fact(f)}{f.src === 'osm' ? ` ${t('business.community.fromOsm')}` : ''}</li>)}
        </ul>
      ) : <p className="muted">{t('business.community.none')}</p>}
    </>
  );
}

export type { T };
