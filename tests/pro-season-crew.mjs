import test from 'node:test';
import { preparePlayerCrewFixture, getPlayerCrewHeat, settlePlayerCrewHeat } from '../src/data/proSeason.js';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState, normaliseProCircuitState } from '../src/data/proCircuit.js';
import { createDefaultGameState, normaliseState, applyStateToRegistry, saveProTransaction, readSessionState, setActiveProfileIndex, getProfileState } from '../src/state/GameState.js';
import { recruitRandomDevCrew } from '../src/data/crewSystem.js';
import { createFourWideTournament, getPlayerProHeat, settleFourWideHeat } from '../src/data/proTournament.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';
import { CREW_SERIES, getCrewSeriesUnits, crewSeriesEligibility, registerCrewSeries, getCrewFixture, prepareCrewSeriesFixture, revealCrewSeriesHeat, settleCrewSeriesFixture, getCrewSeriesTable, getSeasonStandings, completeSeasonRound, nextProfessionalSeason, getProfessionalAttendance, estimateCrewHeat, seasonRandom, settleLegacySeasonEvent, assignCrewSeriesCar } from '../src/data/proSeason.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const physicalResult=(win=true)=>[{id:'player',finishSeconds:win?10:12,disqualified:false},{id:'ai-1',finishSeconds:11,disqualified:false}];

test('player crew heat uses crew loan and tuning snapshot, never a generated result or personal car selection',()=>{
 const s=source(),ids=enter(s),f=getCrewFixture(s.get('proCircuit'));
 const loan=getCrewSeriesUnits(s)[0].loanCarId;s.set('carStates',{[loan]:{tuneLevel:3,stock:false}});
 const out=preparePlayerCrewFixture(s,ids.slice(0,3),f.id),h=getPlayerCrewHeat(out.circuit);
 assert.equal(h.carId,loan);assert.deepEqual(h.playerState,{tuneLevel:3,stock:false});assert.equal(h.pending,true);assert.equal(h.ownSeconds,0);
 assert.equal(s.get('selectedCarId'),'ae86');assert.ok(revealCrewSeriesHeat(out.circuit,f.id,true).error);
 s.set('proCircuit',out.circuit);s.set('carStates',{});assert.deepEqual(preparePlayerCrewFixture(s,ids.slice(2,5),f.id).fixture,out.fixture);
});
test('nine actual races resolve three fixtures, persist after every heat and award a series once',()=>{
 const s=source(),ids=enter(s),paid=s.get('cash');let final;
 for(let round=0;round<3;round++){
  const f=getCrewFixture(s.get('proCircuit'));s.set('proCircuit',preparePlayerCrewFixture(s,ids.slice(0,3),f.id).circuit);
  for(let i=0;i<3;i++){
   const h=getPlayerCrewHeat(s.get('proCircuit')),out=settlePlayerCrewHeat(s.get('proCircuit'),h.id,physicalResult(i!==1));
   assert.equal(out.status,'CREW_HEAT');assert.equal(out.won,i!==1);
   assert.equal(settlePlayerCrewHeat(out.circuit,h.id,physicalResult()).status,'STALE_HEAT');
   s.set('proCircuit',normaliseProCircuitState(clone(out.circuit)));
   assert.equal(s.get('cash'),paid);assert.equal(out.circuit.activeCrewEvent.fixture.revealed,i+1);
  }
  assert.equal(getPlayerCrewHeat(s.get('proCircuit')),null);
  final=settleCrewSeriesFixture(s.get('proCircuit'),f.id);s.set('proCircuit',final.circuit);
 }
 assert.equal(final.status,'COMPLETE');assert.equal(final.summary.placing,1);assert.equal(final.cashPrize,210000);
 assert.equal(final.circuit.calendar.round,2);assert.equal(final.circuit.lastCrewEvent.history.length,3);
 assert.equal(settleCrewSeriesFixture(final.circuit,'old').cashPrize,0);
});
test('DQ and DNF lose player-driven heats; forged or missing finish times fail closed',()=>{
 const s=source(),ids=enter(s),f=getCrewFixture(s.get('proCircuit')),c=preparePlayerCrewFixture(s,ids.slice(0,3),f.id).circuit,h=getPlayerCrewHeat(c);
 for(const result of [{id:'player',finishSeconds:9,disqualified:true},{id:'player',finishSeconds:null,disqualified:false}]){
  assert.equal(settlePlayerCrewHeat(c,h.id,[result,physicalResult()[1]]).won,false);
 }
 assert.equal(settlePlayerCrewHeat(c,h.id,[]).status,'ERROR');
 assert.equal(settlePlayerCrewHeat(c,h.id,[{id:'player',finishSeconds:-1,disqualified:false},physicalResult()[1]]).status,'ERROR');
});
test('R470 already revealed results survive conversion; remaining heats must be driven without another fee',()=>{
 const s=source(),ids=enter(s),f=getCrewFixture(s.get('proCircuit')),old=prepareCrewSeriesFixture(s,ids.slice(0,3),f.id);
 s.set('proCircuit',revealCrewSeriesHeat(old.circuit,f.id).circuit);
 const converted=preparePlayerCrewFixture(s,ids.slice(0,3),f.id);
 assert.equal(converted.fixture.revealed,1);assert.equal(converted.fixture.heats[0].won,old.fixture.heats[0].won);
 assert.equal(getPlayerCrewHeat(converted.circuit).index,1);assert.ok(converted.fixture.heats[1].pending);
 assert.equal(converted.circuit.activeCrewEvent.entryFee,old.circuit.activeCrewEvent.entryFee);
});
const registry=data=>{const m=new Map(Object.entries(data));return {get:k=>m.get(k),set:(k,v)=>m.set(k,v)};};
function source(){const s=registry({...createDefaultGameState(),devMode:true,cash:2e7,ownedCarIds:['ae86','ek9','evo3'],selectedCarId:'ae86'});recruitRandomDevCrew(s,()=>.2);s.get('proCircuit').calendar.round=1;return s;}
function enter(s){const ids=getCrewSeriesUnits(s).slice(0,5).map(u=>u.id);const out=registerCrewSeries(s,ids);assert.ok(!out.error,out.error);s.set('proCircuit',out.circuit);s.set('cash',out.cash);return ids;}
function raceFixture(s,ids,skip=true){const f=getCrewFixture(s.get('proCircuit'));let out=prepareCrewSeriesFixture(s,ids.slice(0,3),f.id);assert.ok(!out.error,out.error);s.set('proCircuit',out.circuit);out=revealCrewSeriesHeat(out.circuit,f.id,skip);if(!skip){out=revealCrewSeriesHeat(out.circuit,f.id);out=revealCrewSeriesHeat(out.circuit,f.id);}out=settleCrewSeriesFixture(out.circuit,f.id);s.set('proCircuit',out.circuit);s.set('cash',s.get('cash')+out.cashPrize);return out;}

