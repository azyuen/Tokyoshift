import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRO_DRAG_EVENTS } from '../src/data/centralTokyo.js';
import { PRO_CIRCUIT_TROPHIES } from '../src/data/proCircuit.js';
import {
  getProfessionalRoundEvents,getProfessionalOpponentBuild,
} from '../src/data/proSeason.js';
import { createRivalBuildState } from '../src/data/rivalBuilds.js';
import { cars } from '../src/data/cars.js';
import { getBuiltCar } from '../src/vehicles/VehiclePerformance.js';
import {
  inspectProOpponent,scrutineerProOpponentRound,
} from '../src/data/proOpponentScrutineering.js';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const entry=file('src/scenes/CentralTokyoScene.js');
const runtime=file('src/scenes/FourLaneTestScene.js');
const makeRound=(carId,state,index=0)=>({
  carId,opponentBuildState:state,encounterRating:index?5:4,
  characterId:'testRival',opponentName:'Ken Rival',paintColor:0x334455,
});
const legal=(round,rules)=>{
  const result=inspectProOpponent(round.carId,round.opponentBuildState,rules);
  assert.equal(result.eligible,true,round.carId+': '+result.reasons.join('/'));
  const built=getBuiltCar(round.carId,round.opponentBuildState);
  if(rules.noNos){
    assert.equal(built.car.nosShots||0,0,'nos shots must be zero');
    assert.equal(built.car.nosCapacitySeconds||0,0,'nos capacity must be zero');
    assert.equal(built.car.nosPower||0,0,'nos horsepower must be zero');
  }
  if(Number.isFinite(rules.maxPowerKW))
    assert.ok(built.car.powerKW <= rules.maxPowerKW+.001,
      'actual AI physics power must respect the class ceiling');
};

test('the actual Street Shootout is 260 kW, NO NOS; both are enforced against live build',()=>{
  const street=PRO_DRAG_EVENTS.find(e=>e.id==='streetShootout');
  assert.equal(street.maxPowerKW,260);
  assert.equal(street.noNos,true);
  const illegal={
    ...createRivalBuildState(cars.r32,5,{seed:'illegal-ai:high-power',raceType:'Standing Start'}),
    nosInstalled:true,
    exhaustNosTuning:{nosKit:2,nitrousShot:2},
  };
  const original=makeRound('r32',illegal);
  const before=inspectProOpponent(original.carId,illegal,street);
  assert.equal(before.eligible,false);
  assert.ok(before.reasons.some(reason=>/NOS|POWER/.test(reason)));
  const fixed=scrutineerProOpponentRound(original,street,{
    targetPowerKW:246,seed:'street:round:1',
  });
  assert.ok(fixed?.repaired);
  assert.equal(fixed.round.characterId,'testRival','keep opponent identity');
  assert.equal(fixed.round.opponentName,'Ken Rival');
  legal(fixed.round,street);
  assert.ok(fixed.round.opponentBuildState,'AI has a materialised legal state');
});

