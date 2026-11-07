import type { OwnNotice } from '@/lib/data/owners';
import { MAX_LIVE_NOTICES, NOTICE_MAX, sydneyDate } from '@/lib/data/owners';
import { noticeAction, removeNoticeAction } from '@/app/business/actions';
import { HiddenNotice } from './HiddenNotice';
import { fmtDay, type TabProps } from './types';

type Extra = { notices: OwnNotice[] };

// Updates: short notices ("Lift out of service until Friday") with an
// optional last day. They show on the place's page, its map card and its
// public summary as "Venue says · <date>", and to people who saved it.
export function UpdatesTab({ t, d, readOnly, notices }: TabProps & Extra) {
  const live = notices.filter(n => n.status === 'live');
  const full = live.length >= MAX_LIVE_NOTICES;
  return (
    <>
      <h2 id="tab-h" tabIndex={-1}>{t('business.tab.updates')}</h2>
      <p className="muted">{t('business.updates.intro')}</p>
      {!readOnly && (full ? (
        <p className="flash err" role="note" style={{ fontWeight: 400 }}>{t('business.updates.full', { count: MAX_LIVE_NOTICES })}</p>
      ) : (
        <form action={noticeAction} className="pt-card">
          <input type="hidden" name="venueId" value={d.venue.id}/>
          <label htmlFor="notice-body" style={{ marginTop: 0 }}>{t('business.updates.bodyLabel')}</label>
          <p className="hint" id="notice-body-hint">{t('business.updates.bodyHint', { max: NOTICE_MAX })}</p>
          <textarea id="notice-body" name="body" required minLength={3} maxLength={NOTICE_MAX} aria-describedby="notice-body-hint"
            placeholder={t('business.updates.placeholder')}/>
          <label htmlFor="notice-ends">{t('business.updates.endsLabel')}</label>
          <p className="hint" id="notice-ends-hint">{t('business.updates.endsHint')}</p>
          <input id="notice-ends" name="endsOn" type="date" min={sydneyDate()} max={sydneyDate(365)} aria-describedby="notice-ends-hint" style={{ maxWidth: '16rem' }}/>
          <div className="btn-row"><button className="btn" type="submit">{t('business.updates.post')}</button></div>
        </form>
      ))}

      <h3>{t('business.updates.yours')}</h3>
      {notices.length ? (
        <ul className="pt-list">
          {notices.map(n => (
            <li key={n.id} className="pt-card">
              <div className="pt-row">
                <strong>{t('business.updates.posted', { date: fmtDay(n.createdAt) })}</strong>
                <span className={`pill ${n.status === 'live' ? 'works' : n.status === 'hidden' ? 'barrier' : 'neutral'}`}>
                  <i aria-hidden="true">{n.status === 'live' ? '✓' : n.status === 'hidden' ? '✗' : '–'}</i>{t(`business.updates.status.${n.status}`)}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0 0.25rem', whiteSpace: 'pre-line' }}>{n.body}</p>
              <p className="muted small" style={{ margin: 0 }}>
                {n.endsOn ? t(n.status === 'expired' ? 'business.updates.ended' : 'business.updates.until', { date: fmtDay(n.endsOn) }) : t('business.updates.noEnd')}
              </p>
              <HiddenNotice t={t} post={{ hidden: n.status === 'hidden', hiddenAt: n.hiddenAt, hiddenNote: n.hiddenNote }} what="notice"/>
              {!readOnly && (
                <form action={removeNoticeAction}>
                  <input type="hidden" name="venueId" value={d.venue.id}/>
                  <input type="hidden" name="id" value={n.id}/>
                  <div className="btn-row">
                    <button className="btn ghost" type="submit">
                      {n.status === 'live' ? t('business.updates.takeDown') : t('business.updates.delete')}
                      <span className="pt-sr"> {t('business.updates.postedSr', { date: fmtDay(n.createdAt) })}</span>
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="muted">{t('business.updates.none')}</p>}
    </>
  );
}
