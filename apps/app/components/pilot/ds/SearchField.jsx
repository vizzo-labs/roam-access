'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { RADIUS, TARGET, elevation } from './tokens';

// SearchField — the persistent search bar (Google/Apple Maps pattern): a real
// search form with a visible-on-focus label, an optional Back button, a Clear
// button, the mic, and a Search button that appears when the text changed.
// Enter submits. 16px input so iOS doesn't zoom.
//   <SearchField label="Search places" value={text} onChange={setText} onSubmit={run}
//     onVoice={() => app.goto('voice')} back={{ label: 'Back to home', onClick }}/>
const SearchField = React.forwardRef(function SearchField({
  id = 'ra-search', label: labelProp, value, onChange, onSubmit, onVoice, back,
  placeholder: placeholderProp, dirty, floating = false, style,
}, ref) {
  const t = useT();
  const label = labelProp || t('ds.search.label');
  const placeholder = placeholderProp || t('ds.search.label');
  const changed = dirty ?? !!value?.trim();
  return (
    <form role="search" aria-label={label} className="ds-search" onSubmit={e => { e.preventDefault(); if (value?.trim()) onSubmit?.(value.trim()); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 2, minHeight: TARGET.lg, boxSizing: 'border-box',
        padding: '3px 4px 3px 4px', borderRadius: RADIUS.pill, background: C2.paper,
        border: `1.5px solid ${C2.line}`, ...(floating ? elevation(2) : null), ...style,
      }}>
      {back
        ? <IconButton icon="back" label={back.label || t('common.back')} onClick={back.onClick} variant="ghost"/>
        : <span aria-hidden="true" style={{ width: 44, display: 'inline-flex', justifyContent: 'center', color: C2.slate }}><Icon name="search" size={20}/></span>}
      <label htmlFor={id} className="ra-sr-only">{label}</label>
      <input ref={ref} id={id} type="search" enterKeyHint="search" autoComplete="off" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, minHeight: TARGET.min, border: 0, background: 'transparent',
          fontFamily: F2, fontSize: RA2_INPUT_FONT, color: C2.char, padding: '0 4px',
        }}/>
      {value && <IconButton icon="close" label={t('ds.search.clear')} variant="ghost" size="sm" onClick={() => { onChange(''); ref?.current?.focus?.(); }}/>}
      {onVoice && <IconButton icon="mic" label={t('ds.search.voice')} variant="ghost" onClick={onVoice} style={{ color: C2.teal }}/>}
      {changed && <IconButton icon="search" label={t('ds.search.submit')} variant="filled" type="submit"/>}
    </form>
  );
});

export { SearchField };
