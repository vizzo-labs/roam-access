'use client';
// "Read aloud" (#21): reads a summary or verdict with a voice for the
// language it's written in. Shown only where speech is available and the
// setting is on; never starts by itself. Stops on navigation.

import React from 'react';
import { Button, useReducedMotion } from '../ds';
import { useLocale } from './I18nProvider';
import { speak, stopSpeaking, useSpeechPrefs, useSpeechSupported, warmVoices } from './speech';
import './i18n.css';

/**
 * <ReadAloud text={() => summary} what={t('venue.readWhat')}/>
 *   text  string or () => string (built at press time)
 *   what  what is read, for the button's name ("the verdict for Hugos")
 *   lang  language of `text` (defaults to the UI language — right whenever
 *         the text comes from t())
 */
export function ReadAloud({ text, what, lang, size = 'sm', variant = 'outline', style }) {
  const { t, def } = useLocale();
  const prefs = useSpeechPrefs();
  const reduced = useReducedMotion();
  const ok = useSpeechSupported();
  const [speaking, setSpeaking] = React.useState(false);
  React.useEffect(() => { warmVoices(); }, []);
  // Leaving the screen (or switching language) stops the voice.
  React.useEffect(() => () => { if (speaking) stopSpeaking(); }, [speaking]);
  if (!ok || !prefs.enabled) return null;

  const onClick = () => {
    if (speaking) { stopSpeaking(); return; }
    const s = typeof text === 'function' ? text() : text;
    // Called synchronously inside the click: iOS Safari only speaks from a gesture.
    if (speak(s, lang || def.speech, { rate: prefs.rate, onDone: () => setSpeaking(false) })) setSpeaking(true);
  };
  return (
    <Button variant={variant} size={size} icon={speaking ? 'stop' : 'speaker'} onClick={onClick}
      aria-label={speaking ? t('common.readAloud.stopNamed', { what }) : t('common.readAloud.named', { what })}
      className={speaking && !reduced ? 'ra-speaking' : undefined} style={style}>
      {speaking ? t('common.readAloud.stop') : t('common.readAloud.start')}
    </Button>
  );
}
