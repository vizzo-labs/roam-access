// ja: all namespaces merged. Missing keys fall back to English.
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
import business from './business';

const dict = { ...common, ...app, ...ds, ...explore, ...onboarding, ...me, ...card, ...data, ...venue, ...review, ...trust, ...photos, ...ask, ...facts, ...layers, ...community, ...sensory, ...preview, ...arrival, ...nearby, ...business };
export default dict as Dict;
