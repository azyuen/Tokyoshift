// Deterministic, non-destructive eight-round Professional Circuit audit.
// Run: node --test tests/proSeason.simulation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import {
  PRO_SEASON_LENGTH, PRO_SEASON_CALENDAR, PRO_QUALIFICATION,
  completeSeasonRound, getProQualification, nextProfessionalSeason,
  getProfessionalCarEligibility, getFactoryStockStatus,
  scoreProfessionalTimedRuns,
} from '../src/data/proSeason.js';

const clone = value => structuredClone(value);
const plans = {
  balanced: ['DRIVER','TEAM','DRIVER','TEAM','DRIVER','TEAM','DRIVER','TEAM'],
  driverHeavy: ['DRIVER','DRIVER','DRIVER','DRIVER','DRIVER','TEAM','TEAM','TEAM'],
  crewHeavy: ['TEAM','TEAM','TEAM','TEAM','DRIVER','DRIVER','DRIVER','DRIVER'],
  allDriver: Array(8).fill('DRIVER'),
  allCrew: Array(8).fill('TEAM'),
};
function simulate(plan,points=20) {
  let state=createDefaultProCircuitState();
  for(let round=0;round<PRO_SEASON_LENGTH;round++) {
    const discipline=plan[round];
    const event=PRO_SEASON_CALENDAR[round][discipline==='DRIVER'?'driver':'crew'];
    assert.ok(event?.format,'round '+(round+1)+' missing '+discipline+' format');
    const id='sim:s'+state.season+':r'+round;
    const before=clone(state);
    const summary={id,label:event.id||event.format,discipline,placing:points===20?1:4,points};
    state[discipline==='DRIVER'?'playerDriver':'playerTeam'].seasonPoints+=points;
    state[discipline==='DRIVER'?'playerDriver':'playerTeam'].entered++;
    const advanced=completeSeasonRound(state,summary);
    assert.equal(advanced.calendar.round,round+1,'round must advance exactly once');
    assert.equal(advanced.calendar.history.length,round+1);
    assert.equal(advanced.calendar.history.at(-1).id,id);
    assert.equal(advanced.calendar.history.at(-1).discipline,discipline);
    assert.equal(advanced.calendar.history.at(-1).points,points);
    assert.equal(advanced.calendar.history.at(-1).background.length>0,true,'AI standings must advance');
    assert.deepEqual(completeSeasonRound(advanced,summary),advanced,'duplicate result must be idempotent');
    assert.equal(before.calendar.round,round,'original state must not be mutated');
    state=clone(advanced); // mimic JSON save/reload after every round
    const q=getProQualification(state);
    assert.equal(q.driver,state.playerDriver.seasonPoints);
    assert.equal(q.crew,state.playerTeam.seasonPoints);
    assert.equal(q.roundsRemaining,7-round);
  }
  assert.equal(state.calendar.result?.season,1,'final standings must be archived');
  assert.equal(state.calendar.history.length,8);
  assert.equal(state.playerDriver.entered,plan.filter(x=>x==='DRIVER').length);
  assert.equal(state.playerTeam.entered,plan.filter(x=>x==='TEAM').length);
  return state;
}
for(const [name,plan] of Object.entries(plans)) {
  test('8-round season: '+name,()=>{
    const state=simulate(plan);
    const qualified=getProQualification(state).qualified;
    assert.equal(qualified,state.playerDriver.seasonPoints>=60&&state.playerTeam.seasonPoints>=40);
    assert.equal(qualified,!['allDriver','allCrew'].includes(name));
    // A qualified season must finish its championship before rollover.
    if(qualified){
      assert.ok(nextProfessionalSeason(state).error,'qualified season cannot skip championship');
      state.activeChampionship={id:'tokyo:s1',season:1,completed:true};
    }
    const next=nextProfessionalSeason(state);
    assert.ok(next.circuit,'season rollover should succeed');
    assert.equal(next.circuit.season,2);
    assert.equal(next.circuit.calendar.round,0);
    assert.equal(next.circuit.calendar.archives.length,1);
    assert.equal(next.circuit.calendar.archives[0].season,1);
    assert.equal(next.circuit.playerDriver.seasonPoints,0);
    assert.equal(next.circuit.playerTeam.seasonPoints,0);
    assert.equal(next.circuit.playerDriver.entered,state.playerDriver.entered,'career record retained');
    assert.equal(next.circuit.playerTeam.entered,state.playerTeam.entered,'crew record retained');
    assert.ok(nextProfessionalSeason(next.circuit).error,'cannot roll over unfinished season');
  });
}
test('qualification remains achievable after 3 driver + 2 crew victories',()=>{
  const state=simulate(plans.balanced);
  assert.equal(state.playerDriver.seasonPoints,80);
  assert.equal(state.playerTeam.seasonPoints,80);
  assert.equal(getProQualification(state).qualified,true);
});
test('losing all rounds cannot qualify',()=>{
  const state=simulate(plans.balanced,2);
  assert.equal(getProQualification(state).qualified,false);
});
test('factory stock scrutineering catches tuning, nitrous and hidden legacy builds',()=>{
  assert.equal(getFactoryStockStatus({}).stock,true);
  assert.equal(getFactoryStockStatus({paintColor:'#f00',wheelId:'wheel01'}).stock,true);
  for(const state of [
    {engineTuning:{ecu:1}}, {drivetrainTuning:{gearbox:2}},
    {chassisTuning:{tyres:1}}, {exhaustNosTuning:{nosKit:1}},
    {exhaustNosTuning:{nitrousShot:1}}, {nosInstalled:true},
    {tuneLevel:5}, {stage3Calibration:{gearBias:2}},
  ])assert.equal(getFactoryStockStatus(state).stock,false,JSON.stringify(state));
});
test('time attack and consistency require three driven attempts',()=>{
  const own=[{finishSeconds:11,disqualified:false},{finishSeconds:10.8,disqualified:false},{finishSeconds:11.1,disqualified:false}];
  const rival=[{finishSeconds:11.5,disqualified:false},{finishSeconds:11.4,disqualified:false},{finishSeconds:11.6,disqualified:false}];
  assert.equal(scoreProfessionalTimedRuns('TIME_ATTACK',own.slice(0,2),rival).valid,false);
  assert.equal(scoreProfessionalTimedRuns('TIME_ATTACK',own,rival).valid,true);
  assert.equal(scoreProfessionalTimedRuns('CONSISTENCY',own,rival).valid,true);
});
