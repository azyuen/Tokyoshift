// Collect endgame hero outcomes under the REAL shared 120 Hz physics/AI.
import assert from 'node:assert/strict';
import { cars } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js';
import { GINZA_LISTINGS } from '../src/data/centralTokyo.js';
import { ENDGAME_HERO_IDS } from '../src/data/endgameHeroCalibration.js';
import { getBuiltCar } from '../src/vehicles/VehiclePerformance.js';
import { peaks, simulate, stage } from './vehicle-balance.mjs';
const mappings={espritNsx:'nsx',topSecretSupra:'jza80',minesR34:'r34',reAmemiyaRx7:'rx7fd',junHyperLemonEvo5:'evo5',amuseS2000Gt1:'s2000',zeroSportsGc8:'gc8',spoonEk9:'ek9',veilsideFortuneRx7:'rx7fd',castrolMugenNsx:'nsx',mcrae22B:'gc8',tommiEvo6:'evo6',libertyWalk240z:'240z'};
const ids=[...new Set(ENDGAME_HERO_IDS)];
assert.equal(ids.length,21,'18 distinct builds and 3 alternate liveries');
assert.ok(GINZA_LISTINGS.some(l=>l.carId==='libertyWalk240z'));
const result=[];
for(const id of ids){
 const car=cars[id];assert.ok(car&&car.collector&&car.tuningLocked, id+' must be a sealed collector');
 const built=getBuiltCar(id,{});assert.ok(built && engines[car.engine],id+' build');
 const p=peaks(built.car,built.engine);
 const stand=simulate(built), roll=simulate(built,{speed:60});
 assert.ok(Math.abs(p.powerKW-car.powerKW)/car.powerKW<.055,id+' real curve vs display power '+p.powerKW+' / '+car.powerKW);
 assert.ok(Math.abs(p.torqueNm-car.torqueNm)/car.torqueNm<.055,id+' real curve vs display torque '+p.torqueNm+' / '+car.torqueNm);
 const donor=mappings[id];
 const donorBuild=donor?getBuiltCar(donor,stage(3)):null;
 const donorStand=donorBuild?simulate(donorBuild):null;
 const row={id,kw:Math.round(p.powerKW),nm:Math.round(p.torqueNm),mass:car.vehicleMassKg,standing400:+stand.splits[400].toFixed(3),standing800:+stand.splits[800].toFixed(3),rolling400:+roll.splits[400].toFixed(3),donorMax400:donorStand?+donorStand.splits[400].toFixed(3):null,spin:+stand.spinSeconds.toFixed(2)};
 result.push(row);console.log('HERO_RESULT '+JSON.stringify(row));
}
for(const [a,b] of [['cleanMazda787B','renownMazda787B'],['cleanToyotaGtOne','essoToyotaGtOne'],['cleanR390','calsonicR390']]){
 const x=result.find(r=>r.id===a),y=result.find(r=>r.id===b);
 assert.equal(x.standing400,y.standing400,a+' physics parity');
 assert.equal(x.kw,y.kw,a+' power parity');
}
assert.equal(cars.arkonLibertyWalk240z.collector,false,'original story car must not become sealed');
assert.equal(cars.arkonLibertyWalk240z.engine,cars['240z'].engine,'original story engine untouched');
const failing=result.filter(r=>r.standing400>10.15);
console.log('HERO_SUMMARY '+JSON.stringify({tested:result.length,under10:result.filter(r=>r.standing400<10).length,over1015:failing.map(r=>[r.id,r.standing400])}));
if(failing.length)process.exitCode=2;
