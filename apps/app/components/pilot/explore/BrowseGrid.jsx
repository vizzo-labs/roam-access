'use client';

import React from 'react';
import { RA2_TILES } from '@/lib/pilot-data';
import { tileLabel } from '@/lib/i18n/data';
import { TileButton } from '../ds/TileButton';
import { useT } from '../i18n';

const ALL = { cats: [], tags: [], label: 'All places', raw: '' };
const ICON = { food: 'food', parks: 'tree', arts: 'palette' };

// Two columns on a phone, one at 200 % text (the words never break).
// Find's ways to start without typing: "Near me now" (all places, nearest
// first, from my location when I share it) and four big buttons. "Toilets"
// opens the accessible-toilets list; places to stay are still found by
// searching ("hotel").
function BrowseGrid({ app, style }) {
  const t = useT();
  const tiles = RA2_TILES.filter(x => ICON[x.id]);
  return (
    <nav aria-label={t('find.browse')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 9em), 1fr))', gap: 10, ...style }}>
      <TileButton wide icon="locate" label={t('find.nearMe')} onClick={app.nearMe}/>
      {tiles.map(tile => (
        <TileButton key={tile.id} icon={ICON[tile.id]} label={tileLabel(t, tile.id)}
          onClick={() => app.runSearch({ cats: tile.cats, tags: [], label: tile.label, raw: '' })}/>
      ))}
      <TileButton icon="toilet" label={t('find.toilets')} onClick={() => app.goto('toilets')}/>
    </nav>
  );
}

export { BrowseGrid, ALL };
