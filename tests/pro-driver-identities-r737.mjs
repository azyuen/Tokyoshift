import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState, getProCircuitDriverSeeds} from '../src/data/proCircuit.js';
import {materialiseProDuelOpponentIdentities, getProDuelOpponentRoster, selectProDuelOpponents} from '../src/data/proDragDuel.js';
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
test('the full Pro Circuit includes 23 eligible opponent identities, not just 16 anonymous pros',()=>{
  const roster=getProDuelOpponentRoster(circuit());
  assert.equal(getProCircuitDriverSeeds(circuit()).length,24);
  assert.equal(roster.length,23);
  assert.equal(roster.filter(driver=>driver.id.startsWith('rival:')).length,7);
  assert.equal(roster.filter(driver=>driver.id.startsWith('pro:driver:')).length,16);
  assert.equal(new Set(roster.map(driver=>driver.id)).size,23);
  assert.equal(new Set(roster.map(driver=>driver.name)).size,23);
  assert.ok(roster.every(driver=>driver.name?.trim()));
  assert.ok(!roster.some(driver=>driver.id==='player:driver'));
});
test('three heats per event rotate through every one of the 23 professional opponents',()=>{
  const roster=getProDuelOpponentRoster(circuit());
  const seen=new Set();
  for(let entryOrdinal=0;entryOrdinal<8;entryOrdinal++){
    const rounds=selectProDuelOpponents(circuit(),{
      eventId:'streetShootout',entryOrdinal,count:3,
    });
    assert.equal(rounds.length,3);
    assert.equal(new Set(rounds.map(driver=>driver.id)).size,3,
      'no repeated opponent within a single event');
    rounds.forEach(driver=>seen.add(driver.id));
  }
  assert.deepEqual([...seen].sort(),roster.map(driver=>driver.id).sort());
});
test('five-round trophies also rotate all 23 rivals with stable ranked identities',()=>{
  const roster=getProDuelOpponentRoster(circuit());
  const ids=new Set();
  for(let entryOrdinal=0;entryOrdinal<5;entryOrdinal++){
    const rounds=selectProDuelOpponents(circuit(),{
      eventId:'shutoSpeed',entryOrdinal,count:5,
    });
    assert.equal(new Set(rounds.map(driver=>driver.id)).size,5);
    rounds.forEach(driver=>ids.add(driver.id));
  }
  assert.equal(ids.size,23);
  const changed=circuit();
  for(const entry of Object.values(changed.drivers))entry.rating=101;
  assert.deepEqual(selectProDuelOpponents(changed,{
    eventId:'streetShootout',entryOrdinal:3,count:3,
  }).map(driver=>driver.id),selectProDuelOpponents(circuit(),{
    eventId:'streetShootout',entryOrdinal:3,count:3,
  }).map(driver=>driver.id));
});
test('individual registration selects actual official driver IDs and keeps their saved names',()=>{
  const source=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
  assert.match(source,/const opponentRoster=selectProDuelOpponents\(pro,/);
  assert.match(source,/opponentDriverId:driver\.id/);
  assert.match(source,/opponentName:driver\.name/);
  assert.doesNotMatch(source,/const rivals = \[\.\.\.rotatedMigrated/);
});
test('legacy empty individual heats are populated with REAL distinct persistent Pro Circuit names',()=>{
  const original=event(),named=materialiseProDuelOpponentIdentities(original,circuit());
  const available=getProDuelOpponentRoster(circuit());
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
