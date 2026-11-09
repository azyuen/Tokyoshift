import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js?v=20261027-r694';
import { LBWK_CATALOG } from '../src/data/lbwkFullWorks.js';
import { TUNER_SHOPS } from '../src/data/tunerShops.js';
import { getNosEquipment, withNosEnabled } from '../src/data/nosEquipment.js';
import { getBuiltCar } from '../src/vehicles/VehiclePerformance.js';
import { getProfessionalCarEligibility } from '../src/data/proSeason.js';
import { getCrewLoanCarId } from '../src/data/crewRoster.js';
import { driverBriefingEligibility, getDriverPowerPartLevelInfo, setDriverPowerPartLevels } from '../src/data/proDriverBriefing.js';
import { syncCrewHeroCarModels } from '../src/data/crewHeroBuilds.js';

globalThis.Phaser = { Math: {
  Clamp: (value,min,max) => Math.max(min, Math.min(max,value)),
  Linear: (a,b,t) => a+(b-a)*t,
}};

const race = (id,state={}) => getBuiltCar(id,state)?.car;
const eq = (id,state={}) => getNosEquipment(cars[id],state);

test('every Liberty Walk conversion has working 3-shot 75hp factory NOS with no purchased NOS fields',()=>{
  for(const {id} of LBWK_CATALOG){
    const state={collector:true,tuningLocked:true,lbwkFullWorks:true,
      // Real conversion saves contain no exhaustNosTuning; NOS is factory.
      nosInstalled:true};
    const installed=eq(id,state);
    assert.equal(installed.factory,true,id);
    assert.equal(installed.equippedShots,3,id);
    assert.equal(installed.equippedPowerHp,75,id);
    assert.equal(race(id,state)?.nosShots,3,id);
    assert.equal(race(id,state)?.nosPower,75,id);
    assert.equal(race(id,state)?.nosCapacitySeconds,3,id);
    const disabled=withNosEnabled(state,false);
    assert.equal(getNosEquipment(cars[id],disabled).fitted,true);
    assert.equal(getNosEquipment(cars[id],disabled).active,false);
    assert.equal(race(id,disabled)?.nosShots,0,id);
    assert.equal(race(id,disabled)?.nosPower,0,id);
    assert.equal(race(id,withNosEnabled(disabled,true))?.nosShots,3,id);
    // Never make the player repurchase the sealed full-works equipment.
    assert.equal(state.exhaustNosTuning,undefined,id);
  }
});

test('the existing Ginza Aruken one-off also preserves its authored 3 NOS shots',()=>{
  assert.equal(eq('arkonGinza240z').factory,true);
  assert.equal(race('arkonGinza240z')?.nosShots,3);
});

test('regional tuner hero builds can buy NOS, but do not falsely claim free factory equipment',()=>{
  for(const shop of Object.values(TUNER_SHOPS).filter(s=>!s.cosmeticOnly)){
    const id=shop.heroCarId;
    const initial={collector:true,tuningLocked:true,acquiredVia:'tuner-shop',nosInstalled:false};
    assert.equal(eq(id,initial).factory,false,id);
    assert.equal(eq(id,initial).fitted,false,id);
    assert.equal(race(id,initial)?.nosShots,0,id);
    const purchased={...initial,stock:false,nosInstalled:true,
      exhaustNosTuning:{nosKit:3,nitrousShot:2}};
    assert.equal(eq(id,purchased).equippedShots,3,id);
    assert.equal(eq(id,purchased).equippedPowerHp,50,id);
    assert.equal(race(id,purchased)?.nosShots,3,id);
    assert.equal(race(id,purchased)?.nosPower,50,id);
    assert.equal(race(id,withNosEnabled(purchased,false))?.nosShots,0,id);
    assert.equal(race(id,withNosEnabled(purchased,true))?.nosShots,3,id);
  }
});

test('purchased, incomplete and pre-parts-tree NOS are never mistaken for each other',()=>{
  const plain={};
  const bottleOnly={exhaustNosTuning:{nosKit:2,nitrousShot:0},nosInstalled:true};
  const paid={exhaustNosTuning:{nosKit:2,nitrousShot:1},nosInstalled:true};
  const legacy={nosInstalled:true};
  assert.equal(eq('ae86',plain).fitted,false);
  assert.equal(race('ae86',plain)?.nosShots,0);
  assert.equal(eq('ae86',bottleOnly).fitted,true);
  assert.equal(eq('ae86',bottleOnly).usable,false);
  assert.equal(race('ae86',bottleOnly)?.nosShots,0);
  assert.equal(eq('ae86',paid).equippedShots,2);
  assert.equal(eq('ae86',paid).equippedPowerHp,35);
  assert.equal(race('ae86',paid)?.nosShots,2);
  assert.equal(eq('ae86',legacy).legacy,true);
  assert.equal(race('ae86',legacy)?.nosShots,1);
  assert.equal(race('ae86',legacy)?.nosPower,35);
  assert.equal(race('ae86',{...legacy,nosEnabled:false})?.nosShots,0);
});

