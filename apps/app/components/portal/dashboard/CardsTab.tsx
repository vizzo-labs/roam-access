import { cardLines, formatVisitDate } from '@/lib/needs-card';
import type { listCardsForVenue } from '@/lib/data/business';
import { cardAction } from '@/app/business/actions';
import { fmtDay, type TabProps } from './types';

// Guests' needs cards (F5, unchanged): sent before a visit so nobody has to
// explain at the door. Anonymous — the guest chooses what to tell you.
export function CardsTab({ t, d, readOnly }: TabProps) {
  const cards = d.cards as Awaited<ReturnType<typeof listCardsForVenue>>;
  return (
    <>
      <h2 id="tab-h" tabIndex={-1}>{t('business.tab.cardsCount', { count: cards.length })}</h2>
      <p className="muted">{t('business.cards.intro')}</p>
      {cards.length ? cards.map(c => (
        <article key={c.id} className="pt-card teal" aria-label={t('business.cards.received', { date: fmtDay(c.createdAt) })}>
          <div className="pt-row">
            <strong>{c.visitOn ? t('business.cards.visiting', { date: formatVisitDate(c.visitOn) }) : t('business.cards.visitingSoon')}</strong>
            <span className={`pill ${c.status === 'sent' ? 'check' : 'works'}`}><i aria-hidden="true">{c.status === 'sent' ? '!' : '✓'}</i>{t(`business.cards.status.${c.status}`)}</span>
          </div>
          {cardLines({ needs: c.needs, note: c.note, visitOn: null }).slice(1, -1).map((l, i) => <p key={i} style={{ margin: '0.4rem 0' }}>{l}</p>)}
          <p className="muted small" style={{ margin: '0.3rem 0 0' }}>{t('business.cards.received', { date: fmtDay(c.createdAt) })}</p>
          {c.venueResponse && <div className="says"><strong>{t('business.cards.yourReply')}</strong> {c.venueResponse}</div>}
          {!readOnly && (
            <form action={cardAction}>
              <input type="hidden" name="venueId" value={d.venue.id}/>
              <input type="hidden" name="cardId" value={c.id}/>
              <label htmlFor={`card-${c.id}`}>{t('business.cards.replyLabel')}</label>
              <p className="hint" id={`card-${c.id}-hint`}>{t('business.cards.replyHint')}</p>
              <textarea id={`card-${c.id}`} name="response" maxLength={500} aria-describedby={`card-${c.id}-hint`} defaultValue={c.venueResponse ?? ''}/>
              <div className="btn-row">
                <button className="btn" type="submit">{c.venueResponse ? t('business.cards.update') : t('business.cards.send')}</button>
                {c.status === 'sent' && <button className="btn ghost" type="submit" name="markRead" value="1">{t('business.cards.markRead')}</button>}
              </div>
            </form>
          )}
        </article>
      )) : <p className="muted">{t('business.cards.none')}</p>}
    </>
  );
}
