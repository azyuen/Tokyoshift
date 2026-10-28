// R711 beta fixes: deterministic Open Circuit scheduling, honest precision
// scoring, private opponent specifications and reliable unpaid registration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  getOpenCircuitRotation,WORLD_PHASE_DURATION_MS,WORLD_FULL_DAY_MS,
  OPEN_CIRCUIT_SLOTS_PER_DAY,OPEN_CIRCUIT_ROTATION_MS,
} from '../src/environment/WorldClock.js';
import {
  getOpenCircuitCrewFormat,getOpenCircuitTrophy,finishOpenCircuitEvent,
  getCrewTechnicalScore,OPEN_CIRCUIT_CREW_FORMATS,
} from '../src/data/proSeason.js';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';
import {
  purchaseDriverBriefingEntry,isOpenDriverBriefing,
} from '../src/data/proDriverBriefing.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=source('src/scenes/CentralTokyoScene.js');
const driverBrief=source('src/ui/ProDriverBriefing.js');
const crewPanel=source('src/ui/ProSeasonPanel.js');
const race=source('src/scenes/FourLaneTestScene.js');
const victory=source('src/ui/ProVictoryResults.js');

function withEpoch(fn) {
  const previous=globalThis.localStorage;
  const storage=new Map([['tokyoShiftWorldCycleEpochV1','1000000']]);
  globalThis.localStorage={
    getItem:k=>storage.get(k)||null,
    setItem:(k,v)=>storage.set(k,String(v)),
    removeItem:k=>storage.delete(k),
  };
  try{return fn(1000000);}finally{
    if(previous===undefined)delete globalThis.localStorage;
    else globalThis.localStorage=previous;
  }
}

test('driver and crew offers rotate at day/night boundaries, not every five minutes',()=>{
  withEpoch(base=>{
    assert.equal(OPEN_CIRCUIT_SLOTS_PER_DAY,2);
    assert.equal(OPEN_CIRCUIT_ROTATION_MS,WORLD_PHASE_DURATION_MS);
    const before=getOpenCircuitRotation(base+WORLD_PHASE_DURATION_MS-1);
    const after=getOpenCircuitRotation(base+WORLD_PHASE_DURATION_MS);
    const nextDay=getOpenCircuitRotation(base+WORLD_FULL_DAY_MS);
    assert.equal(before.rotationIndex,0);
    assert.equal(after.rotationIndex,1);
    assert.equal(nextDay.rotationIndex,2);
    assert.equal(before.dayIndex,after.dayIndex);
    assert.equal(nextDay.dayIndex,before.dayIndex+1);
    assert.equal(before.nextEventAt,base+WORLD_PHASE_DURATION_MS);
    assert.equal(before.nextTrophyAt,base+WORLD_FULL_DAY_MS);
    assert.equal(getOpenCircuitCrewFormat(before,999),'DUEL');
    assert.equal(getOpenCircuitCrewFormat(after,999),'RELAY');
    assert.equal(getOpenCircuitCrewFormat(nextDay,999),'TECHNICAL');
  });
});

test('prestige tournaments rotate once per complete day, with deterministic empty days',()=>{
  withEpoch(base=>{
    const c=createDefaultProCircuitState();
    const night=getOpenCircuitRotation(base+1000);
    const day=getOpenCircuitRotation(base+WORLD_PHASE_DURATION_MS+1000);
    assert.equal(getOpenCircuitTrophy(c,night).id,getOpenCircuitTrophy(c,day).id);
    assert.equal(getOpenCircuitTrophy(c,night).scheduled,true);
    for(let dayIndex=0;dayIndex<8;dayIndex++){
      const rotation=getOpenCircuitRotation(base+dayIndex*WORLD_FULL_DAY_MS);
      assert.equal(getOpenCircuitTrophy(c,rotation).scheduled,dayIndex%4!==3);
    }
    const entered=finishOpenCircuitEvent(c,{id:'open:practice-1',placing:2});
    assert.equal(getOpenCircuitCrewFormat(day,entered.openCircuitTick),
      getOpenCircuitCrewFormat(day,c.openCircuitTick));
  });
});

