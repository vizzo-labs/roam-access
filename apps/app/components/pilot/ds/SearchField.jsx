'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { TextArea } from './TextArea';
import { TARGET, elevation } from './tokens';

// SearchField — the persistent search bar (Google/Apple Maps pattern): a real
// search form with a visible-on-focus label, an optional Back button, a Clear
// button, the mic, and a Search button that appears when the text changed.
// Enter submits. 16px input so iOS doesn't zoom. At large text sizes the
// buttons wrap under the text instead of squeezing it (the input keeps ≥ 8em).
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
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, minHeight: TARGET.lg, boxSizing: 'border-box',
        padding: '3px 4px 3px 4px', borderRadius: 28, background: C2.paper,
        border: `1.5px solid ${C2.line}`, ...(floating ? elevation(2) : null), ...style,
      }}>
      {back
        ? <IconButton icon="back" label={back.label || t('common.back')} onClick={back.onClick} variant="ghost"/>
        : <span aria-hidden="true" style={{ width: 44, display: 'inline-flex', justifyContent: 'center', color: C2.slate }}><Icon name="search" size={20}/></span>}
      <label htmlFor={id} className="ra-sr-only">{label}</label>
      {/* A one-line TextArea, not an <input>: the example text and long
          words wrap instead of being cut off at large text sizes. Enter
          searches; line breaks are removed. */}
      <TextArea ref={ref} id={id} singleLine rows={1} aria-multiline="false" enterKeyHint="search" autoComplete="off"
        spellCheck={false} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          flex: '1 1 8em', width: 'auto', minWidth: 0, minHeight: TARGET.min, border: 0, borderRadius: 0, background: 'transparent',
          fontFamily: F2, fontSize: RA2_INPUT_FONT, color: C2.char, padding: '11px 4px',
        }}/>
      {value && <IconButton icon="close" label={t('ds.search.clear')} variant="ghost" size="sm" onClick={() => { onChange(''); ref?.current?.focus?.(); }}/>}
      {onVoice && <IconButton icon="mic" label={t('ds.search.voice')} variant="ghost" onClick={onVoice} style={{ color: C2.teal }}/>}
      {changed && <IconButton icon="search" label={t('ds.search.submit')} variant="filled" type="submit"/>}
    </form>
  );
});

export { SearchField };
