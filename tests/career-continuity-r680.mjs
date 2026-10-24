import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CUTSCENES} from '../src/data/cutscenes.js';
import {CHAPTER08_SCENES} from '../src/data/chapter08.js';
import {characters} from '../src/data/characters.js';
import {STORY_CHAPTERS} from '../src/data/storyChapters.js';
import {WORKSHOP_TIERS} from '../src/data/workshopProgression.js';
const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const content=scene=>scene.pages.map(p=>p.text||'').join(' ');

test('family friend is friend of both ordinary non-racing parents; secret restoration stays unnamed',()=>{
  const sayaka=characters.sayakaFujieda;
  assert.match(sayaka.bio,/friend of both the player.s parents/i);
  assert.doesNotMatch(sayaka.bio+' '+sayaka.introQuote,/father.{0,50}rac|ex-pro|professional racer|father would want/i);
  const station=CUTSCENES.openingStationEncounter;
  const keys=CUTSCENES.openingSayakaKeys;
  const daichi=CUTSCENES.openingDaichiAfterSayaka;
  assert.match(content(station),/known my family for years/i);
  assert.match(content(keys),/Your parents say/i);
  assert.match(content(keys),/A friend and I helped find you/i);
  assert.match(content(daichi),/some friends helped get it ready/i);
  assert.doesNotMatch(content(station)+' '+content(keys)+' '+content(daichi),/Aruken|Denzaki|ex-pro|racing father|father.s racing/i);
});
test('Warehouse rental clue is subtle, and old specialist Porsche arrival stays on page four',()=>{
  const scene=CUTSCENES.warehouseHqUnlocked;
  assert.equal(scene.pages.length,9);
  assert.match(scene.pages[0].text,/lease is a bargain/i);
  assert.match(scene.pages[0].text,/fit it out/i);
  assert.equal(scene.pages[3].cinematicBeat,'rwbArrival');
  assert.match(scene.pages[4].text,/Ginza collection/i);
  assert.match(scene.pages[6].text,/Only through work orders. We.ve never met/i);
  assert.doesNotMatch(content(scene),/Aruken|Denzaki|Sayaka|landlord is|owned by/i);
  const hq=WORKSHOP_TIERS.find(w=>w.id==='shinonomeWarehouseStrip');
  assert.equal(hq.unlockCost,750000);
  assert.match(source('src/scenes/GarageScene.js'),/pay to fit out the next space/i);
  assert.equal(CUTSCENES.canalYardBiggerDreams.pages.length,15);
});
test('Sayaka meets Daichi first, with Aruken absent through the completed crew scene',()=>{
  const scene=CUTSCENES.fullCrewTogether;
  assert.match(content(scene),/I.m Daichi, by the way. The engineer/i);
  assert.match(content(scene),/Sayaka! Oh, it.s just common sense/i);
  assert.doesNotMatch(content(scene),/Aruken|Denzaki|owner of Warehouse/i);
});
test('Chapter 8 invitation, Ginza identity and strategist role stay, but Aruken remains unnamed',()=>{
  const scenes=['chapter08Warehouse','chapter08ManagerCall','chapter08WarehouseReaction','chapter08SayakaCall','chapter08WarehouseFarewell','chapter08Ginza'];
  for(const id of scenes)assert.strictEqual(CUTSCENES[id],CHAPTER08_SCENES[id],id);
  assert.equal(CUTSCENES.chapter08ManagerCall.callerId,'masatoKuroda');
  assert.equal(CUTSCENES.chapter08SayakaCall.callerId,'sayakaFujieda');
  assert.match(content(CUTSCENES.chapter08SayakaCall),/somebody else who used to charge into races/i);
  const ginza=CHAPTER08_SCENES.chapter08Ginza;
  assert.match(content(ginza),/rather stubborn engineers/i);
  assert.match(content(ginza),/team manager and strategist/i);
  assert.match(content(ginza),/manage this place/i);
  assert.doesNotMatch(content(ginza),/Aruken|Denzaki|From Warehouse HQ|Arkon Den/i);
  for(const beat of ['chapter08SayakaExit','chapter08SayakaGallery','chapter08SayakaOutfitCue','chapter08FinalPortrait'])
    assert.ok(ginza.pages.some(p=>p.cinematicBeat===beat),beat);
  assert.deepEqual(STORY_CHAPTERS.map(c=>c.id),Array.from({length:9},(_,i)=>'chapter0'+(i+1)));
});
test('Standalone pre-Pro strategist disclosure also conceals Aruken',()=>{
  const pro=CUTSCENES.proCircuitStrategistReveal;
  assert.equal(pro.once,true);
  assert.match(content(pro),/join as your team strategist/i);
  assert.match(content(pro),/helping drivers and engineers with strategy/i);
  assert.doesNotMatch(content(pro),/Aruken|Denzaki|racing father|from his racing days/i);
  const careerDialogue=content(CUTSCENES.openingStationEncounter)+' '+
    content(CUTSCENES.openingSayakaKeys)+' '+content(CUTSCENES.warehouseHqUnlocked)+' '+
    content(CUTSCENES.fullCrewTogether)+' '+Object.values(CHAPTER08_SCENES).map(content).join(' ');
  assert.doesNotMatch(careerDialogue,/Aruken|Denzaki|father.s racing days|ex-professional racer/i);
});
test('Pro sponsorship is canon only: no newly introduced payment or save-state side effects',()=>{
  const canon=source('docs/CAREER_R680_PRE_PRO_CONTINUITY.md');
  assert.match(canon,/not yet implemented in R680/i);
  assert.match(canon,/We.ll cover the expenses/);
  assert.match(canon,/Too well/);
  assert.match(canon,/first meeting with Daichi/i);
  assert.doesNotMatch(source('src/data/chapter09.js'),/Aruken|Denzaki|We.ll cover the expenses/i);
  assert.match(source('src/data/chapter09.js'),/We.re not signing anything today/i);
  assert.match(source('src/ui/ProSeasonPanel.js'),/showProSeasonRegistration/);
  assert.match(source('src/ui/Chapter08Story.js'),/markCentralTokyoUnlocked/);
});