test('missing historic AI build must never fall back to an unrestricted NOS build',()=>{
  const street=PRO_DRAG_EVENTS.find(e=>e.id==='streetShootout');
  const saved=makeRound('r32',null);
  const fixed=scrutineerProOpponentRound(saved,street,{
    targetPowerKW:235,seed:'legacy:no-build',
  });
  assert.ok(fixed?.repaired);
  assert.deepEqual(fixed.round.opponentBuildState,{});
  legal(fixed.round,street);
  assert.match(runtime,/rivalRound\?\.opponentBuildState \|\| createRivalBuildState/);
  assert.match(runtime,/if\(result\.repaired\)\{/);
  assert.match(runtime,/saveProTransaction\(this\.registry,\{competitionState:updated\}\)/);
});

test('all three Open Circuit individual classes and both driver trophy classes provide legal physical AI rivals',()=>{
  const events=[
    ...PRO_DRAG_EVENTS,
    ...PRO_CIRCUIT_TROPHIES.filter(e=>e.discipline==='DRIVER'),
  ];
  let inspected=0;
  for(const event of events){
    const rules={maxPowerKW:event.maxPowerKW??null,noNos:Boolean(event.noNos)};
    for(let i=0;i<(event.fixtures||3);i++){
      const id=(event.opponentCars||['galant','gc8','r32'])[i%3];
      const crafted=createRivalBuildState(cars[id],5,{
        seed:event.id+':'+i,raceType:'Standing Start',
      });
      const tested=scrutineerProOpponentRound(makeRound(id,crafted,i),rules,{
        targetPowerKW:Math.min(event.maxPowerKW||350,242),
        seed:event.id+':'+i,
      });
      assert.ok(tested,event.id+' stage '+i+' must have a legal opponent');
      legal(tested.round,rules);
      inspected++;
    }
  }
  assert.ok(inspected>=19);
});

test('all eight professional season driver rules yield legal opponents (knockout, four-wide, timed)',()=>{
  for(let seasonRound=0;seasonRound<8;seasonRound++){
    const rules=getProfessionalRoundEvents(seasonRound).driver;
    const cap=Number.isFinite(rules.maxPowerKW)?rules.maxPowerKW:500;
    const target=Math.min(cap,220);
    const chosen=getProfessionalOpponentBuild(rules,target,4,
      'pro-season:r'+seasonRound, 'ae86');
    assert.ok(chosen,'season round '+seasonRound);
    const round=makeRound(chosen.carId,chosen.state);
    const checked=scrutineerProOpponentRound(round,rules,{
      targetPowerKW:target,seed:'season:'+seasonRound,
    });
    assert.ok(checked,'season '+seasonRound);
    legal(checked.round,rules);
  }
});

test('legal existing builds remain unchanged and approved NOS is permitted where the event allows it',()=>{
  const classRules={maxPowerKW:600,noNos:false};
  const stock=makeRound('r32',{});
  const result=scrutineerProOpponentRound(stock,classRules,{targetPowerKW:250});
  assert.equal(result?.repaired,false);
  assert.equal(result.round,stock);
  // No arbitrary AI performance nerf: legal engine and tuner builds remain intact.
  const unconstrained=makeRound('r32',{
    nosInstalled:true,exhaustNosTuning:{nosKit:1,nitrousShot:1},
  });
  assert.equal(inspectProOpponent('r32',unconstrained,classRules).eligible,true);
  assert.equal(inspectProOpponent('r32',unconstrained,{
    maxPowerKW:260,noNos:true,
  }).eligible,false);
});

test('both registration and live race enforce the same scrutineering, no phantom stage upgrades',()=>{
  assert.match(entry,/const checkedRounds=rounds\.map\(\(round,index\)=>scrutineerProOpponentRound\(/);
  assert.match(entry,/rounds:checkedRounds\.map\(result=>result\.round\)/);
  assert.match(entry,/briefingRules:rivalRules/);
  assert.match(runtime,/const scrutineering=inspectProOpponent\(id,state,activeRules\)/);
  assert.match(runtime,/this\._proOpponentInvalid=true/);
  assert.match(runtime,/if\(this\._proOpponentInvalid\)\{/);
  assert.match(runtime,/this\.proRivalBuilds\?\.\[entrant\?\.id\]\?\.state\|\|entrant\?\.buildState/);
  assert.match(runtime,/this\.proTimed && this\.timedEvent/);
  assert.match(runtime,/proScrutineeringError/);
});

test('Tri-Drive rival crews obey player drivetrain mix',()=>{
  const source=file('src/data/proSeason.js');
  assert.match(source,/trophy\?\.id==='triDrive'&&r\.id!==PLAYER\?\['FWD','RWD','AWD'\]\[n\]:null/);
  assert.match(source,/getCarMagazineMeta\(carId\)\.drivetrain===requiredDrivetrain/);
});
