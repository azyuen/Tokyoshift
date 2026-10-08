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

test('intro professional cups are all less lucrative than the four-wide championship', () => {
  assert.equal(PRO_DRAG_EVENTS.length,3);
  const meetSource = load('../src/scenes/MeetScene.js');
  assert.match(meetSource, /ELITE: \{ entryFee: 50000, cashPrize: 70000 \}/);
  assert.equal(FOUR_WIDE_CUP.entryFee, 90000);
  assert.ok(FOUR_WIDE_CUP.prizeCash[0] > PRO_DRAG_EVENTS[2].prizeCash);
  assert.ok(FOUR_WIDE_CUP.entryFee > PRO_DRAG_EVENTS[2].entryFee);
  assert.ok(PRO_DRAG_EVENTS[0].entryFee > 50000);
  assert.ok(PRO_DRAG_EVENTS[0].prizeCash > 70000);
  const expected=[
    {id:'streetShootout',entryFee:55000,prizeCash:95000},
    {id:'midnightCup',entryFee:65000,prizeCash:135000},
    {id:'tokyoInvitational',entryFee:80000,prizeCash:190000},
  ];
  for(let i=0;i<3;i++){
    const event=PRO_DRAG_EVENTS[i];
    assert.deepEqual({id:event.id,entryFee:event.entryFee,prizeCash:event.prizeCash},expected[i]);
    assert.ok(event.prizeCash<FOUR_WIDE_CUP.prizeCash[0]);
    assert.ok(event.prizeCash>event.entryFee);
  }
});

test('all new professional race entries use four-lane complex; only 2 cars for pro duels', () => {
  assert.match(central,/this\.scene\.start\('FourLaneTestScene', \{ mode: 'PRO_DUEL' \}\)/);
  assert.match(central,/RESUME PRO CUP/);
  assert.match(central,/PRO_DUEL/);
  assert.match(scene,/this\.proDuel = data\.mode === 'PRO_DUEL'/);
  assert.match(scene,/this\.proDuelInfo\.round\.carId/);
  assert.match(scene,/if \(!this\.proDuel\) while \(this\.aiCarIds\.length < 3\)/);
  assert.match(scene,/rivalRound\?\.opponentBuildState/);
  assert.match(scene,/settleProfessionalDuel\(state, playerWon\)/);
  assert.match(scene,/this\.scene\.restart\(\{ mode: duel \? 'PRO_DUEL' : 'PRO_CUP' \}\)/);
  assert.match(scene,/this\.proCup \|\| this\.proDuel/);
});

test('professional endings use angled manga portrait, large sign and top-depth tap-anywhere', () => {
  assert.match(scene,/showProfessionalMangaResult\(standings, outcome\)/);
  assert.match(scene,/new Phaser\.Geom\.Point\(56, 55\)/);
  assert.match(scene,/createCharacterProfile\(this, \{/);
  assert.match(scene,/createGeometryMask\(\)/);
  assert.match(scene,/fontSize: titleText\.length > 9 \? '66px' : '87px'/);
  assert.match(scene,/TAP ANYWHERE/);
  assert.match(scene,/setDepth\(depth \+ 95\)\.setScrollFactor\(0\)/);
  assert.match(scene,/tap\.on\('pointerdown', advance\)/);
  assert.match(scene,/enter\.on\('down', advance\)/);
  assert.match(scene,/this\.time\.delayedCall\(360, \(\) => \{ armed = true; \}\)/);
});

test('free developer 4-lane tester continues to exist and does not collect pro fees', () => {
  assert.match(scene,/this\.proDuel = data\.mode === 'PRO_DUEL'/);
  assert.match(scene,/this\.proCup = data\.mode === 'PRO_CUP'/);
  assert.match(scene,/else if \(!isArkonDen\(this\.registry\)\)/);
  assert.match(central,/'4-LANE TEST'/);
  assert.match(scene,/showFourLaneResults\(\)/);
});