test('old saves acquire empty calendar without changing cash, cars, brackets, achievements or ratings',()=>{
 const s=createDefaultGameState();s.cash=123456;s.proCircuit.activeTournament={id:'old-four',pending:true};s.proCircuit.trophyWins.shutoSpeed=2;
 delete s.proCircuit.calendar;delete s.proCircuit.activeCrewEvent;
 const n=normaliseState(s);assert.equal(n.cash,123456);assert.deepEqual(n.ownedCarIds,s.ownedCarIds);assert.equal(n.proCircuit.calendar.round,0);assert.deepEqual(n.proCircuit.activeTournament,s.proCircuit.activeTournament);assert.equal(n.proCircuit.trophyWins.shutoSpeed,2);
});
test('crew gate, calendar, money and genuine registered squad checked at transaction time',()=>{
 const s=source(),ids=getCrewSeriesUnits(s).map(u=>u.id);
 s.set('devMode',false);s.get('proCircuit').calendar.round=0;assert.match(crewSeriesEligibility(s,ids.slice(0,3)),/ONE PROFESSIONAL/);
 s.get('proCircuit').calendar.round=1;s.set('cash',100);assert.match(crewSeriesEligibility(s,ids.slice(0,3)),/CASH/);
 s.set('cash',1e6);assert.match(crewSeriesEligibility(s,[ids[0],ids[0],ids[1]]),/THREE TO FIVE/);
 assert.match(crewSeriesEligibility(s,ids.slice(0,6)),/THREE TO FIVE/);
 assert.match(crewSeriesEligibility(s,ids.slice(0,3),Object.fromEntries(ids.slice(0,3).map(id=>[id,'ae86']))),/DISTINCT/);
 assert.match(crewSeriesEligibility(s,ids.slice(0,3),{[ids[0]]:'missing'}),/ELIGIBLE/);
 s.set('crewMembers',{});assert.match(crewSeriesEligibility(s,ids.slice(0,3)),/SEVEN/);
});
test('entry charges once, prohibits overlapping fourwide/duel events, and stores persistent team identities',()=>{
 const s=source(),cash=s.get('cash'),ids=enter(s),c=s.get('proCircuit');assert.equal(s.get('cash'),cash-CREW_SERIES.entryFee);
 assert.ok(registerCrewSeries(s,ids).error);assert.equal(createFourWideTournament(c,'ae86'),null);
 assert.equal(c.activeCrewEvent.entrants.length,4);assert.ok(c.activeCrewEvent.entrants.filter(e=>e.id!=='player:team').every(e=>c.teams[e.id]));
 const clean=source();clean.set('competitionState',{active:true});assert.match(crewSeriesEligibility(clean,ids),/ACTIVE/);
});
test('five-driver squad allows a different three and racing order for each fixture',()=>{
 const s=source(),ids=enter(s),f=getCrewFixture(s.get('proCircuit'));
 assert.ok(prepareCrewSeriesFixture(s,ids.slice(0,2),f.id).error);
 const selected=[ids[4],ids[1],ids[3]],out=prepareCrewSeriesFixture(s,selected,f.id);
 assert.deepEqual(out.fixture.lineup,selected);assert.deepEqual(out.fixture.heats.map(h=>h.driverId),selected);
});
test('prepared results survive profile reload and repeated prepare cannot reroll after tuning',()=>{
 const s=source(),ids=enter(s),f=getCrewFixture(s.get('proCircuit')),out=prepareCrewSeriesFixture(s,ids.slice(0,3),f.id);
 s.set('proCircuit',normaliseProCircuitState(clone(out.circuit)));s.set('carStates',{});
 const repeated=prepareCrewSeriesFixture(s,ids.slice(2,5),f.id);
 assert.deepEqual(repeated.fixture,out.fixture);assert.deepEqual(repeated.circuit,out.circuit);
});
test('watching each heat and skipping yield identical official results and money',()=>{
 const s=source(),ids=enter(s),copy=registry(Object.fromEntries(['proCircuit','carStates','crewMembers','ownedCarIds','playerDifficulty','cash'].map(k=>[k,clone(s.get(k))])));
 for(let i=0;i<3;i++){const a=raceFixture(s,ids,true),b=raceFixture(copy,ids,false);assert.deepEqual(a,b);}
 assert.equal(copy.get('cash'),s.get('cash'));
});
test('all three fixtures are genuinely settled; official table, rating and payout update once',()=>{
 const s=source(),ids=enter(s),c=clone(s.get('proCircuit')),startTick=c.eventTick,firstId=getCrewFixture(c).id;
 const early=settleCrewSeriesFixture(c,firstId);assert.equal(early.status,'STALE');assert.equal(early.cashPrize,0);
 let out;for(let i=0;i<3;i++){out=raceFixture(s,ids);assert.equal(out.status,i<2?'ADVANCED':'COMPLETE');if(i<2)assert.equal(out.cashPrize,0);}
 const final=out.circuit;assert.equal(final.eventTick,startTick+1);assert.equal(final.activeCrewEvent,null);assert.equal(final.lastCrewEvent.history.length,3);assert.equal(final.playerTeam.entered,c.playerTeam.entered+1);
 assert.equal(final.calendar.round,2);assert.equal(final.lastTournament.table.length,4);assert.equal(final.lastCrewEvent.history.flatMap(r=>r.playerHeats).length,9);
 assert.equal(final.playerTeam.seasonPoints,[32,24,14,6][out.summary.placing-1]);
 assert.deepEqual(final.trophyWins,c.trophyWins);assert.deepEqual(final.championshipWins,c.championshipWins);
 const duplicate=settleCrewSeriesFixture(final,firstId);assert.equal(duplicate.cashPrize,0);assert.deepEqual(duplicate.circuit,final);
});
test('save at every reveal and fixture boundary resumes without new fees',()=>{
 const s=source(),ids=enter(s),paid=s.get('cash');
 for(let r=0;r<3;r++){
   const f=getCrewFixture(s.get('proCircuit'));s.set('proCircuit',prepareCrewSeriesFixture(s,ids.slice(0,3),f.id).circuit);
   for(let h=0;h<3;h++){s.set('proCircuit',normaliseState({proCircuit:clone(s.get('proCircuit'))}).proCircuit);s.set('proCircuit',revealCrewSeriesHeat(s.get('proCircuit'),f.id).circuit);}
   const out=settleCrewSeriesFixture(s.get('proCircuit'),f.id);s.set('proCircuit',out.circuit);
 }
 assert.equal(s.get('cash'),paid);assert.equal(s.get('proCircuit').playerTeam.entered,1);
});
test('crew car upgrades, performance, skills and difficulty influence simulation monotonically',()=>{
 const base=getVehiclePerformance('ae86',{}),tuned=getVehiclePerformance('ae86',{tuning:{engine:3,intake:3,ecu:3,exhaust:3},chassisTuning:{tyres:3,weightReduction:3}});
 assert.ok(tuned.index.standing>base.index.standing);
 const unit={skill:.8,performance:base.index.standing};
 const time=(u,d='STANDARD',op=true)=>estimateCrewHeat(u,seasonRandom('same'),d,op);
 assert.ok(time({...unit,performance:tuned.index.standing})<time(unit));assert.ok(time({...unit,skill:.98})<time(unit));assert.ok(time(unit,'EASY')>time(unit,'STANDARD'));assert.ok(time(unit,'HARD')<time(unit,'STANDARD'));
});
test('car replacement is permitted before locking, validates ownership, and is frozen during viewing',()=>{
 const s=source(),ids=enter(s);const out=assignCrewSeriesCar(s,ids[0],'ek9');assert.ok(out.circuit);s.set('proCircuit',out.circuit);
 assert.ok(assignCrewSeriesCar(s,ids[0],'missing').error);assert.equal(getCrewSeriesUnits(s,out.circuit.activeCrewEvent.assignments).find(u=>u.id===ids[0]).carId,'ek9');
 const f=getCrewFixture(out.circuit);s.set('proCircuit',prepareCrewSeriesFixture(s,ids.slice(0,3),f.id).circuit);assert.ok(assignCrewSeriesCar(s,ids[0],'ae86').error);
});
test('round robin gives each team three distinct opponents with deterministic tie breaks',()=>{
 const s=source();enter(s);const t=s.get('proCircuit').activeCrewEvent;
 for(const e of t.entrants){const matches=t.schedule.flat().filter(pair=>pair.includes(e.id));assert.equal(matches.length,3);assert.equal(new Set(matches.map(p=>p.find(id=>id!==e.id))).size,3);}
 assert.deepEqual(getCrewSeriesTable(t).map(r=>r.seed),[1,2,3,4]);
});
test('background world progresses once per event, is deterministic, excludes participants and never simulates player',()=>{
 const c=createDefaultProCircuitState(),id=Object.keys(c.drivers)[0],summary={id:'example',label:'TEST',placing:1};
 const a=completeSeasonRound(c,summary,[id]),b=completeSeasonRound(c,summary,[id]);assert.deepEqual(a,b);assert.deepEqual(a.drivers[id],c.drivers[id]);assert.deepEqual(a.playerDriver,c.playerDriver);assert.deepEqual(completeSeasonRound(a,summary),a);assert.notDeepEqual(a.teams,c.teams);assert.deepEqual(c.calendar.history,[]);
});
test('eight completions archive results and next season retains ratings, records and achievements',()=>{
 let c=createDefaultProCircuitState();c.trophyWins.shutoSpeed=1;c.crewSeriesWins=2;
 for(let i=0;i<8;i++)c=completeSeasonRound(c,{id:'event'+i,label:'EVENT',placing:1});
 assert.equal(c.calendar.result.season,1);assert.equal(c.calendar.round,8);const rating=c.teams[Object.keys(c.teams)[0]].rating;
 const next=nextProfessionalSeason(c).circuit;assert.equal(next.season,2);assert.equal(next.calendar.round,0);assert.equal(next.calendar.archives.length,1);assert.equal(next.trophyWins.shutoSpeed,1);assert.equal(next.crewSeriesWins,2);assert.equal(next.teams[Object.keys(next.teams)[0]].rating,rating);assert.ok(Object.values(next.teams).every(r=>r.seasonPoints===0));assert.ok(nextProfessionalSeason(next).error);
 c.activeTournament={id:'old'};assert.ok(nextProfessionalSeason(c).error);
});
test('legacy professional cup result updates ranking/season once, preserving original prize and street state',()=>{
 const c=createDefaultProCircuitState(),state={eventId:'streetShootout',proSeasonId:'legacy:123',prizeCash:95000,rounds:[1,2,3].map(()=>({carId:'ae86',encounterRating:3}))};
 const next=settleLegacySeasonEvent(c,state,3);assert.equal(next.playerDriver.seasonPoints,32);assert.equal(next.calendar.round,1);assert.equal(next.lastTournament.cashPrize,95000);assert.deepEqual(settleLegacySeasonEvent(next,state,3),next);assert.equal(state.prizeCash,95000);
});
test('existing Four-Wide Open completion advances the season with no extra player simulation',()=>{
 let c=createDefaultProCircuitState();c.activeTournament=createFourWideTournament(c,'ae86');const h=getPlayerProHeat(c.activeTournament);
 const out=settleFourWideHeat(c,h.entrants.map(id=>({id,finishSeconds:id==='player:driver'?30:12})),h.id);
 assert.equal(out.status,'COMPLETE');assert.equal(out.circuit.calendar.round,1);assert.equal(out.circuit.playerDriver.entered,1);assert.equal(out.circuit.calendar.history[0].id,c.activeTournament.id);
});
test('attendance grows with prestige, finals, ranking and season while early qualifying stays small',()=>{
 const c=createDefaultProCircuitState();assert.equal(getProfessionalAttendance(c),'low');assert.equal(getProfessionalAttendance(c,{prestige:2}),'half');assert.equal(getProfessionalAttendance(c,{prestige:2,final:true}),'full');c.playerDriver.rating=3000;assert.equal(getProfessionalAttendance(c),'half');c.calendar.round=6;assert.equal(getProfessionalAttendance(c,{final:true}),'full');
});
test('malformed crew saves fail closed without payout or removing the saved payload',()=>{
 const s=source();enter(s);for(const edit of [t=>t.round=-1,t=>t.entrants[0]=null,t=>t.prizes=[Infinity],t=>t.fixture={revealed:3},t=>t.schedule[0]=[null]]){
 const c=clone(s.get('proCircuit'));edit(c.activeCrewEvent);assert.equal(getCrewFixture(c),null);const out=settleCrewSeriesFixture(c,'bad');assert.equal(out.cashPrize,0);assert.deepEqual(out.circuit.activeCrewEvent,c.activeCrewEvent);}
});

test('professional transaction persists cash+bracket to only its profile, rejects quota failure and stale owners',()=>{
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 setActiveProfileIndex(0);const r=registry({});applyStateToRegistry(r,{...createDefaultGameState(),cash:100000});saveProTransaction(r,{cash:100000});
 setActiveProfileIndex(1);const other=registry({});applyStateToRegistry(other,{...createDefaultGameState(),cash:999});saveProTransaction(other,{cash:999});
 setActiveProfileIndex(0);const next=createDefaultProCircuitState();next.activeCrewEvent={id:'saved-test'};
 saveProTransaction(r,{cash:25000,proCircuit:next});assert.equal(readSessionState().cash,25000);assert.equal(readSessionState().proCircuit.activeCrewEvent.id,'saved-test');assert.equal(getProfileState(1).cash,999);
 const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>saveProTransaction(r,{cash:1}),/SAVE FAILED/);assert.equal(r.get('cash'),25000);localStorage.setItem=set;
 setActiveProfileIndex(1);assert.throws(()=>saveProTransaction(r,{cash:0}),/PROFILE CHANGED/);assert.equal(getProfileState(1).cash,999);delete globalThis.localStorage;
});
