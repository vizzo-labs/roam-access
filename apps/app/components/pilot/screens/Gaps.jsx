'use client';

import React from 'react';
import { V2BigBtn, V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { fetchGaps, invalidateGaps } from '../community/gapsStore';
import { gapHelps, gapHint, gapQuestion } from '../community/gapText';
import { kindLabel } from '@/lib/i18n/data';
import { useFormat, useT } from '../i18n';

// ─────────────────────────────────────────────────────────────
// HELP FILL THE GAPS — one yes/no question per place, one tap each.
// Answers count toward that place's facts, labelled "quick answer".
// ─────────────────────────────────────────────────────────────
function V2Gaps({ app }) {
  const t = useT();
  const fmt = useFormat();
  const [load, setLoad] = React.useState({ status: 'loading', tasks: [], event: null });
  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState([]); // { task, answer }
  const [busy, setBusy] = React.useState(false);
  const skipped = React.useRef([]);
  const qRef = React.useRef(null);
  const moved = React.useRef(false);
  const h = useV2Heading('gaps');
  const { lat, lng } = app.origin;

  const get = React.useCallback((fresh) => {
    fetchGaps({ lat, lng }, skipped.current, { fresh }).then(
      d => { setLoad({ status: 'ready', tasks: d.tasks, event: d.event }); setI(0); },
      () => setLoad(l => ({ ...l, status: 'error' })),
    );
  }, [lat, lng]);
  React.useEffect(() => { get(false); }, [get]);

  // Each new question takes focus, so screen reader and switch users land on it.
  React.useEffect(() => {
    if (!moved.current) return;
    if (qRef.current) qRef.current.focus();
    else if (h.current) h.current.focus();
  }, [i, load.tasks, h]);

  const tasks = load.tasks;
  const task = load.status === 'ready' ? tasks[i] : null;
  const finished = load.status === 'ready' && i >= tasks.length;

  async function answer(val) {
    if (!task || busy) return;
    setBusy(true);
    const ok = await app.answerQuick({ venueId: task.venueId, feature: task.feature, answer: val });
    setBusy(false);
    if (!ok) return;
    invalidateGaps();
    setDone(d => [...d, { task, answer: val }]);
    app.toast(t('community.gaps.saved', { answer: t(val === 'yes' ? 'community.gaps.answerYes' : 'community.gaps.answerNo'), name: task.name }));
    moved.current = true;
    setI(x => x + 1);
  }

  function skip() {
    if (!task) return;
    skipped.current = [...skipped.current, `${task.venueId}:${task.feature}`];
    moved.current = true;
    setI(x => x + 1);
  }

  function more() {
    moved.current = true;
    setDone([]);
    setLoad(l => ({ ...l, status: 'loading' }));
    get(true);
  }
  function retry() {
    setLoad(l => ({ ...l, status: 'loading' }));
    get(true);
  }

  const n = tasks.length;
  const title = load.status === 'loading' ? t('community.gaps.loading')
    : load.status === 'error' ? t('community.gaps.error')
    : !n ? t('community.gaps.nothing')
    : finished ? (done.length ? t('community.gaps.done') : t('community.gaps.allForNow'))
    : t('community.prompt.title', { count: n });

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0' }}>
        <V2Back app={app} to="home" label={t('community.gaps.backHome')}/>
      </div>
      <div style={{ padding: '16px 22px 28px' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 10px' }}>
          {t('community.gaps.overline')}
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 28, lineHeight: 1.12, marginBottom: 10 }}>
          {title}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: C2.char, margin: '0 0 18px', fontFamily: F2 }}>
          {t('community.gaps.intro')}
        </p>

        {load.event && (
          <p style={{ fontSize: 15, lineHeight: 1.45, margin: '0 0 18px', padding: '12px 14px', borderRadius: 14, background: C2.tealSoft, border: `1.5px solid ${C2.teal}`, fontFamily: F2 }}>
            {t('community.gaps.event', { event: load.event.name })}{' '}
            <a href={`/events/${encodeURIComponent(load.event.code)}`} style={{ color: C2.teal, fontWeight: 700 }}>{t('community.gaps.leaderboard')}</a>
          </p>
        )}

        {load.status === 'error' && <V2BigBtn kind="primary" onClick={retry}>{t('common.retry')}</V2BigBtn>}

        {task && (
          <section aria-labelledby="gap-q" style={{ borderRadius: 20, border: `1.5px solid ${C2.line}`, padding: 20, background: C2.paper }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C2.slate, margin: '0 0 10px', fontFamily: F2 }}>
              {t('community.gaps.questionOf', { n: i + 1, total: n })}
            </p>
            <h2 id="gap-q" ref={qRef} tabIndex={-1} style={{ margin: '0 0 10px', fontFamily: F2 }}>
              <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: C2.char, marginBottom: 2 }}>{task.name}<span className="ra-sr-only">:</span></span>
              <span style={{ display: 'block', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: C2.char }}>{gapQuestion(t, task)}</span>
            </h2>
            <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 4px', lineHeight: 1.45, fontFamily: F2 }}>
              {t('community.gaps.placeLine', { kind: kindLabel(t, task.kind), walk: t('common.minWalk', { mins: task.mins }), area: task.area })}
            </p>
            <p id="gap-why" style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 18px', lineHeight: 1.45, fontFamily: F2 }}>
              {gapHint(t, task)} {gapHelps(t, fmt, task.feature)}
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {['yes', 'no'].map(val => {
                return (
                  <button key={val} type="button" onClick={() => answer(val)} disabled={busy} aria-describedby="gap-q" style={{
                    flex: 1, minHeight: 64, borderRadius: 16, cursor: busy ? 'wait' : 'pointer',
                    border: `2.5px solid ${C2.teal}`, background: C2.paper, color: C2.teal,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    fontFamily: F2, fontSize: 19, fontWeight: 700,
                  }}>
                    <span aria-hidden="true" style={{
                      width: 26, height: 26, borderRadius: 999, background: C2.teal, color: C2.paper,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: M2, fontSize: 14, fontWeight: 800,
                    }}>{val === 'yes' ? '✓' : '✗'}</span>
                    {val === 'yes' ? t('common.yes') : t('common.no')}
                  </button>
                );
              })}
            </div>
            <V2BigBtn kind="ghost" onClick={skip} disabled={busy} style={{ minHeight: 54, fontSize: 16.5 }}>
              {t('community.gaps.skip')}
            </V2BigBtn>
            <button type="button" onClick={() => app.goto('venue', task.venueId)} style={{
              display: 'block', margin: '12px auto 0', minHeight: 44, padding: '0 12px', border: 0, background: 'transparent',
              color: C2.teal, fontFamily: F2, fontSize: 15, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
            }}>{t('community.gaps.seeFirst', { name: task.name })}</button>
          </section>
        )}

        {(finished || (load.status === 'ready' && !n)) && (
          <div>
            {done.length > 0 && (
              <section aria-labelledby="gap-done" style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 16 }}>
                <h2 id="gap-done" style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', fontFamily: F2 }}>
                  {t('community.gaps.live', { count: done.length })}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {done.map(({ task: dt, answer: a }) => (
                    <li key={`${dt.venueId}:${dt.feature}`} style={{ fontSize: 15, lineHeight: 1.45, padding: '8px 0', borderTop: `1px solid ${C2.hair}`, fontFamily: F2 }}>
                      <strong>{dt.name}</strong> — {gapQuestion(t, dt)} <strong>{a === 'yes' ? t('common.yes') : t('common.no')}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {!n && (
              <p style={{ fontSize: 16, lineHeight: 1.5, color: C2.slate, margin: '0 0 18px', fontFamily: F2 }}>
                {t('community.gaps.noneNear')}
              </p>
            )}
            {n > 0 && <V2BigBtn kind="primary" onClick={more}>{t('community.gaps.more')}</V2BigBtn>}
            <div style={{ height: 10 }}/>
            <V2BigBtn kind="ghost" onClick={() => app.goto('home')}>{t('community.gaps.backHome')}</V2BigBtn>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

export { V2Gaps };
