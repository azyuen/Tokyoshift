import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CHAPTER08_SCENES } from '../src/data/chapter08.js';
import { CUTSCENES, CUTSCENE_ORDER } from '../src/data/cutscenes.js';

const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('Chapter 08 has the five Warehouse beats and the Ginza reveal', () => {
  const ids = ['chapter08Warehouse','chapter08ManagerCall','chapter08WarehouseReaction',
    'chapter08SayakaCall','chapter08WarehouseFarewell','chapter08Ginza'];
  for (const id of ids) {
    assert.ok(CHAPTER08_SCENES[id], id + ' is authored');
    assert.equal(CUTSCENES[id], CHAPTER08_SCENES[id], id + ' is registered');
    assert.ok(CUTSCENE_ORDER.includes(id), id + ' is available to developer tools');
    assert.equal(CHAPTER08_SCENES[id].once, true);
  }
});

test('invitations preserve the manager identity and personal conversation', () => {
  assert.equal(CHAPTER08_SCENES.chapter08ManagerCall.presentation, 'phone');
  assert.equal(CHAPTER08_SCENES.chapter08ManagerCall.callerId, 'masatoKuroda');
  assert.equal(CHAPTER08_SCENES.chapter08SayakaCall.presentation, 'phone');
  assert.equal(CHAPTER08_SCENES.chapter08SayakaCall.callerId, 'sayakaFujieda');
  const last = CHAPTER08_SCENES.chapter08WarehouseFarewell.pages.map(p => p.text);
  assert.deepEqual(last, [
    'Well, that was mysterious.',
    'Does your family friend always do that?',
    'Pretty much.',
  ]);
});

test('the gallery reveal follows Porsche identification and precedes race-gear role', () => {
  const pages = CHAPTER08_SCENES.chapter08Ginza.pages;
  const beatIndex = key => pages.findIndex(page => page.cinematicBeat === key);
  assert.ok(beatIndex('chapter08SayakaExit') >= 0);
  assert.ok(beatIndex('chapter08SayakaGallery') > beatIndex('chapter08SayakaExit'));
  assert.ok(beatIndex('chapter08FinalPortrait') > beatIndex('chapter08SayakaGallery'));
  assert.ok(pages.some(page => page.text.includes("THAT WAS YOU")));
  assert.ok(pages.some(page => page.text.includes('team manager and strategist')));
  assert.equal(pages[beatIndex('chapter08FinalPortrait')].leftPose, 'track');
});

test('winning all seven crew battles routes through HQ and does not award the scripted race', () => {
  const race = source('src/scenes/RaceScene.js');
  const story = source('src/ui/Chapter08Story.js');
  assert.match(race, /settlement\?\.crewBattleFirstClear\s*&&[\s\S]*?tokyoChampionshipInvited/);
  assert.match(race, /workshopLocationId.*shinonomeWarehouseStrip/);
  assert.match(race, /this\.raceMode === 'CHAPTER08'/);
  assert.match(race, /chapter08RaceFinished/);
  assert.match(race, /chapter08Story: true/);
  assert.match(race, /PARK AT GINZA MOTOR GALLERY/);
  assert.match(story, /selectedRaceDeal', 'CHAPTER08_STORY'/);
  assert.match(story, /selectedRaceStake', 0/);
  assert.match(story, /travelMode: 'chapter08Ginza'/);
});

test('Chapter 08 uses three manual fanning poses then racing gear after acceptance', () => {
  const story = source('src/ui/Chapter08Story.js');
  const gallery = source('src/ui/SwipePortraitGallery.js');
  assert.match(story,/pose:'homeNormal',subtitle:'Family friend'/);
  assert.match(story,/pose:'oshiageNeutral',subtitle:'Lady instructor'/);
  assert.match(story,/pose:'ginzaNormal',subtitle:'Ginza gallery curator'/);
  assert.match(story,/TEAM MANAGER & STRATEGIST/);
  assert.match(gallery,/pose: entry.pose \|\| 'idle'/);
  assert.match(gallery,/roleSubtitle\.setText/);
});

test('Ginza story keeps the RWB in the standard gallery room without making it buyable', () => {
  const ginza = source('src/scenes/CentralTokyoScene.js');
  assert.match(ginza,/storyShowroom[\s\S]*rwbStellaPorsche/);
  assert.match(ginza,/if \(!storyShowroom\)/);
  assert.match(ginza,/if \(listing && !storyShowroom\)/);
  assert.match(ginza,/this\.chapter08Kaede/);
  const story = source('src/ui/Chapter08Story.js');
  assert.match(story,/chapter08Kaede/);
  assert.match(story,/proCircuitStrategistReveal/);
});