test('technical result is slowest-minus-fastest, not a fastest-ET contest',()=>{
  const make=(own,other)=>own.map((x,i)=>({
    ownSeconds:x,opponentSeconds:other[i],ownStatus:'FINISHED',
    opponentStatus:'FINISHED',won:x<other[i],pending:false,
  }));
  const fastButUneven=getCrewTechnicalScore(make([9.8,11.2,10.6],[12.1,12.0,12.2]));
  assert.equal(fastButUneven.ownSpread,1.4);
  assert.equal(fastButUneven.opponentSpread,0.2);
  assert.equal(fastButUneven.won,false);
  const slowerButRepeatable=getCrewTechnicalScore(make([12.4,12.5,12.45],[10.4,11.1,10.8]));
  assert.equal(slowerButRepeatable.won,true);
  assert.equal(slowerButRepeatable.ownSpread,.1);
  assert.equal(getCrewTechnicalScore(make([11,11,11],[11.2,11.2,11.2])).tied,true);
  const dnf=make([11,11.1,11.2],[12,12.3,12.5]);
  dnf[1].ownStatus='DNF';
  assert.equal(getCrewTechnicalScore(dnf).won,false);
  assert.equal(getCrewTechnicalScore(dnf).ownSpread,null);
});

test('technical UI and race cutscene do not call a single fast run a victory',()=>{
  assert.match(crewPanel,/getCrewTechnicalScore\(prepared.heats\)/);
  assert.match(crewPanel,/currentFormat==='TECHNICAL'\?'RUN RECORDED'/);
  assert.match(race,/this.crewTechnical \? 'CONSISTENCY RUN'/);
  assert.match(race,/SCORE IS THREE-RUN SPREAD/);
  assert.match(victory,/CONSISTENCY SPREAD/);
  assert.match(victory,/precision\|\|relay\?'RECORDED'/);
  assert.match(crewPanel,/format:summary.format\|\|round.format/);
});

test('opponent briefing hides private power/torque and shows only event class rules',()=>{
  const panel=driverBrief.slice(driverBrief.indexOf('// Compact opponent panel'),
    driverBrief.indexOf('// Translucent breathing hotspots'));
  assert.doesNotMatch(panel,/opponentPower|opponentTorque|Math.round\(opp/i);
  assert.match(panel,/CLASS CAP/);
  assert.match(panel,/rule.maxPowerKW/);
  assert.match(panel,/rule.noNos/);
  assert.match(driverBrief,/\['POWER LIMIT',eligibility.rules.maxPowerKW/);
  assert.match(driverBrief,/\['CLASS',eligibility.rules.stock/);
});

test('open driver briefing is payable once and retains captured offer across phase change',()=>{
  const c=createDefaultProCircuitState();
  const state={active:true,proEvent:true,openCircuit:true,eventId:'streetShootout',
    briefingEntryPending:true,proSeasonId:'open:streetShootout:s1:e1',
    playerCarId:'r32',entryFee:30000,rounds:[{carId:'galant'}],
    roundIndex:0,briefingRules:{maxPowerKW:260,noNos:true}};
  assert.equal(isOpenDriverBriefing(state),true);
  const args={circuit:c,state,owned:['r32'],cash:40000,
    preparedCarState:{},carStates:{},powerKW:180};
  const out=purchaseDriverBriefingEntry(args);
  assert.ok(out.changes,out.error);
  assert.equal(out.changes.cash,10000);
  assert.equal(out.changes.competitionState.briefingEntryPending,undefined);
  assert.equal(purchaseDriverBriefingEntry({...args,state:out.changes.competitionState}).error,
    'EVENT ALREADY REGISTERED');
  assert.doesNotMatch(scene,/EVENT OFFER CHANGED — CANCEL AND REOPEN REGISTRATION/);
  assert.match(scene,/entryError:this\._proDriverError/);
  assert.match(driverBrief,/ENTRY NOT SAVED/);
});

test('R713 installed PWA loads fresh changed modules without resetting asset cache',()=>{
  const boot=source('src/main.js'),version=JSON.parse(source('version.json'));
  const index=source('index.html'),sw=source('sw.js');
  assert.equal(version.build,'R713');
  assert.match(index,/id="build-stamp">R713/);
  assert.match(index,/main\.js\?v=20261029-r713/);
  assert.match(boot,/CentralTokyoScene\.js\?v=20261029-r713/);
  assert.match(boot,/FourLaneTestScene\.js\?v=20261029-r713/);
  assert.match(sw,/const BUILD = 'R713'/);
  // Preserve the asset cache so large graphics are not downloaded afresh.
  assert.match(sw,/const ASSET_CACHE = 'tokyoshift-assets-r688'/);
  for(const file of ['src/scenes/CentralTokyoScene.js',
    'src/scenes/FourLaneTestScene.js','src/ui/ProSeasonPanel.js',
    'src/ui/ProDriverBriefing.js','src/data/proDriverBriefing.js']){
    const code=source(file);
    for(const imported of code.split('\n').filter(l=>
      /proSeason\.js|ProSeasonPanel\.js|ProDriverBriefing\.js|ProVictoryResults\.js|WorldClock\.js|proDriverBriefing\.js/.test(l)))
      assert.match(imported,/v=20261029-r713/,'stale imported URL in '+file);
  }
});
