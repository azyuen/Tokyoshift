import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normaliseProCircuitState} from '../src/data/proCircuit.js';
import {
  usesPrepaidDriverBriefing,purchaseDriverBriefingEntry,
  toggleBriefingNos,consumeDriverAdvice,driverBriefingEligibility,
} from '../src/data/proDriverBriefing.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('../src/scenes/CentralTokyoScene.js');
const ui=read('../src/ui/ProDriverBriefing.js');

const event={id:'streetShootout',openCircuit:true,opponentRatings:[1,2,3],
  entryFee:30000,prizeCash:57000,maxPowerKW:260,noNos:true};
const circuit=()=>normaliseProCircuitState({eventTick:14,season:1});
const draft=()=>({active:true,proEvent:true,openCircuit:true,
  eventId:event.id,proSeasonId:'open:streetShootout:s1:e15',
  entryFee:event.entryFee,roundIndex:0,playerCarId:'ae86',
  briefingEntryPending:true,briefingRules:{maxPowerKW:260,noNos:true},
  rounds:[{carId:'r32',characterId:'dummy'}]});
const car=()=>({nosInstalled:true,exhaustNosTuning:{nosKit:2,nitrousShot:2},
  tuning:{ecu:1}});
const buy=(overrides={})=>purchaseDriverBriefingEntry({
  circuit:circuit(),state:draft(),carStates:{ae86:car()},preparedCarState:toggleBriefingNos(car()),
  owned:['ae86'],cash:90000,powerKW:220,...overrides,
});

test('R603 only standard Open Circuit individual series use the unpaid room',()=>{
  assert.equal(usesPrepaidDriverBriefing(event),true);
  assert.equal(usesPrepaidDriverBriefing({...event,trophyId:'tokyoTechnical'}),false);
  assert.equal(usesPrepaidDriverBriefing({...event,team:true}),false);
  assert.equal(usesPrepaidDriverBriefing({...event,fourWide:true}),false);
  assert.equal(usesPrepaidDriverBriefing({...event,seasonRules:{format:'KNOCKOUT'}}),false);
  assert.equal(usesPrepaidDriverBriefing({...event,opponentRatings:[]}),false);
});

test('R603 NOS-equipped entrants can prepare without payment; scrutineering still blocks unsafe grid',()=>{
  const original=car(),prepared=toggleBriefingNos(original);
  assert.equal(original.nosInstalled,true);
  assert.equal(prepared.nosInstalled,false);
  assert.equal(prepared.exhaustNosTuning.nosKit,0);
  assert.equal(prepared.proBriefingNosStash.nosInstalled,true);
  assert.equal(driverBriefingEligibility(draft(),original,220,['ae86']).eligible,false);
  assert.equal(driverBriefingEligibility(draft(),prepared,220,['ae86']).eligible,true);
  assert.match(buy({preparedCarState:original}).error,/NOS/);
  assert.match(buy({powerKW:340}).error,/POWER/);
  assert.equal(buy({powerKW:260}).error,undefined);
});

test('R603 purchase commits fee and reversible car preparation exactly once after passing checks',()=>{
  const existing={ae86:car(),r32:{tuning:{ecu:3}}};
  const source=draft(),prepared=toggleBriefingNos(car());
  const out=buy({state:source,carStates:existing,preparedCarState:prepared});
  assert.equal(out.error,undefined,out.error);
  assert.equal(out.changes.cash,60000);
  assert.equal(out.changes.competitionState.active,true);
  assert.equal(out.changes.competitionState.briefingEntryPending,undefined);
  assert.equal(out.changes.carStates.ae86.nosInstalled,false);
  assert.equal(out.changes.carStates.ae86.proBriefingNosStash.nosInstalled,true);
  assert.deepEqual(out.changes.carStates.r32,existing.r32);
  assert.equal(existing.ae86.nosInstalled,true,'pending edits never mutate original garage');
  assert.equal(source.briefingEntryPending,true,'unpaid draft remains transient');
  assert.equal(buy({state:out.changes.competitionState}).error,'EVENT ALREADY REGISTERED');
  assert.equal(buy({cash:29999}).error,'INSUFFICIENT CASH');
  assert.match(buy({owned:[]}).error,/OWNED/);
  assert.match(buy({circuit:normaliseProCircuitState({eventTick:15,season:1})}).error,/EXPIRED/);
});

test('R603 Sayaka cooldown is staged and committed only with the entry payment',()=>{
  const initial=circuit(),initialState=draft();
  const consulted=consumeDriverAdvice(initial,initialState);
  assert.equal(consulted.error,undefined);
  assert.equal(initial.crewAdviceCooldownUntil,0);
  assert.equal(consulted.circuit.crewAdviceCooldownUntil,17);
  const pending={...consulted.competitionState,briefingAdviceText:'Maintain traction'};
  const out=buy({state:pending,adviceCircuit:consulted.circuit});
  assert.equal(out.error,undefined,out.error);
  assert.equal(out.changes.proCircuit.crewAdviceCooldownUntil,17);
  assert.equal(out.changes.competitionState.briefingAdviceText,'Maintain traction');
  assert.equal(initial.crewAdviceCooldownUntil,0);
  assert.equal(buy().changes.proCircuit,undefined,
    'without a staged consultation, payment does not affect the shared pro circuit');
});

test('R603 screen defers payment, offers free cancellation and enforces final grid scrutineering',()=>{
  assert.match(scene,/const prepareBeforePay=usesPrepaidDriverBriefing\(event\)/);
  assert.match(scene,/const passesNos = selectedFourWide \|\| prepareBeforePay/);
  assert.match(scene,/this\._pendingProDriverBriefing=\{/);
  assert.match(scene,/state\.briefingEntryPending=true/);
  assert.match(scene,/pending\\.preparedCarState=nextState/);
  assert.match(scene,/const transaction=purchaseDriverBriefingEntry\(\{/);
  assert.match(scene,/saveProTransaction\(this\.registry,transaction\.changes\)/);
  assert.match(scene,/this\.scene\.start\('FourLaneTestScene',\{mode:'PRO_DUEL'\}\)/);
  assert.match(ui,/state=options\.state\|\|s\.registry\.get\('competitionState'\)/);
  assert.match(ui,/options\.preparedCarState\|\|carStates\[state\.playerCarId\]/);
  assert.match(ui,/unpaid\?'CANCEL ENTRY':'FORFEIT EVENT'/);
  assert.match(ui,/PAY ONLY WHEN YOU PROCEED/);
  assert.match(ui,/if\(!eligibility\.eligible\)return/);
  assert.match(ui,/options\.onCancel\?\.\(\)/);
});
