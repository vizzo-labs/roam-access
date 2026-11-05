'use client';

import React from 'react';

// ── Dialog behaviour (ported from v1): focus in, trap, Escape, restore ────
const RA2_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useRA2Dialog(open, onClose) {
  const ref = React.useRef(null);
  const restoreTo = React.useRef(null);
  // onClose lives in a ref so an unstable callback identity can never re-run
  // the effect — re-running would yank focus back to the first control on
  // every settings change inside the dialog.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  React.useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    const node = ref.current;
    if (node) {
      const first = node.querySelector(RA2_FOCUSABLE);
      (first || node).focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll(RA2_FOCUSABLE))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const back = restoreTo.current;
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    };
  }, [open]);
  return ref;
}

export { RA2_FOCUSABLE, useRA2Dialog };
