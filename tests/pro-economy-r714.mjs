import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDefaultProCircuitState, normaliseProCircuitState, PRO_CIRCUIT_TROPHIES } from '../src/data/proCircuit.js';
import { PRO_DRAG_EVENTS } from '../src/data/centralTokyo.js';
import { FOUR_WIDE_CUP } from '../src/data/proTournament.js';
import {
  OPEN_CIRCUIT_CREW_FEE, OPEN_CIRCUIT_TROPHY_FEE, PRO_INVITATIONAL_DRIVER_FEE,
  PRO_INVITATIONAL_DRIVER_PRIZE, CREW_SERIES, PRO_ALT_CREW_ENTRY_FEE, PRO_ALT_CREW_PRIZES,
  PRO_SEASON_RANKING_PRIZES, getProfessionalSeasonBonus, claimProfessionalSeasonBonus,
  getProfessionalSeasonReport, nextProfessionalSeason, settleLegacySeasonEvent,
  completeProfessionalTimedEvent,
} from '../src/data/proSeason.js';

test('Aruken funds new pro registrations without touching the Tokyo title purse',()=>{
  for(const fee of [OPEN_CIRCUIT_CREW_FEE, OPEN_CIRCUIT_TROPHY_FEE,
    PRO_INVITATIONAL_DRIVER_FEE, CREW_SERIES.entryFee, PRO_ALT_CREW_ENTRY_FEE, FOUR_WIDE_CUP.entryFee])
    assert.equal(fee,0);
  assert.ok(PRO_DRAG_EVENTS.every(e=>e.entryFee===0));
  assert.ok(PRO_CIRCUIT_TROPHIES.every(t=>t.entryFee===0));
  assert.equal(readFileSync(new URL('../src/data/tokyoChampionship.js',import.meta.url),'utf8')
    .includes('10000000,5000000,3000000'),true);
});

test('new standard, open, invitational and prestige cash scales',()=>{
  assert.equal(PRO_DRAG_EVENTS[0].prizeCash,475000);
  assert.equal(PRO_DRAG_EVENTS[1].prizeCash,675000);
  assert.equal(PRO_INVITATIONAL_DRIVER_PRIZE,1250000);
  assert.deepEqual(CREW_SERIES.prizes,[1050000,450000,200000,50000]);
  assert.deepEqual(PRO_ALT_CREW_PRIZES,[1250000,575000,250000,50000]);
  assert.deepEqual(FOUR_WIDE_CUP.prizeCash,[1600000,850000,450000,250000]);
  assert.deepEqual(PRO_CIRCUIT_TROPHIES.map(t=>t.prizeCash),
    [1150000,1075000,1325000,1500000,1875000]);
  assert.ok(PRO_CIRCUIT_TROPHIES.every(t=>t.repeatCash>0&&t.repeatCash<t.prizeCash));
});

test('completed professional defeat earns consolation and cannot be settled twice',()=>{
  const c=createDefaultProCircuitState();
  const state={proSeasonId:'open:consolation:s1:e1',openCircuit:true,
    eventId:'streetShootout',prizeCash:285000,rounds:Array.from({length:3},()=>({
      characterId:'unknown',encounterRating:3,
    }))};
  const result=settleLegacySeasonEvent(c,state,0,0);
  assert.ok(result.lastTournament.cashPrize>=30000);
  assert.equal(result.lastTournament.points,0);
  assert.equal(result.calendar.round,0);
  assert.deepEqual(settleLegacySeasonEvent(result,state,0,0),result);
});

test('timed runner gets real winnings even at second place',()=>{
  let c=createDefaultProCircuitState();
  c.seasonStatus='ACTIVE';
  c.activeTimedEvent={
    id:'timed:s1:r0',round:0,format:'TIME_ATTACK',carId:'r32',
    attempts:[11.5,11.6,11.7].map(finishSeconds=>({finishSeconds,disqualified:false})),
    rivalAttempts:[10.5,10.6,10.7].map(finishSeconds=>({finishSeconds,disqualified:false})),
  };
  const result=completeProfessionalTimedEvent(c);
  assert.ok(!result.error,result.error);
  assert.ok(result.cashPrize>=100000);
  assert.equal(result.circuit.calendar.round,1);
  assert.equal(completeProfessionalTimedEvent(result.circuit).error,'THREE COMPLETED ATTEMPTS REQUIRED');
});

test('rank prizes are once-only, persisted and must be claimed before season reset',()=>{
  const c=createDefaultProCircuitState();
  c.seasonStatus='COMPLETE';c.calendar.round=8;
  c.calendar.result={season:1,
    drivers:[{id:'player:driver'}, {id:'pro:02'}],
    teams:[{id:'pro:01'},{id:'player:team'}],
  };
  const expected=PRO_SEASON_RANKING_PRIZES.first+PRO_SEASON_RANKING_PRIZES.top3;
  assert.equal(getProfessionalSeasonBonus(c).total,expected);
  assert.equal(getProfessionalSeasonReport(c).seasonBonus.total,expected);
  assert.match(nextProfessionalSeason(c).error,/COLLECT SEASON/);
  const paid=claimProfessionalSeasonBonus(c);
  assert.equal(paid.cashPrize,expected);
  assert.equal(getProfessionalSeasonBonus(paid.circuit).claimed,true);
  assert.deepEqual(normaliseProCircuitState(paid.circuit).seasonBonusClaimed,[1]);
  assert.equal(claimProfessionalSeasonBonus(paid.circuit).cashPrize,0);
  const next=nextProfessionalSeason(paid.circuit);
  assert.ok(next.circuit,next.error);
  assert.equal(next.circuit.season,2);
  assert.deepEqual(next.circuit.seasonBonusClaimed,[1]);
  assert.equal(getProfessionalSeasonBonus(next.circuit),null);
});

test('client presentation and stamp agree with sponsor economy',()=>{
  const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.equal(JSON.parse(source('version.json')).build,'R714');
  assert.match(source('src/ui/ProSeasonPanel.js'),/COLLECT /);
  assert.match(source('src/ui/ProSeasonPanel.js'),/ARUKEN SPONSORSHIP/);
  assert.match(source('src/scenes/FourLaneTestScene.js'),/final\.cashPrize/);
  assert.match(source('src/main.js'),/FourLaneTestScene\.js\?v=20261029-r714/);
});
