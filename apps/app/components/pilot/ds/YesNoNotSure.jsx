'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2 } from '../ui/palette';
import { RADIUS, SPACE, TYPE, transition } from './tokens';

// YesNoNotSure — one question, three 52px buttons in a group named by the
// question: Yes · No · Not sure (aria-pressed). "Not sure" is a real answer
// you can see — no hidden "tap again to clear" gesture. value: 'yes' | 'no'
// | 'unsure' | undefined; the caller sends only yes/no.
//   <YesNoNotSure id="q-stepfree" question="Was there a step-free way in?" value={v} onChange={setV}/>
function YesNoNotSure({ id, question, value, onChange, children, style }) {
  const t = useT();
  const opts = [['yes', t('common.yes')], ['no', t('common.no')], ['unsure', t('steps.q.notSure')]];
  return (
    <div role="group" aria-labelledby={`${id}-q`} style={{ padding: `${SPACE.md}px 0`, borderTop: `1px solid ${C2.hair}`, ...style }}>
      <p id={`${id}-q`} style={{ ...TYPE.headline, fontSize: 17, margin: `0 0 ${SPACE.xs}px`, color: C2.char }}>{question}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 5.5em), 1fr))', gap: SPACE.xs }}>
        {opts.map(([val, label]) => {
          const on = value === val;
          return (
            <button key={val} type="button" aria-pressed={on} className="ds-press" onClick={() => onChange(val)} style={{
              minHeight: 52, padding: '6px 10px', borderRadius: RADIUS.md, cursor: 'pointer',
              border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.teal : C2.paper, color: on ? C2.paper : C2.char,
              fontFamily: F2, fontSize: 16.5, fontWeight: 700, lineHeight: 1.2,
              transition: transition(['background-color', 'border-color', 'color'], 'fast'),
            }}>{label}</button>
          );
        })}
      </div>
      {children}
    </div>
  );
}

export { YesNoNotSure };
