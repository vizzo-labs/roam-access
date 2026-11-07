import { VerdictPill } from '@/components/portal/Portal';
import { REPLY_MAX } from '@/lib/data/business';
import { REPORT_NOTE_MAX, REPORT_REASONS } from '@/lib/data/owners';
import { replyAction, reportAction } from '@/app/business/actions';
import { HiddenNotice } from './HiddenNotice';
import { fmtDay, type TabProps } from './types';

type Extra = { reports: Map<string, { reason: string; createdAt: Date }> };

// Reviews: reply publicly (unchanged review card; the reply sits under it),
// and "Report this review" to the pilot team. A venue can never edit or hide
// a review — only the pilot team decides, in /admin/venues.
export function ReviewsTab({ t, d, readOnly, since, reports }: TabProps & Extra) {
  const reviewLink = `/#/venue/${encodeURIComponent(d.venue.id)}`;
  return (
    <>
      <h2 id="tab-h" tabIndex={-1}>{t('business.tab.reviewsCount', { count: d.reviews.length })}</h2>
      <p className="muted">Reply publicly to say thanks, explain, or say what you’ll fix. Reviewers are shown by lived experience, never by name.</p>
      <p className="muted small">{t('business.reviews.cantEdit')}</p>
      {d.reviews.length ? d.reviews.map(r => {
        const isNew = !!since && new Date(r.at) > since;
        const report = reports.get(r.id);
        return (
          <article key={r.id} className="pt-card" aria-labelledby={`rv-${r.id}`}>
            <div className="pt-row">
              <strong id={`rv-${r.id}`}>{r.who}</strong>
              <VerdictPill kind={r.v} label={{ works: 'It worked', check: 'Some barriers', barrier: 'Didn’t work' }[r.v]}/>
            </div>
            <p style={{ margin: '0.6rem 0 0.3rem' }}>{r.text}</p>
            {r.details && <p className="muted small" style={{ margin: 0 }}>{r.details}</p>}
            <p className="muted small" style={{ margin: '0.3rem 0 0' }}>{r.when}</p>
            {isNew && <p style={{ margin: '0.4rem 0 0' }}><span className="pill neutral">{t('business.reviews.new')}</span></p>}
            <HiddenNotice t={t} post={r.reply} what="reply"/>
            {readOnly ? (r.reply && <div className="says"><strong>{t('business.says.label')}</strong> {r.reply.body}</div>) : (
              <>
                <details open={!!r.reply}>
                  <summary>{r.reply ? t('business.reviews.yourReply') : t('business.reviews.replyPublicly')}<span className="pt-sr"> {t('business.reviews.toReviewBy', { who: r.who })}</span></summary>
                  <form action={replyAction}>
                    <input type="hidden" name="venueId" value={d.venue.id}/>
                    <input type="hidden" name="reviewId" value={r.id}/>
                    <label htmlFor={`reply-${r.id}`} style={{ marginTop: '0.25rem' }}>{t('business.reviews.replyLabel')}</label>
                    <p className="hint" id={`reply-${r.id}-hint`}>{t('business.reviews.replyHint')}</p>
                    <textarea id={`reply-${r.id}`} name="body" maxLength={REPLY_MAX} aria-describedby={`reply-${r.id}-hint`} defaultValue={r.reply?.body ?? ''}/>
                    <div className="btn-row">
                      <button className="btn" type="submit">{r.reply ? t('business.reviews.updateReply') : t('business.reviews.postReply')}</button>
                      {r.reply && <button className="btn ghost" type="submit" name="remove" value="1">{t('business.reviews.removeReply')}</button>}
                    </div>
                  </form>
                </details>
                {report ? (
                  <p className="small" role="note" style={{ margin: '0.5rem 0 0' }}>
                    <span className="pill neutral"><i aria-hidden="true">⚑</i>{t('business.report.done', { date: fmtDay(report.createdAt) })}</span>
                  </p>
                ) : (
                  <details>
                    <summary>{t('business.report.open')}<span className="pt-sr"> {t('business.reviews.toReviewBy', { who: r.who })}</span></summary>
                    <form action={reportAction}>
                      <input type="hidden" name="venueId" value={d.venue.id}/>
                      <input type="hidden" name="reviewId" value={r.id}/>
                      <p className="hint" style={{ marginTop: '0.25rem' }}>{t('business.report.hint')}</p>
                      <fieldset>
                        <legend>{t('business.report.why')}</legend>
                        {REPORT_REASONS.map(reason => (
                          <label key={reason} className="check">
                            <input type="radio" name="reason" value={reason} required/>
                            <span>{t(`business.report.reason.${reason}`)}</span>
                          </label>
                        ))}
                      </fieldset>
                      <label htmlFor={`report-${r.id}`}>{t('business.report.noteLabel')}</label>
                      <p className="hint" id={`report-${r.id}-hint`}>{t('business.report.noteHint')}</p>
                      <textarea id={`report-${r.id}`} name="note" maxLength={REPORT_NOTE_MAX} aria-describedby={`report-${r.id}-hint`}/>
                      <div className="btn-row"><button className="btn rust" type="submit">{t('business.report.send')}</button></div>
                    </form>
                  </details>
                )}
              </>
            )}
          </article>
        );
      }) : <p className="muted">{t('business.reviews.none')}</p>}
      <div className="pt-card dashed">
        <strong>{t('business.reviews.askTitle')}</strong>
        <p style={{ margin: '0.4rem 0 0' }}>{t('business.reviews.askBody')} <a href={reviewLink}>{`roam-access.vercel.app${reviewLink}`}</a></p>
        <p className="muted small" style={{ margin: '0.4rem 0 0' }}>{t('business.reviews.askNoRewards')}</p>
      </div>
    </>
  );
}
