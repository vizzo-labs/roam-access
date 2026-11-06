// All English strings, merged from one file per namespace (so parallel work
// never edits the same file). English is the source and the fallback.
import type { Dict } from '../../core';
import common from './common';
import app from './app';
import ds from './ds';
import explore from './explore';
import onboarding from './onboarding';
import me from './me';
import card from './card';
import data from './data';
import venue from './venue';
import review from './review';
import trust from './trust';
import photos from './photos';
import ask from './ask';
import facts from './facts';
import layers from './layers';
import community from './community';
import sensory from './sensory';
import preview from './preview';
import arrival from './arrival';
import nearby from './nearby';
import route from './route';

const en = { ...common, ...app, ...ds, ...explore, ...onboarding, ...me, ...card, ...data, ...venue, ...review, ...trust, ...photos, ...ask, ...facts, ...layers, ...community, ...sensory, ...preview, ...arrival, ...nearby, ...route };
export type MessageKey = keyof typeof en;
export default en as Dict;
