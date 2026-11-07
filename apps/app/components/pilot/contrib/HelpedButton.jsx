'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, TYPE } from '../ds';
import { useT } from '../i18n';

// "This helped me" (Brief L): one per person per review, a toggle
// (aria-pressed), never on your own review — there it only shows the count.
// The count ("Helped 3 people") is plain text next to it and is announced
// politely when it changes.
function HelpedButton({ r, app }) {
  const t = useT();
  const [state, setState] = React.useState({ on: !!r.thankedByMe, n: r.thanks || 0 });
  const [busy, setBusy] = React.useState(false);
  const count = state.n > 0 ? t('contrib.helped.count', { count: state.n }) : '';

  if (r.mine || !r.id) {
    return count ? <span style={{ ...TYPE.footnote, color: C2.slate }}>{count}</span> : null;
  }

  async function toggle() {
    if (busy) return;
    const next = !state.on;
    const prev = state;
    setBusy(true);
    setState({ on: next, n: Math.max(0, state.n + (next ? 1 : -1)) });
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(r.id)}/thanks`, { method: next ? 'PUT' : 'DELETE' });
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      setState({ on: j.thankedByMe, n: j.thanks });
      if (next) app?.toast?.(t('contrib.helped.thanked'));
    } catch (e) {
      setState(prev);
      app?.toast?.(t('contrib.helped.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <Button variant={state.on ? 'secondary' : 'ghost'} size="sm" icon={state.on ? 'check' : 'heart'} onClick={toggle}
        aria-pressed={state.on}>
        {t('contrib.helped.button')}
      </Button>
      <span aria-live="polite" style={{ ...TYPE.footnote, color: C2.slate }}>{count}</span>
    </span>
  );
}

export { HelpedButton };
