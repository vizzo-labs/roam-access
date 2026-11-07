'use client';
import { useEffect } from 'react';

// After choosing a dashboard tab (a full page load), move focus to the tab's
// heading so keyboard and screen-reader users start at the new content.
export function TabFocus() {
  useEffect(() => { document.getElementById('tab-h')?.focus(); }, []);
  return null;
}
