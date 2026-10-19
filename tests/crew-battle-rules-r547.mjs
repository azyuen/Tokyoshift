import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import {
  CREW_BATTLE_REGION_RULES, getCrewBattleHeatRule,
  getCrewEventCarSetup, getCrewBattleScout, eventStockState,
} from '../src/data/crewBattleRules.js';
import {
  buildRegionalCrewBattleRounds, getCrewBattleCaptainId,
} from '../src/data/crewSystem.js';
import {
  createCrewBattleCaptainInterlude, createCrewBattleCaptainResult,
} from '../src/data/crewBattleIntroductions.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';

const file = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const regions = ['ODAIBA','SHINAGAWA','TATSUMI','SHIBUYA','YOKOHAMA','DAIKOKU','SHINJUKU'];

test('seven regions provide escalating difficulty and three explicit heat rules', () => {
  assert.deepEqual(Object.keys(CREW_BATTLE_REGION_RULES), regions);
  assert.deepEqual(regions.map(r => CREW_BATTLE_REGION_RULES[r].build), [2,2,3,3,4,4,5]);
  for (const region of regions) {
    assert.equal(CREW_BATTLE_REGION_RULES[region].heats.length, 3);
    for (let i=0;i<3;i++) assert.ok(getCrewBattleHeatRule(region,i).label);
  }
  assert.equal(getCrewBattleHeatRule('SHIBUYA',0).stock,true);
  assert.equal(getCrewBattleHeatRule('YOKOHAMA',0).maxPowerKW,300);
  assert.equal(getCrewBattleHeatRule('SHINJUKU',0).stock,true);
  assert.equal(getCrewBattleHeatRule('SHINJUKU',1).maxPowerKW,380);
  assert.equal(getCrewBattleHeatRule('DAIKOKU',2).noNos,true);
});

test('captains never drive and actual opponents have legal builds', () => {
  for (const region of regions) {
    const captain = getCrewBattleCaptainId(region);
    const rounds = buildRegionalCrewBattleRounds(region);
    assert.equal(rounds.length,3,region+' must field a full legal crew');
    assert.equal(new Set(rounds.map(r=>r.characterId)).size,3);
    for (const [i,round] of rounds.entries()) {
      assert.notEqual(round.characterId,captain);
      assert.equal(round.index,i);
      assert.equal(round.leader,false);
      assert.ok(cars[round.carId]);
      assert.ok(round.scout.focus);
      const actual = getVehiclePerformance(round.carId,round.opponentBuildState).car.powerKW;
      assert.ok(Math.abs(actual-round.opponentPowerKW)<.001,region+': correct scouting power');
      if (round.rule.stock) {
        assert.equal(round.opponentBuildState.tuning.engine,0);
        assert.equal(round.opponentBuildState.exhaustNosTuning.nosKit,0);
      }
      if (round.rule.noNos) assert.equal(round.opponentBuildState.nosInstalled,false);
      if (round.rule.maxPowerKW) assert.ok(actual<=round.rule.maxPowerKW+.001);
    }
  }
});

test('event eligibility never modifies installed player hardware', () => {
  const original={paintColor:0xff9900,nosInstalled:true,tuning:{engine:3,turbo:3,ecu:2},
    drivetrainTuning:{clutch:2},exhaustNosTuning:{nosKit:2,nitrousShot:3}};
  const snapshot=JSON.stringify(original);
  const stock=getCrewEventCarSetup('ae86',original,{stock:true,noNos:true,label:'STOCK'});
  assert.equal(stock.eligible,false);
  assert.equal(stock.reason,'FACTORY STOCK REQUIRED');
  const noNos=getCrewEventCarSetup('ae86',original,{noNos:true,label:'NO NOS'});
  assert.equal(noNos.eligible,false);
  assert.equal(noNos.reason,'NO NOS INSTALLED');
  const cap=getCrewEventCarSetup('ae86',original,{maxPowerKW:100,label:'100 KW'});
  assert.equal(cap.eligible,false);
  assert.equal(cap.reason,'OVER 100 KW LIMIT');
  assert.deepEqual(cap.state,original);
  const factory=getCrewEventCarSetup('ae86',eventStockState(original),{
    stock:true,noNos:true,label:'STOCK',
  });
  assert(factory.eligible);
  assert.equal(factory.state.tuning.engine,0);
  assert.equal(factory.state.drivetrainTuning.clutch,0);
  assert.equal(factory.state.nosInstalled,false);
  assert.equal(factory.state.paintColor,original.paintColor);
  assert.equal(JSON.stringify(original),snapshot);
});

test('scouting and captain dialogue are specific to real rounds and result', () => {
  assert.equal(getCrewBattleScout({buildArchetype:'stock'}).label,'FACTORY STOCK');
  for(const region of regions) {
    const round=buildRegionalCrewBattleRounds(region)[1];
    const dialog=createCrewBattleCaptainInterlude(region,{
      playerScore:1,opponentScore:0,nextRound:round,
    });
    assert.equal(dialog.characters.left,'$CAPTAIN');
    assert.equal(dialog.finalActionLabel,'NEXT HEAT');
    assert.ok(dialog.pages.length>=1);
    assert.notEqual(createCrewBattleCaptainResult(region,true).pages[0].text,
      createCrewBattleCaptainResult(region,false).pages[0].text);
  }
});

test('Meet and Race use legal setups in live physics and captain interludes', () => {
  const meet=file('src/scenes/MeetScene.js'), race=file('src/scenes/RaceScene.js');
  assert.match(meet,/getCrewBattleCaptainId\(key\)/);
  assert.match(meet,/getCrewBattleRegionRules\(regionId\)/);
  assert.match(meet,/getCrewEventCarSetup\(unit.carId/);
  assert.match(meet,/crewBattleEventPlayerSetup/);
  assert.match(race,/this.playerCarState = this.raceMode === 'CREW_BATTLE'/);
  assert.match(race,/this.showCrewCaptainBetweenHeats\(settlement\)/);
  assert.match(race,/this.showCrewCaptainFinale\(settlement, returnScene\)/);
});
