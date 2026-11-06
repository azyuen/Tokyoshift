import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  getProfessionalDuelRound, settleProfessionalDuel,
} from '../src/data/proDragDuel.js';
import { PRO_DRAG_EVENTS } from '../src/data/centralTokyo.js';
import { FOUR_WIDE_CUP } from '../src/data/proTournament.js';

const load = (name) => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
const scene = load('../src/scenes/FourLaneTestScene.js');
const central = load('../src/scenes/CentralTokyoScene.js');

function duel(prizeCash = 60000) {
  return {
    active: true, proEvent: true, returnScene: 'CentralTokyoScene',
    playerCarId: 'ae86', prizeCash, prizeType: 'CASH', roundIndex: 0,
    rounds: [
      { carId: 'evo3', characterId: 'renMizuno', encounterRating: 4 },
      { carId: 'r32', characterId: 'kaitoFujimori', encounterRating: 5 },
      { carId: 'wrx22b', characterId: 'ayaKurose', encounterRating: 5 },
    ],
  };
}

test('pro three-round bracket preserves saved opponents and selected car', () => {
  const state = duel();
  const first = getProfessionalDuelRound(state);
  assert.deepEqual([first.roundIndex, first.roundNumber, first.totalRounds], [0,1,3]);
  assert.equal(first.round.carId, 'evo3');
  assert.equal(state.playerCarId,'ae86');
  assert.equal(getProfessionalDuelRound({ ...state, active:false }), null);
});

test('first and second win progress rounds without immediate prize', () => {
  let current=duel();
  for(let round=1;round<=2;round++){
    const progress=settleProfessionalDuel(current,true);
    assert.equal(progress.status,'ADVANCED');
    assert.equal(progress.cashPrize,0);
    assert.equal(progress.competitionWinsDelta,0);
    assert.equal(progress.nextState.roundIndex,round);
    current=progress.nextState;
  }
  assert.equal(getProfessionalDuelRound(current).round.carId,'wrx22b');
});

test('final third win pays once and clears bracket', () => {
  const current = { ...duel(), roundIndex:2 };
  const final=settleProfessionalDuel(current,true);
  assert.equal(final.status,'CHAMPION');
  assert.equal(final.cashPrize,60000);
  assert.equal(final.competitionWinsDelta,1);
  assert.equal(final.nextState,null);
  const duplicate=settleProfessionalDuel(final.nextState,true);
  assert.equal(duplicate.status,'NO_EVENT');
  assert.equal(duplicate.cashPrize,0);
});

test('any loss ends the simple professional cup with no prize', () => {
  for(const n of [0,1,2]){
    const out=settleProfessionalDuel({ ...duel(),roundIndex:n },false);
    assert.equal(out.status,'ELIMINATED');
    assert.equal(out.roundNumber,n+1);
    assert.equal(out.nextState,null);
    assert.equal(out.cashPrize,0);
  }
});

test('invalid or corrupt legacy pro cup cannot secretly pay cash', () => {
  for(const data of [null,{}, { ...duel(), proEvent:false },
    { ...duel(), roundIndex:9 }, { ...duel(), rounds:[] }]){
    assert.equal(settleProfessionalDuel(data,true).status,'NO_EVENT');
  }
});

test('sponsored professional entry preserves larger four-wide purses',()=>{
  assert.equal(PRO_DRAG_EVENTS.length,3);
  assert.equal(FOUR_WIDE_CUP.entryFee,0);
  const expected=[['streetShootout',475000],['midnightCup',675000],['tokyoInvitational',950000]];
  for(let i=0;i<3;i++){
    assert.equal(PRO_DRAG_EVENTS[i].id,expected[i][0]);
    assert.equal(PRO_DRAG_EVENTS[i].entryFee,0);
    assert.equal(PRO_DRAG_EVENTS[i].prizeCash,expected[i][1]);
    assert.ok(PRO_DRAG_EVENTS[i].prizeCash<FOUR_WIDE_CUP.prizeCash[0]);
  }
});

test('all new professional race entries use four-lane complex; only 2 cars for pro duels', () => {
  assert.match(central,/this\.scene\.start\('FourLaneTestScene', \{ mode: 'PRO_DUEL' \}\)/);
  assert.match(central,/RESUME EVENT BRIEFING/);
  assert.match(central,/PRO_DUEL/);
  assert.match(scene,/this\.proDuel = data\.mode === 'PRO_DUEL'/);
  assert.match(scene,/this\.proDuelInfo\.round\.carId/);
  assert.match(scene,/if \(!this\.proDuel && !this\.champMode\) while \(this\.aiCarIds\.length < 3\)/);
  assert.match(scene,/rivalRound\?\.opponentBuildState/);
  assert.match(scene,/settleProfessionalDuel\(state, playerWon\)/);
  assert.match(scene,/this\.scene\.restart\(\{ mode: duel \? 'PRO_DUEL' : 'PRO_CUP' \}\)/);
  assert.match(scene,/this\.proCup \|\| this\.proDuel/);
});

test('professional endings use angled manga portrait, large sign and top-depth tap-anywhere', () => {
  assert.match(scene,/showProfessionalMangaResult\(standings, outcome\)/);
  assert.match(scene,/new Phaser\.Geom\.Point\(individualHeatPreview \? 112 : 88, individualHeatPreview \? 58 : 114\)/);
  assert.match(scene,/createCharacterProfile\(this, \{/);
  assert.match(scene,/createGeometryMask\(\)/);
  assert.match(scene,/fontSize: titleText\.length > 9 \? '66px' : '87px'/);
  assert.match(scene,/NEXT HEAT/);
  assert.match(scene,/setDepth\(depth \+ 95\)\.setScrollFactor\(0\)/);
  assert.match(scene,/tap\.on\('pointerdown', advance\)/);
  assert.match(scene,/enter\.on\('down', advance\)/);
  assert.match(scene,/this\.time\.delayedCall\(360, \(\) => \{ armed = true; \}\)/);
});

test('standalone developer test entry is retired in favour of fully playable pro modes', () => {
  assert.match(scene,/this\.proDuel = data\.mode === 'PRO_DUEL'/);
  assert.match(scene,/this\.proCup = data\.mode === 'PRO_CUP'/);
  assert.doesNotMatch(scene,/else if \(!isArkonDen\(this\.registry\)\)/);
  assert.doesNotMatch(central,/'4-LANE TEST'/);
  assert.match(scene,/showFourLaneResults\(\)/);
});
