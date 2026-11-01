import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRO_DRAG_EVENTS, OPEN_CIRCUIT_DRIVER_ROTATION, getOpenCircuitDriverOffer,
} from '../src/data/centralTokyo.js';
import {
  driverBriefingRules, driverBriefingEligibility, usesPrepaidDriverBriefing,
} from '../src/data/proDriverBriefing.js';

test('twelve independent open circuit solo offers rotate drivetrain, power and NOS',()=>{
  const offers=OPEN_CIRCUIT_DRIVER_ROTATION.map((_,i)=>getOpenCircuitDriverOffer(i));
  assert.equal(offers.length,12);
  assert.deepEqual(new Set(offers.map(e=>e.drivetrain||'OPEN')),
    new Set(['FWD','RWD','AWD','OPEN']));
  for(const drivetrain of ['FWD','RWD','AWD']) {
    const group=offers.filter(e=>e.drivetrain===drivetrain);
    assert.equal(group.length,3);
    assert.ok(group.some(e=>!Number.isFinite(e.maxPowerKW)),drivetrain+' must have an unlimited event');
    assert.ok(group.some(e=>Number.isFinite(e.maxPowerKW)),drivetrain+' must have a capped event');
  }
  assert.ok(offers.some(e=>!e.drivetrain&&!Number.isFinite(e.maxPowerKW)&&!e.noNos),
    'fully open class must allow any drivetrain, unlimited power and NOS');
  assert.ok(offers.some(e=>!e.drivetrain&&Number.isFinite(e.maxPowerKW)&&e.noNos),
    'open drivetrain needs a power cap with NOS prohibited');
  assert.ok(offers.some(e=>!e.drivetrain&&!Number.isFinite(e.maxPowerKW)&&e.noNos),
    'unlimited power but NOS-prohibited event must remain available');
  assert.ok(offers.some(e=>e.drivetrain&&Number.isFinite(e.maxPowerKW)&&!e.noNos),
    'drivetrain-specific capped events may allow NOS');
  for(let i=0;i<offers.length;i++){
    assert.equal(getOpenCircuitDriverOffer(i+offers.length).label,offers[i].label);
    assert.equal(getOpenCircuitDriverOffer(i+offers.length).maxPowerKW,offers[i].maxPowerKW);
    assert.equal(getOpenCircuitDriverOffer(i+offers.length).noNos,offers[i].noNos);
    assert.ok(PRO_DRAG_EVENTS.some(e=>e.id===offers[i].id),'persistent base ID');
    assert.doesNotMatch(offers[i].label,/\\bCUP\\b/i);
    assert.equal(usesPrepaidDriverBriefing({...offers[i],openCircuit:true}),true);
  }
});

test('solo event base labels and rotating labels do not use cup names',()=>{
  for(const event of PRO_DRAG_EVENTS)assert.doesNotMatch(event.label,/\\bCUP\\b/i);
  for(const entry of OPEN_CIRCUIT_DRIVER_ROTATION)assert.doesNotMatch(entry.label,/\\bCUP\\b/i);
});

test('saved unlimited power and open drivetrain beat legacy fallback limits',()=>{
  const snapshot={active:true,proEvent:true,openCircuit:true,
    playerCarId:'ae86',roundIndex:0,rounds:[{}],
    briefingRules:{maxPowerKW:null,noNos:false,stock:false,drivetrain:''}};
  assert.deepEqual(driverBriefingRules(snapshot,
    {maxPowerKW:260,noNos:true,drivetrain:'AWD'}),{
      maxPowerKW:null,noNos:false,stock:false,drivetrain:'',
    });
  const canRace=driverBriefingEligibility(snapshot,
    {nosInstalled:true,exhaustNosTuning:{nosKit:1}},1300,['ae86'],
    {maxPowerKW:260,noNos:true,drivetrain:'AWD'});
  assert.equal(canRace.eligible,true,canRace.problems.join(' / '));
  assert.equal(canRace.rules.maxPowerKW,null);
});
