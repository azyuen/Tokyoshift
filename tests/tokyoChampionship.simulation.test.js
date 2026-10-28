import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import { getProQualification, nextProfessionalSeason } from '../src/data/proSeason.js';
import {
  canEnterTokyoChampionship, createProvisionalChampionship,
  getChampionshipKnockoutHeat, settleChampionshipKnockout,
  getChampionshipCrewHeat, settleChampionshipCrewHeat,
  getChampionshipFourWideHeat, settleChampionshipFourWideHeat,
  championshipStandings, settleTokyoChampionship,
} from '../src/data/tokyoChampionship.js';
const PLAYER='player:driver';
function qualifiedSeason() {
  const c=createDefaultProCircuitState();
  c.calendar.round=8;
  c.playerDriver.seasonPoints=60;
  c.playerTeam.seasonPoints=40;
  return c;
}
function snapshot(c){return structuredClone(c);}
test('championship locked before season complete or points met',()=>{
  const c=qualifiedSeason();
  assert.equal(getProQualification(c).qualified,true);
  for(const variant of [
    {...c,calendar:{...c.calendar,round:7}},
    {...c,playerDriver:{...c.playerDriver,seasonPoints:59}},
    {...c,playerTeam:{...c.playerTeam,seasonPoints:39}},
    {...c,activeTimedEvent:{id:'pending'}},
    {...c,activeCrewEvent:{id:'pending'}},
  ])assert.equal(canEnterTokyoChampionship(variant),false);
  assert.equal(canEnterTokyoChampionship(c),true);
});
function runChampionship(koWin,crewWins,fourPlace) {
  const c=qualifiedSeason(), created=createProvisionalChampionship(c);
  assert.ok(created.championship,created.error);
  let state=snapshot(created.championship);
  assert.equal(state.entrants.length,16);
  assert.equal(new Set(state.entrants.map(e=>e.id)).size,16);
  const id=state.id;
  c.activeChampionship=state;
  assert.ok(nextProfessionalSeason(c).error,'active championship blocks rollover');
  let knockoutRuns=0;
  while(state.stage==='KNOCKOUT') {
    const heat=getChampionshipKnockoutHeat(state);
    assert.ok(heat,'active knockout must provide a playable heat');
    state=settleChampionshipKnockout(state,koWin);
    state=snapshot(state);
    knockoutRuns++;
    assert.ok(knockoutRuns<=4,'knockout must terminate');
  }
  assert.equal(state.stage,'CREW');
  assert.equal(knockoutRuns,koWin?4:1);
  for(let i=0;i<3;i++){
    const heat=getChampionshipCrewHeat(state);
    assert.ok(heat);
    assert.equal(heat.index,i);
    if(i>0)assert.throws(()=>settleChampionshipCrewHeat(state,{
      carId:'crew-test-car-0',won:true,opponentId:heat.opponent.id,
    }),/DISTINCT/,'cannot reuse a registered crew car after reload');
    state=settleChampionshipCrewHeat(state,{
      carId:'crew-test-car-'+i,won:i<crewWins,opponentId:heat.opponent.id,
    });
    state=snapshot(state);
  }
  assert.equal(state.stage,'FOUR_WIDE');
  assert.equal(state.crew.results.length,3);
  let fourRuns=0;
  while(state.stage==='FOUR_WIDE') {
    const heat=getChampionshipFourWideHeat(state);
    assert.ok(heat,'active four-wide must provide a playable heat');
    const others=heat.entrants.filter(x=>x!==PLAYER);
    const order=[...others];
    order.splice(fourPlace-1,0,PLAYER);
    const finishers=order.map((id,i)=>({id,finishSeconds:10+i*.2,disqualified:false}));
    const previous=snapshot(state);
    state=settleChampionshipFourWideHeat(state,heat.id,finishers);
    assert.deepEqual(previous.fourWide.results.length,fourRuns,'settlement must not mutate saved source');
    assert.throws(()=>settleChampionshipFourWideHeat(state,heat.id,finishers),
      /MISMATCH|NO ACTIVE|INVALID/,'a completed heat cannot be recorded twice');
    state=snapshot(state);
    fourRuns++;
    assert.ok(fourRuns<=3,'four-wide must terminate');
  }
  assert.equal(state.stage,'COMPLETE');
  assert.equal(state.completed,true);
  assert.equal(state.id,id);
  assert.equal(state.fourWide.results.length,3);
  assert.equal(championshipStandings(state).length,16);
  assert.ok(state.championId);
  assert.equal(new Set(championshipStandings(state).map(e=>e.id)).size,16);
  assert.ok(state.points[PLAYER].knockout>0);
  assert.ok(state.points[PLAYER].crew>0);
  assert.ok(state.points[PLAYER].fourWide>0);
  c.activeChampionship=state;
  assert.match(nextProfessionalSeason(c).error,/CLAIM TOKYO CHAMPIONSHIP AWARDS/,
    'new season must not bypass a pending real championship reward');
  const paid=settleTokyoChampionship(c);
  assert.ok(paid.circuit,paid.error);
  assert.equal(paid.cashPrize>0,true);
  assert.equal(settleTokyoChampionship(paid.circuit).cashPrize,0,
    'a reload cannot award the same prize twice');
  const next=nextProfessionalSeason(snapshot(paid.circuit));
  assert.ok(next.circuit,'settled championship permits rollover');
  assert.equal(next.circuit.activeChampionship,null);
  assert.equal(next.circuit.championshipHistory.length,1);
  assert.equal(next.circuit.championshipHistory[0].id,id);
  assert.equal(next.circuit.season,2);
  assert.equal(next.circuit.playerDriver.seasonPoints,0);
  assert.equal(next.circuit.playerTeam.seasonPoints,0);
  return {knockoutRuns,fourRuns};
}
test('championship: win knockout, win crew, reach four-wide final',()=>{
  assert.deepEqual(runChampionship(true,3,1),{knockoutRuns:4,fourRuns:3});
});
test('championship: lose knockout, lose crew, exit first four-wide heat',()=>{
  assert.deepEqual(runChampionship(false,0,4),{knockoutRuns:1,fourRuns:1});
});
test('championship: reach semifinal then exit, results still settle',()=>{
  assert.deepEqual(runChampionship(false,1,2),{knockoutRuns:1,fourRuns:3});
});
