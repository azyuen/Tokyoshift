import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUTSCENES, CUTSCENE_ORDER } from '../src/data/cutscenes.js';
import { CHAPTER08_SCENES } from '../src/data/chapter08.js';
import { CHAPTER09_SCENES } from '../src/data/chapter09.js';
import { cars } from '../src/data/cars.js';
import { isTunerShopUnlocked } from '../src/data/tunerShops.js';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import { startProfessionalSeason } from '../src/data/proSeason.js';

const src = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const words = scene => (scene?.pages || []).map(p => p.text || '').join(' ');

test('Chapter 8 invitation remains secret; Chapter 9 mentions a surname but shows no Aruken portrait', () => {
  for (const [id, scene] of Object.entries(CHAPTER08_SCENES)) {
    assert.doesNotMatch(words(scene), /Denzaki|Aruken|Arkon Den/i, id);
  }
  const intro = CHAPTER09_SCENES.chapter09Welcome;
  assert.match(words(intro), /Denzaki-san/);
  assert.match(words(intro), /don.t worry about the paperwork/i);
  assert.ok(intro.pages.every(p => !Object.values(p).includes('arkonDen')));
  assert.ok(intro.pages.some(p => p.leftCharacter === 'sayakaFujieda'));
});

test('Aruken and Sayaka sponsor the first season without labelling their romance', () => {
  const scene = CUTSCENES.proSponsorIntroduction;
  assert.equal(scene.once, true);
  assert.ok(CUTSCENE_ORDER.includes(scene.id));
  assert.match(words(scene), /registration fees/i);
  assert.match(words(scene), /bond/i);
  assert.match(words(scene), /insurance/i);
  assert.match(words(scene), /workspace rentals/i);
  assert.match(words(scene), /employee contributions/i);
  assert.match(words(scene), /We.re sponsoring the team/i);
  assert.match(words(scene), /Ginza Motor Gallery/i);
  assert.match(words(scene), /good to finally meet you/i);
  assert.match(words(scene), /Sayaka.s shown me/i);
  assert.match(words(scene), /Liberty Walk 240Z/i);
  assert.doesNotMatch(words(scene), /my wife|my girlfriend|my partner in life|in love/i);
});

test('Exhibition race is first season only and uses the story 240Z with ordinary build rules', () => {
  assert.ok(cars.arkonLibertyWalk240z);
  assert.equal(cars.arkonLibertyWalk240z.storyBodyConversion, true);
  const coordinator = src('src/ui/ProSponsorStory.js');
  const race = src('src/scenes/RaceScene.js');
  const panel = src('src/ui/ProSeasonPanel.js');
  assert.match(coordinator, /season === 1/);
  assert.match(coordinator, /arkonLibertyWalk240z/);
  assert.match(coordinator, /selectedOpponentBuildState/);
  assert.match(coordinator, /proSponsorRaceComplete/);
  assert.match(race, /this.raceMode === 'PRO_SPONSOR'/);
  assert.match(race, /proSponsorExhibition: true/);
  assert.match(race, /No official win, loss or fee is recorded/);
  assert.match(race, /this.registry.set\('selectedRaceCategory', 'SINGLE'\)/);
  assert.match(panel, /next.circuit.season === 1/);
  assert.match(panel, /startProfessionalSeason\(circuit\(s\)\)/);
  const next = startProfessionalSeason(createDefaultProCircuitState());
  assert.equal(next.error, undefined);
  assert.equal(next.circuit.seasonStatus, 'ACTIVE');
  assert.equal(next.circuit.calendar.round, 0);
});

test('Ginza Liberty Walk is story gated; no new cash or generic tuner unlock', () => {
  assert.equal(isTunerShopUnlocked({ gameMode:'career', cash:0 }, 'CENTRAL_TOKYO'), false);
  assert.equal(isTunerShopUnlocked({ gameMode:'career', cash:0,
    cutscenesSeen:['proSponsorIntroduction'] }, 'CENTRAL_TOKYO'), false);
  assert.equal(isTunerShopUnlocked({ gameMode:'career', cash:0,
    cutscenesSeen:['proSponsorEpilogue'] }, 'CENTRAL_TOKYO'), true);
  assert.equal(isTunerShopUnlocked({ gameMode:'arkonStory', cash:0,
    cutscenesSeen:['proSponsorEpilogue'] }, 'CENTRAL_TOKYO'), false);
  const ending = CUTSCENES.proSponsorEpilogue;
  assert.match(words(ending), /Pop by Ginza/i);
  assert.equal(ending.characters.left, 'sayakaFujieda');
  assert.equal(ending.characters.right, 'arkonDen');
  assert.equal(ending.finalActionLabel, 'START PRO SEASON');
});
