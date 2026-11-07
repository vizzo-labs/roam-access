import { REPLY_MAX } from '@/lib/data/business';
import { HOURS_MAX, type CorrectionsVM } from '@/lib/data/owners';
import { correctionsAction, statementAction } from '@/app/business/actions';
import { HiddenNotice } from './HiddenNotice';
import { fmtDay, type TabProps } from './types';

type Extra = { corrections: CorrectionsVM | null; osm: { phone: string | null; website: string | null; hours: string | null } };

// Profile: the access statement ("Venue says") and the venue's corrections
// to its phone, website and opening hours. Corrections show as "Venue says";
// what OpenStreetMap lists stays underneath and is never overwritten.
export function ProfileTab({ t, d, readOnly, corrections: c, osm }: TabProps & Extra) {
  const osmLine = (v: string | null) => <p className="muted small" style={{ margin: '0.3rem 0 0' }}>{v ? t('business.profile.osmSays', { value: v }) : t('business.profile.osmNone')}</p>;
  return (
    <>
      <h2 id="tab-h" tabIndex={-1}>{t('business.tab.profile')}</h2>

      <h3 id="statement">{t('business.statement.title')}</h3>
      <HiddenNotice t={t} post={d.statement} what="statement"/>
      <p className="muted">{t('business.statement.intro')}</p>
      {readOnly ? (
        <div className="says">{d.statement?.body || <span className="muted">{t('business.statement.none')}</span>}</div>
      ) : (
        <form action={statementAction} className="pt-card">
          <input type="hidden" name="venueId" value={d.venue.id}/>
          <label htmlFor="statement-body" style={{ marginTop: 0 }}>{t('business.says.label')}</label>
          <p className="hint" id="statement-hint">{t('business.statement.hint')}{d.statement ? ` ${t('business.statement.updated', { when: d.statement.when })}` : ''}</p>
          <textarea id="statement-body" name="body" maxLength={REPLY_MAX} aria-describedby="statement-hint" defaultValue={d.statement?.body ?? ''}
            placeholder={t('business.statement.placeholder')}/>
          <div className="btn-row"><button className="btn" type="submit">{t('business.statement.save')}</button></div>
        </form>
      )}

      <h3 id="details">{t('business.profile.title')}</h3>
      <p className="muted">{t('business.profile.intro')}</p>
      {c && <p className="muted small">{t('business.profile.updated', { date: fmtDay(c.at) })}</p>}
      {readOnly ? (
        <dl className="says">
          <dt><strong>{t('business.profile.phone')}</strong></dt><dd style={{ margin: '0 0 0.5rem' }}>{c?.phone || '—'}</dd>
          <dt><strong>{t('business.profile.website')}</strong></dt><dd style={{ margin: '0 0 0.5rem' }}>{c?.website || '—'}</dd>
          <dt><strong>{t('business.profile.hours')}</strong></dt><dd style={{ margin: 0, whiteSpace: 'pre-line' }}>{c?.hours || '—'}</dd>
        </dl>
      ) : (
        <form action={correctionsAction} className="pt-card">
          <input type="hidden" name="venueId" value={d.venue.id}/>
          <label htmlFor="fix-phone" style={{ marginTop: 0 }}>{t('business.profile.phone')}</label>
          <input id="fix-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={c?.phone ?? ''} aria-describedby="fix-phone-osm" style={{ maxWidth: '20rem' }}/>
          <div id="fix-phone-osm">{osmLine(osm.phone)}</div>
          <label htmlFor="fix-web">{t('business.profile.website')}</label>
          <input id="fix-web" name="website" type="text" inputMode="url" autoComplete="url" maxLength={200} defaultValue={c?.website ?? ''} aria-describedby="fix-web-osm"/>
          <div id="fix-web-osm">{osmLine(osm.website)}</div>
          <label htmlFor="fix-hours">{t('business.profile.hours')}</label>
          <p className="hint" id="fix-hours-hint">{t('business.profile.hoursHint')}</p>
          <textarea id="fix-hours" name="hours" maxLength={HOURS_MAX} defaultValue={c?.hours ?? ''} aria-describedby="fix-hours-hint fix-hours-osm"
            placeholder={t('business.profile.hoursPlaceholder')}/>
          <div id="fix-hours-osm">{osmLine(osm.hours)}</div>
          <p className="hint" style={{ marginTop: '0.75rem' }}>{t('business.profile.clearHint')}</p>
          <div className="btn-row"><button className="btn" type="submit">{t('business.profile.save')}</button></div>
        </form>
      )}
    </>
  );
}
