'use client';

import { useId, useState } from 'react';

// A read-only, labelled field with a Copy button; the result is announced.
export function CopyField({ label, value, rows = 1 }: { label: string; value: string; rows?: number }) {
  const id = useId();
  const [msg, setMsg] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(value); setMsg('Copied.'); }
    catch { setMsg('Couldn’t copy — select the text and copy it yourself.'); }
    setTimeout(() => setMsg(''), 4000);
  }
  return (
    <div className="pub-copy">
      <label htmlFor={id}>{label}</label>
      {rows > 1
        ? <textarea id={id} readOnly rows={rows} value={value} onFocus={e => e.currentTarget.select()}/>
        : <input id={id} readOnly value={value} onFocus={e => e.currentTarget.select()}/>}
      <button type="button" className="pub-btn" onClick={copy}>Copy</button>
      <span role="status" className="pub-status">{msg}</span>
    </div>
  );
}

export function PrintButton({ children = 'Print' }: { children?: React.ReactNode }) {
  return <button type="button" className="pub-btn primary" onClick={() => window.print()}>{children}</button>;
}
