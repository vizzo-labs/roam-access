'use client';
// Accessibility settings: the read-aloud switch and speaking speed (#21).

import React from 'react';
import { C2 } from '../ui/palette';
import { V2Switch } from '../ui/Switch';
import { SegmentedControl, SPACE, TYPE } from '../ds';
import { useT } from './I18nProvider';
import { setSpeechPrefs, useSpeechPrefs, useSpeechSupported } from './speech';

export function ReadAloudSettings() {
  const t = useT();
  const prefs = useSpeechPrefs();
  const ok = useSpeechSupported();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ ...TYPE.label, fontSize: 15.5, color: C2.char }}>{t('common.readAloud.setting')}</div>
          <div style={{ ...TYPE.caption, fontWeight: 400, color: C2.slate }}>
            {ok ? t('common.readAloud.settingHint') : t('common.readAloud.unsupported')}
          </div>
        </div>
        <V2Switch checked={prefs.enabled && ok} onChange={() => setSpeechPrefs({ enabled: !prefs.enabled })} label={t('common.readAloud.setting')}/>
      </div>
      {ok && prefs.enabled && (
        <SegmentedControl label={t('common.readAloud.speed')} value={prefs.rate < 1 ? 'slow' : 'normal'}
          onChange={v => setSpeechPrefs({ rate: v === 'slow' ? 0.8 : 1 })} style={{ marginTop: SPACE.sm }}
          options={[{ value: 'slow', label: t('common.readAloud.slower') }, { value: 'normal', label: t('common.readAloud.normal') }]}/>
      )}
    </div>
  );
}
