import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState, getProCircuitDriverSeeds} from '../src/data/proCircuit.js';
import {materialiseProDuelOpponentIdentities} from '../src/data/proDragDuel.js';
import {settleLegacySeasonEvent} from '../src/data/proSeason.js';

const circuit=()=>createDefaultProCircuitState();
const event=()=>({
  active:true,proEvent:true,openCircuit:false,
  proSeasonId:'duel:midnightCup:s1:e4',eventId:'midnightCup',
  playerCarId:'gc8',prizeCash:100000,roundIndex:0,
  rounds:[{carId:'gc8',encounterRating:3},
    {carId:'r32',encounterRating:4},
    {carId:'galantVr4',encounterRating:4}],
});
test('legacy empty individual heats are populated with REAL distinct persistent Pro Circuit names',()=>{
  const original=event(),named=materialiseProDuelOpponentIdentities(original,circuit());
  const available=getProCircuitDriverSeeds(circuit())
    .filter(row=>row.id.startsWith('pro:driver:'));
  assert.notEqual(named,original);
  assert.deepEqual(original.rounds.map(row=>row.opponentName),[undefined,undefined,undefined]);
  assert.equal(named.rounds.length,3);
  assert.equal(new Set(named.rounds.map(row=>row.opponentDriverId)).size,3);
  for(let i=0;i<3;i++){
    const row=named.rounds[i];
    const known=available.find(record=>record.id===row.opponentDriverId);
    assert.ok(known,'the selected AI driver must exist in the official roster');
    assert.equal(row.opponentName,known.name);
    assert.equal(row.carId,original.rounds[i].carId);
    assert.equal(row.encounterRating,original.rounds[i].encounterRating);
  }
  assert.equal(materialiseProDuelOpponentIdentities(named,circuit()),named,
    'the same opponent remains named after saving/loading');
});
test('explicit identities and characters are preserved; generic placeholders are repaired',()=>{
  const state=event();
  state.rounds[0]={...state.rounds[0],opponentName:'Takeshi Mori'};
  state.rounds[1]={...state.rounds[1],characterId:'emiKanzaki',opponentName:'Emi Kanzaki'};
  state.rounds[2]={...state.rounds[2],opponentName:'UNKNOWN DRIVER'};
  const named=materialiseProDuelOpponentIdentities(state,circuit());
  assert.equal(named.rounds[0].opponentName,'Takeshi Mori');
  assert.equal(named.rounds[0].opponentDriverId,'pro:driver:01');
  assert.equal(named.rounds[1].characterId,'emiKanzaki');
  assert.equal(named.rounds[1].opponentName,'Emi Kanzaki');
  assert.ok(named.rounds[2].opponentDriverId);
  assert.notEqual(named.rounds[2].opponentName,'UNKNOWN DRIVER');
});
test('the settled heat affects its actual named driver and not the first undefined characterId',()=>{
  const before=circuit(),named=materialiseProDuelOpponentIdentities(event(),before);
  const result=settleLegacySeasonEvent(before,named,0);
  const first= named.rounds[0].opponentDriverId;
  assert.notEqual(result.drivers[first].rating,before.drivers[first].rating);
  for(const id of Object.keys(before.drivers)){
    if(id!==first)assert.equal(result.drivers[id].rating,before.drivers[id].rating);
  }
});
test('both professional pages use the persisted opponentName and results have separate label/value columns',()=>{
  const race=readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
  const briefing=readFileSync(new URL('../src/ui/ProDriverBriefing.js',import.meta.url),'utf8');
  assert.match(race,/round\.opponentName \|\| rival\.name/);
  assert.match(race,/rivalRound\.opponentName \|\| characters\[/);
  assert.match(race,/briefingText\(378,735,/);
  assert.match(race,/briefingText\(245,738,/);
  assert.doesNotMatch(race,/UNKNOWN DRIVER/);
  assert.match(briefing,/round\.opponentDriverId\s*\?/);
  assert.doesNotMatch(briefing,/find\(d=>d\.characterId===round\.characterId\);/);
});
