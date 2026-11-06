'use client';
// A text field that wraps and grows instead of cutting text off. Long example
// text (the placeholder) and long answers both stay readable on phones and at
// 150% text size, because the box gets taller rather than scrolling sideways.
//
//   <TextArea value={v} onChange={e => setV(e.target.value)} placeholder="e.g. …"/>
//   <TextArea singleLine …/>  one line of meaning: Enter submits the form
//                             (like an <input>) and line breaks are removed.
//
// The height follows the text (or the placeholder while it's empty) on
// typing, on width changes and when the text size changes. Font is 16px
// (TYPE.input) so iOS doesn't zoom. Pass `style` to change the box.

import React from 'react';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { RADIUS } from './tokens';

const LINE = 1.4;

/** Fit the box to its text — or, while empty, to the placeholder. */
function fit(el) {
  if (!el) return;
  el.style.height = 'auto';
  let h = el.scrollHeight;
  if (!el.value && el.placeholder) {
    // Browsers don't count a wrapped placeholder in scrollHeight: measure it
    // as if it were the value, then put the empty value back (no events fire).
    el.value = el.placeholder;
    h = Math.max(h, el.scrollHeight);
    el.value = '';
  }
  const border = el.offsetHeight - el.clientHeight;
  el.style.height = `${h + border}px`;
}

const TextArea = React.forwardRef(function TextArea(
  { value, onChange, onKeyDown, singleLine = false, rows = 1, style, ...rest }, ref,
) {
  const inner = React.useRef(null);
  const setRef = React.useCallback((el) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);

  // Re-fit on every render (value or placeholder changed) …
  React.useLayoutEffect(() => { fit(inner.current); });
  // … and when the width changes (rotation, sheet resize, text size: the app
  // zooms #root, which narrows the box in CSS pixels).
  React.useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== w) { w = el.clientWidth; fit(el); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function keyDown(e) {
    onKeyDown?.(e);
    if (e.defaultPrevented || !singleLine) return;
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }
  function change(e) {
    if (singleLine && /[\r\n]/.test(e.target.value)) e.target.value = e.target.value.replace(/\s*[\r\n]+\s*/g, ' ');
    onChange?.(e);
  }

  return (
    <textarea ref={setRef} value={value} onChange={change} onKeyDown={keyDown} rows={rows}
      style={{
        display: 'block', width: '100%', boxSizing: 'border-box', resize: 'none', overflow: 'hidden',
        borderRadius: RADIUS.md, border: `1.5px solid ${C2.line}`, padding: '10px 12px',
        fontFamily: F2, fontSize: RA2_INPUT_FONT, lineHeight: LINE, color: C2.char, background: C2.paper,
        overflowWrap: 'anywhere',
        ...style,
      }}
      {...rest}/>
  );
});

export { TextArea };
