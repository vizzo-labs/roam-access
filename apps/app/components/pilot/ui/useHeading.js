'use client';

import React from 'react';

// Move focus to the screen heading on navigation (not on first paint, so the
// skip link and page context aren't skipped).
function useV2Heading(dep) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!window.RA2_NAVIGATED) return;
    if (ref.current) ref.current.focus();
  }, [dep]);
  return ref;
}

export { useV2Heading };
