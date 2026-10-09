import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRO_DRAG_EVENTS } from '../src/data/centralTokyo.js';
import { FOUR_WIDE_CUP } from '../src/data/proTournament.js';
import { getProfessionalDuelRound } from '../src/data/proDragDuel.js';

const central=fs.readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const pro=fs.readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');

test('three fixed public event cards are two driver cups and one four-wide trophy',()=>{
  const block=central.match(/getProDragEvents\(\) \{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.match(block,/PRO_DRAG_EVENTS\[0\]/);
  assert.match(block,/PRO_DRAG_EVENTS\[1\]/);
  assert.match(block,/id: FOUR_WIDE_CUP\.id/);
  assert.doesNotMatch(block,/PRO_DRAG_EVENTS\[2\]/);
  assert.match(block,/fourWide: true/);
  assert.match(central,/event\.fourWide \? 'TROPHY COMP \/\/ 4-WIDE'/);
  assert.match(central,/'PRO COMP \/\/ DRIVER'/);
  assert.match(central,/event\.entryFee/);
  assert.equal(PRO_DRAG_EVENTS.length,3); // historical event definitions retained for saved brackets
  assert.equal(FOUR_WIDE_CUP.entryFee,90000);
});

test('no duplicate four-wide entry, standalone dev test or right sidebar dev refresh',()=>{
  assert.doesNotMatch(central,/drawFourWideCupEntry/);
  assert.doesNotMatch(central,/'4-LANE TEST'/);
  assert.doesNotMatch(pro,/isArkonDen\(this\.registry\)/);
  assert.match(pro,/standalone dev tester is retired/i);
  assert.match(central,/LOCATION_BY_ID\[this\.activeLocationId\]\?\.kind !== 'proDrag'/);
  assert.match(central,/x = STAGE\.x \+ STAGE\.w - 135/);
  assert.match(central,/D\) REFRESH LINEUP/);
});

test('single right panel action routes paid events and resumed heats, without other controls',()=>{
  assert.match(central,/this\.drawDragSide\(events\[this\.selectedEventIndex\], build\)/);
  assert.match(central,/this\.enterFourWideCup\(\)/);
  assert.match(central,/this\.startProBracket\(event, build\)/);
  assert.match(central,/RESUME FOUR-WIDE OPEN/);
  assert.match(central,/RESUME PRO CUP/);
  assert.match(central,/SIDE\.y \+ 590/);
  assert.match(central,/SIDE\.y \+ 674/); // existing map button remains
  assert.match(central,/FINISH YOUR ACTIVE EVENT FIRST/);
  assert.match(central,/eventId: event\.id/);
  assert.match(central,/activeDuel\.eventId === 'tokyoInvitational'/);
});

test('active legacy three-round cup stays resumable under the new three slot layout',()=>{
  const legacy={active:true,proEvent:true,roundIndex:1,playerCarId:'ae86',
    entryFee:100000,prizeCash:1200000,rounds:[{carId:'r32'},{carId:'evo3'},{carId:'wrx22b'}]};
  const round=getProfessionalDuelRound(legacy);
  assert.equal(round.roundNumber,2);
  assert.equal(legacy.prizeCash,1200000);
  assert.match(central,/REGISTERED PRIZE/);
  assert.match(central,/ACTIVE PRO CUP/);
});

test('manga ending uses smaller angled portrait, red/charcoal/white motif, next stage and low standings',()=>{
  const start=pro.indexOf('showProfessionalMangaResult(standings, outcome) {');
  assert.ok(start>=0);
  const section=pro.slice(start,pro.indexOf('  showFourLaneResults() {',start));
  assert.match(section,/new Phaser\.Geom\.Point\(88, 114\)/);
  assert.match(section,/frameWidth: 455, frameHeight: 460/);
  assert.match(section,/const accent = 0xd44953/);
  assert.match(section,/STAGE ' \+ stageNumber \+ '\/3 COMPLETE/);
  assert.match(section,/NEXT: ' \+ nextStage/);
  assert.match(section,/const y = 384 \+ 40 \* index/);
  assert.doesNotMatch(section,/PRO RANKING/);
  assert.match(section,/this\.add\.ellipse\(470, 557/);
  assert.match(section,/fontFamily: '"Exo 2", sans-serif'/);
  assert.match(section,/TAP ANYWHERE/);
  assert.match(section,/setDepth\(depth \+ 95\)/);
  assert.match(section,/this\.scene\.restart\(\{ mode: duel \? 'PRO_DUEL' : 'PRO_CUP' \}\)/);
});
