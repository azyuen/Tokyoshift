import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import {
  driverAdviceStatus,consumeDriverAdvice,driverOpponentAdvice,
} from '../src/data/proDriverBriefing.js';
import {
  getProCrewAdviceAvailability,useProCrewAdvice,
} from '../src/data/proSeason.js';
import { getProCrewHeatAdvice } from '../src/ui/ProCrewBattleLineup.js';

const file = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const driverUI=file('src/ui/ProDriverBriefing.js');
const crewUI=file('src/ui/ProCrewBattleLineup.js');
const seasonUI=file('src/ui/ProSeasonPanel.js');
const driverState = (trophyId=null, roundIndex=0) => ({
  active:true,proEvent:true,openCircuit:true,
  openTrophyId:trophyId,roundIndex,playerCarId:'ae86',
  rounds:Array.from({length:trophyId?5:3},(_,n)=>({
    carId:['r32','rx7fd','evo6','s2000','galant'][n],
    opponentName:['Takeshi','Keisuke','Ayumi','Haruka','Daigo'][n],
  })),
});

test('one driver advice purchase is valid from any heat and refreshes for new opponents',()=>{
  const pro=createDefaultProCircuitState();
  const heat2=driverState(null,1);
  assert.equal(driverAdviceStatus(pro,heat2).available,true);
  const used=consumeDriverAdvice(pro,heat2);
  assert.equal(used.error,undefined);
  assert.equal(used.competitionState.briefingAdviceUsed,true);
  assert.equal(used.circuit.crewAdviceCooldownUntil,pro.eventTick+3);
  const heat3={...used.competitionState,roundIndex:2,
    briefingAdviceText:'old advice that should never be repeated'};
  assert.equal(driverAdviceStatus(used.circuit,heat3).usedThisEvent,true);
  assert.match(consumeDriverAdvice(used.circuit,heat3).error,/ALREADY USED/);
  const one=driverOpponentAdvice({shortName:'R32',drivetrain:'AWD'},
    {name:'Takeshi'});
  const three=driverOpponentAdvice({shortName:'Evo VI',drivetrain:'AWD'},
    {name:'Ayumi'});
  assert.notEqual(one,three);
  assert.match(three,/Ayumi.*Evo VI/);
  assert.match(driverUI,/const currentHeatAdvice=advice\.usedThisEvent/);
  assert.match(driverUI,/driverOpponentAdvice\(oppCar,currentOpponent,playerCar\)/);
  assert.match(driverUI,/const currentOpponent=\{\.\.\.rival,name:round\.opponentName\|\|rival\.name\}/);
  assert.match(driverUI,/bubbleText\(x\+18,y\+38,currentHeatAdvice/);
  assert.doesNotMatch(driverUI,/bubbleText\(x\+18,y\+38,state\.briefingAdviceText/);
});

test('a driver trophy consultation covers five stages and costs six completed-event ticks',()=>{
  const pro=createDefaultProCircuitState();
  pro.eventTick=12;
  const trophy=driverState('shutoSpeed',3);
  const consulted=consumeDriverAdvice(pro,trophy);
  assert.equal(consulted.error,undefined);
  assert.equal(consulted.circuit.crewAdviceCooldownUntil,18);
  for(let i=0;i<5;i++){
    assert.equal(driverAdviceStatus(consulted.circuit,{
      ...consulted.competitionState,roundIndex:i,
    }).usedThisEvent,true);
  }
  for(let settled=0;settled<6;settled++){
    const candidate=driverState(null);
    assert.equal(driverAdviceStatus({...pro,eventTick:12+settled,
      crewAdviceCooldownUntil:18},candidate).available,false);
  }
  assert.equal(driverAdviceStatus({...pro,eventTick:18,
    crewAdviceCooldownUntil:18},driverState()).available,true);
});

test('crew trophy advice can be requested between fixtures or heats, once per whole trophy',()=>{
  const pro=createDefaultProCircuitState();
  pro.eventTick=20;
  pro.activeCrewEvent={id:'trophy:teamGrandPrix:s1:e21',trophyId:'teamGrandPrix',
    round:1,fixture:{revealed:2},adviceUsed:false};
  const source={get:key=>key==='proCircuit'?pro:undefined};
  assert.equal(getProCrewAdviceAvailability(source).available,true);
  const consulted=useProCrewAdvice(source,pro.activeCrewEvent.id);
  assert.equal(consulted.error,undefined);
  assert.equal(consulted.circuit.crewAdviceCooldownUntil,26);
  assert.equal(consulted.circuit.activeCrewEvent.adviceUsed,true);
  const restored={get:key=>key==='proCircuit'?consulted.circuit:undefined};
  assert.equal(getProCrewAdviceAvailability(restored).usedThisEvent,true);
  assert.match(useProCrewAdvice(restored,pro.activeCrewEvent.id).error,/ALREADY USED/);
  assert.doesNotMatch(seasonUI,/SAYAKA CONSULTATION IS ONLY AVAILABLE BEFORE HEAT ONE/);
  assert.doesNotMatch(seasonUI,/New consultations.*only in the very first heat/);
  assert.match(seasonUI,/const eventAdvice=getProCrewHeatAdvice\(f,units\)/);
  assert.match(crewUI,/One consultation covers the entire trophy/);
});

test('crew heat advice changes as the fixture and current rival change, without repurchasing',()=>{
  const units=[
    {name:'Aki First',carId:'ae86',validAssignment:true,skill:0.85,performance:110},
    {name:'Ren Second',carId:'r32',validAssignment:true,skill:0.83,performance:115},
    {name:'Kai Third',carId:'ek9',validAssignment:true,skill:0.8,performance:105},
  ];
  const fixture={
    round:0,format:'DUEL',prepared:{revealed:0},
    opponent:{name:'Elite Team',drivers:[
      {name:'Takeshi One',carId:'evo6'},
      {name:'Keisuke Two',carId:'rx7fd'},
      {name:'Haruka Three',carId:'r34'},
    ]},
  };
  const first=getProCrewHeatAdvice(fixture,units);
  assert.match(first,/Fixture 1, heat 1: Takeshi/);
  assert.match(first,/Evo/);
  const second=getProCrewHeatAdvice({...fixture,prepared:{revealed:1}},units);
  assert.match(second,/Fixture 1, heat 2: Keisuke/);
  assert.match(second,/RX-7|RX7|FD/);
  assert.notEqual(second,first);
  const later=getProCrewHeatAdvice({...fixture,round:1,prepared:{revealed:2}},units);
  assert.match(later,/Fixture 2, heat 3: Haruka/);
  assert.match(seasonUI,/advice:getProCrewHeatAdvice\(f,units\)/);
  assert.doesNotMatch(seasonUI,/const eventAdvice=t\.adviceText\|\|/);
});

test('non-trophy crew advice retains a three-event cooldown, and trophy cooldown is shared',()=>{
  const pro=createDefaultProCircuitState();
  pro.eventTick=7;
  pro.activeCrewEvent={id:'crewOpen:s1:e8',trophyId:null,round:1,adviceUsed:false};
  const source={get:k=>k==='proCircuit'?pro:undefined};
  const normal=useProCrewAdvice(source,pro.activeCrewEvent.id);
  assert.equal(normal.error,undefined);
  assert.equal(normal.circuit.crewAdviceCooldownUntil,10);
  const candidate=driverState('tokyoTechnical',4);
  assert.equal(driverAdviceStatus(normal.circuit,candidate).available,false);
  const blocked=consumeDriverAdvice(normal.circuit,candidate);
  assert.match(blocked.error,/3 MORE/);
});