test('NOS master switch changes event readiness, never removes paid equipment',()=>{
  const bought={nosInstalled:true,stock:false,exhaustNosTuning:{nosKit:3,nitrousShot:3}};
  const off=withNosEnabled(bought,false);
  const on=withNosEnabled(off,true);
  assert.deepEqual(bought.exhaustNosTuning,off.exhaustNosTuning);
  assert.deepEqual(on.exhaustNosTuning,bought.exhaustNosTuning);
  assert.equal(off.nosInstalled,true);
  assert.equal(race('s15',off)?.nosShots,0);
  assert.equal(race('s15',on)?.nosShots,3);
  assert.ok(!getProfessionalCarEligibility('s15',off,{noNos:true})
    .reasons.some(r=>r.includes('NOS')));
  assert.ok(getProfessionalCarEligibility('s15',on,{noNos:true})
    .reasons.some(r=>r.includes('NOS')));
});

test('crew Liberty Walk retains actual NOS and its stable crew loan car identity',()=>{
  const characterId='aoiShindou',loanId=getCrewLoanCarId(characterId);
  const state={crewLoan:true,crewBaseCarId:'240z',crewOwnerCharacterId:characterId,
    crewHeroCarId:'libertyWalk240z',collector:true,tuningLocked:true,lbwkFullWorks:true,
    nosInstalled:true};
  const source={ownedCarIds:[loanId],carStates:{[loanId]:state},
    crewMembers:{ODAIBA:{regionId:'ODAIBA',characterId,loanCarId:loanId,baseCarId:'240z'}}};
  try{
    syncCrewHeroCarModels(source);
    assert.equal(cars[loanId].crewLoan,true);
    assert.equal(eq(loanId,state).factory,true);
    assert.equal(race(loanId,state)?.nosShots,3);
    assert.equal(race(loanId,state)?.nosPower,75);
  }finally{syncCrewHeroCarModels({});}
});

test('garage homepage and sealed collector pages use a single NOS permission and real factory status',()=>{
  const garage=readFileSync(new URL('../src/scenes/GarageScene.js',import.meta.url),'utf8');
  const vehicle=readFileSync(new URL('../src/vehicles/VehiclePerformance.js',import.meta.url),'utf8');
  assert.match(garage,/getSelectedNosEquipment\(\)/);
  assert.match(garage,/this\.refreshNosHomeControls\(\)/);
  assert.match(garage,/DISABLE NOS FOR RACE/);
  assert.match(garage,/INSTALL VIA EXHAUST \/ NOS/);
  assert.match(garage,/canSelectedCollectorAccessNos\(\) \{\s*return this\.canSelectedCollectorInstallNos\(\);/);
  assert.match(garage,/isActiveCrewLoanCar\(this\.registry, this\.selectedCarId\)/);
  assert.match(garage,/factoryNos && \['nosKit','nitrousShot'\]/);
  assert.match(garage,/FACTORY NOS INCLUDED/);
  assert.match(garage,/this\.secondaryNosSwitch/);
  assert.match(vehicle,/getNosEquipment\(config, state\)/);
});


test('Open Circuit briefing recognises factory LBWK shots and can switch them off for a NO NOS event',()=>{
  const carId='lbwkR34';
  const entry={active:true,proEvent:true,openCircuit:true,rounds:[{id:'heat1'}],
    roundIndex:0,playerCarId:carId,briefingRules:{noNos:true}};
  const state={lbwkFullWorks:true,collector:true,nosInstalled:true};
  const blocked=driverBriefingEligibility(entry,state,100,[carId]);
  assert.ok(blocked.problems.some(s=>s.includes('NOS')),JSON.stringify(blocked));
  const fitted=getDriverPowerPartLevelInfo(state,'nosKit',carId);
  assert.equal(fitted.current,3);
  assert.equal(fitted.original,3);
  assert.equal(fitted.factory,true);
  const off=setDriverPowerPartLevels(state,{nosKit:0},carId);
  assert.equal(off.nosEnabled,false);
  assert.equal(off.nosInstalled,true);
  assert.equal(off.exhaustNosTuning,undefined);
  assert.ok(driverBriefingEligibility(entry,off,100,[carId]).eligible);
  const refitted=setDriverPowerPartLevels(off,{nosKit:3},carId);
  assert.equal(refitted.nosEnabled,true);
  assert.equal(race(carId,refitted)?.nosShots,3);
  assert.ok(driverBriefingEligibility(entry,refitted,100,[carId]).problems.some(s=>s.includes('NOS')));
});
