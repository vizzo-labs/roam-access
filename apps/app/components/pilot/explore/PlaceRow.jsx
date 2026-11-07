'use client';

import React from 'react';
import { ListRow } from '../ds';
import { C2, M2 } from '../ui/palette';
import { V2Verdict } from '../ui/Verdict';
import { REASON_MARK, reasonsFor } from '../trust/VerdictReasons';
import { factShort } from '../trust/text';
import { useT } from '../i18n';
import { kindLabel } from '@/lib/i18n/data';

// One place in a list (Find, results, the map, Saved). The whole row opens
// the place and says four things: name, "kind · walk", the verdict (glyph +
// colour + words) and ONE reason. Screen readers hear a short name — "Hugos,
// Restaurant, 1 min walk, Check first" — and the reason as its description.
// Hover/focus highlights its pin on the desktop map.
// `place` must carry `.verdict` (from ra2Search / ra2Verdict).
const PlaceRow = React.forwardRef(function PlaceRow({ app, place: v, reasons = 1, selected = false, onOpen, subtitle, padX }, ref) {
  const t = useT();
  const rid = React.useId();
  const open = onOpen || (() => app.goto('venue', v.id));
  const hover = app.hover ? {
    onMouseEnter: () => app.hover(v.id), onMouseLeave: () => app.hover(null),
    onFocus: () => app.hover(v.id), onBlur: () => app.hover(null),
  } : {};
  const kind = kindLabel(t, v.kind);
  const walk = t('common.minWalk', { mins: v.mins });
  const reason = reasons > 0 ? <OneReason id={rid} place={v}/> : null;
  return (
    <div ref={ref} data-place={v.id}>
      <ListRow title={v.name} padX={padX} selected={selected} style={{ minHeight: 64 }}
        subtitle={subtitle ?? `${kind} · ${walk}`}
        aria-label={t('find.row.name', { name: v.name, kind, walk, verdict: t(`data.verdict.${v.verdict.kind}`) })}
        aria-describedby={reason ? rid : undefined}
        meta={(
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
            <V2Verdict kind={v.verdict.kind}/>
            {reason}
          </span>
        )}
        onClick={open} {...hover}/>
    </div>
  );
});

// The single most useful reason: the first barrier, check or "works" fact
// (with its count), an OpenStreetMap hint (always "unconfirmed"), or — with
// nothing known for this person's needs — the invitation to be the first.
function OneReason({ id, place: v }) {
  const t = useT();
  const [item] = reasonsFor(v.verdict, 1);
  if (!item) {
    const text = v.verdict.kind === 'unknown' ? t('find.row.beFirst') : v.verdict.why;
    return <span id={id} style={{ display: 'block', fontSize: 15, lineHeight: 1.4, color: C2.char }}>{text}</span>;
  }
  const m = REASON_MARK[item.kind];
  return (
    <span id={id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.4, color: C2.char }}>
      <span aria-hidden="true" style={{
        width: 18, height: 18, borderRadius: 999, background: m.fg(), color: C2.paper, flexShrink: 0, marginTop: 2,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: M2,
      }}>{m.icon}</span>
      <span><span className="ra-sr-only">{t(`trust.mark.${item.kind}`)} </span>{factShort(t, item.f)}</span>
    </span>
  );
}

export { PlaceRow };
