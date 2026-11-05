'use client';

import React from 'react';
import { ListRow } from '../ds';
import { V2Verdict } from '../ui/Verdict';
import { VerdictReasons } from '../trust/VerdictReasons';
import { useT } from '../i18n';
import { kindLabel } from '@/lib/i18n/data';

// One place in a list (results, the map sheet, saved, nearby). The whole row
// opens the venue. Hover/focus highlights its pin on the desktop map.
// `place` must carry `.verdict` (from ra2Search / ra2Verdict).
const PlaceRow = React.forwardRef(function PlaceRow({ app, place: v, reasons = 2, selected = false, onOpen, subtitle, padX }, ref) {
  const t = useT();
  const open = onOpen || (() => app.goto('venue', v.id));
  const hover = app.hover ? {
    onMouseEnter: () => app.hover(v.id), onMouseLeave: () => app.hover(null),
    onFocus: () => app.hover(v.id), onBlur: () => app.hover(null),
  } : {};
  return (
    <div ref={ref} data-place={v.id}>
      <ListRow title={v.name} padX={padX} chevron={false} selected={selected}
        subtitle={subtitle ?? `${kindLabel(t, v.kind)} · ${v.area} · ${t('common.minWalk', { mins: v.mins })}`}
        meta={(
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
            <V2Verdict kind={v.verdict.kind}/>
            {reasons > 0 && <VerdictReasons venue={v} verdict={v.verdict} needs={app.user?.needs || []} max={reasons} fontSize={14.5}/>}
          </span>
        )}
        onClick={open} {...hover}/>
    </div>
  );
});

export { PlaceRow };
