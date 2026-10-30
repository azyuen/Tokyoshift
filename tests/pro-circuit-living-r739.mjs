import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';
import {getProDriverHelmetIndex} from '../src/data/proDriverBriefing.js';
import {selectProDuelOpponents} from '../src/data/proDragDuel.js';
import {
  getOpenCircuitSlotStatus,finishOpenCircuitEvent,settleLegacySeasonEvent,
  completeSeasonRound,getProfessionalOpponentBuild,getProfessionalCarEligibility,
} from '../src/data/proSeason.js';
import {PRO_DRAG_EVENTS} from '../src/data/centralTokyo.js';

globalThis.Phaser??={};
globalThis.Phaser.Math??={
  Clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),
  Linear:(a,b,t)=>a+(b-a)*t,
};

const circuit=()=>createDefaultProCircuitState();
const rotation=n=>({rotationIndex:n,dayIndex:Math.floor(n/6),slotIndex:n%6,
  nextEventAt:1000+n*300000});
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('professional driver's generic helmet art is stable across event types and reloaded heats',()=>{
  const rival={opponentDriverId:'pro:driver:02',opponentName:'Kenji Sato'};
  const a=getProDriverHelmetIndex({proSeasonId:'open:street:s1',roundIndex:0},rival);
  const b=getProDriverHelmetIndex({proSeasonId:'duel:night:s3',roundIndex:2},rival);
  assert.equal(a,b);
  assert.ok(a>=1&&a<=4);
  const scene=source('src/scenes/FourLaneTestScene.js');
  const briefing=source('src/ui/ProDriverBriefing.js');
  assert.match(scene,/character\.mainRival/);
  assert.match(briefing,/named\?\.mainRival/);
});

test('all 23 Pro drivers complete one event each after a 3-heat Open Circuit win',()=>{
  const before=circuit(),ids=selectProDuelOpponents(before,{
    eventId:'streetShootout',entryOrdinal:0,count:3,
  });
  const event={active:true,openCircuit:true,proEvent:true,openCircuitSlotIndex:17,
    proSeasonId:'open:streetShootout:s1:e1',eventId:'streetShootout',
    playerCarId:'gc8',prizeCash:200000,roundIndex:2,
    rounds:ids.map((d,i)=>({opponentDriverId:d.id,opponentName:d.name,
      characterId:d.characterId||null,carId:['gc8','r32','galant'][i],
      encounterRating:i?5:4}))};
  const after=settleLegacySeasonEvent(before,event,3);
  assert.equal(after.playerDriver.entered,1);
  assert.equal(after.playerDriver.wins,3);
  assert.equal(after.openCircuitTick,1);
  assert.equal(after.eventTick,1);
  assert.equal(after.calendar.round,0);
  assert.equal(after.openCircuitLastDriverSlot,17);
  assert.equal(after.lastTournament.background.length,20);
  assert.equal(after.lastTournament.driverIds.length,3);
  assert.ok(Object.values(after.drivers).every(d=>d.entered===1));
  assert.equal(Object.values(after.drivers).filter(d=>d.wins+d.losses===1).length,23);
  assert.ok(Object.values(after.drivers).every(d=>d.seasonPoints===0));
  assert.deepEqual(settleLegacySeasonEvent(after,event,3),after,
    'resettlement of the same paid event is inert');
  assert.equal(getOpenCircuitSlotStatus(after,'DRIVER',rotation(17)).available,false);
  assert.equal(getOpenCircuitSlotStatus(after,'DRIVER',rotation(18)).available,true);
  assert.equal(getOpenCircuitSlotStatus(after,'TEAM',rotation(17)).available,true);
});

test('a saved crew event uses its own one-slot cooldown, preserving the trophy cooldown separately',()=>{
  const c=finishOpenCircuitEvent(circuit(),{
    id:'crew:s1:e1',discipline:'TEAM',placing:3,
    openCircuitSlotIndex:4,openCircuit:true,
  });
  assert.equal(c.openCircuitLastCrewSlot,4);
  assert.equal(c.openCircuitLastDriverSlot,-1);
  assert.equal(getOpenCircuitSlotStatus(c,'TEAM',rotation(4)).available,false);
  assert.equal(getOpenCircuitSlotStatus(c,'TEAM',rotation(5)).available,true);
  assert.equal(getOpenCircuitSlotStatus(c,'DRIVER',rotation(4)).available,true);
  const trophy=finishOpenCircuitEvent(c,{id:'trophy:s1:e2',
    trophyId:'shutoSpeed',discipline:'DRIVER',placing:1,
    openCircuitSlotIndex:5});
  assert.equal(trophy.openCircuitLastDriverSlot,-1,
    'prestige competition is controlled by its existing trophy cooldown');
  assert.equal(trophy.trophyWins.shutoSpeed,1);
});

test('Pro Season off-screen events update Elo and records as well as season points, without replaying player races',()=>{
  const before=circuit(),summary={id:'season:s1:r0',discipline:'DRIVER',
    placing:1,points:20};
  const after=completeSeasonRound(before,summary,['player:driver']);
  assert.equal(after.calendar.round,1);
  assert.equal(after.calendar.history.length,1);
  assert.ok(Object.values(after.drivers).some(d=>d.entered>0&&d.seasonPoints>0));
  assert.ok(Object.values(after.drivers).some(d=>d.wins+d.losses>0));
  assert.ok(Object.values(after.drivers).some((d,i)=>
    d.rating!==Object.values(before.drivers)[i].rating));
  assert.deepEqual(completeSeasonRound(after,summary,['player:driver']),after);
});

test('Open Circuit now prepares real upgraded rivals rather than default stock cars',()=>{
  const src=source('src/scenes/CentralTokyoScene.js');
  assert.match(src,/const professionalBuild=getProfessionalOpponentBuild\(/);
  assert.match(src,/openCircuit\?\{/);
  assert.doesNotMatch(src,/const professionalBuild=!openCircuit\?/);
  const ai=source('src/scenes/FourLaneTestScene.js');
  assert.match(ai,/boostAiForStandingStart\(/);
  assert.match(ai,/applyDifficultyToRivalAi\(/);
  for(const event of PRO_DRAG_EVENTS){
    const chosen=getProfessionalOpponentBuild(event,
      Math.min(event.maxPowerKW,350),5,
      'living-field:'+event.id,'ae86');
    assert.ok(chosen,event.id+' requires a legal AI build');
    const check=getProfessionalCarEligibility(chosen.carId,chosen.state,event);
    assert.equal(check.eligible,true,event.id+': '+check.reasons.join(','));
    assert.ok(check.powerKW<=event.maxPowerKW+.001);
    assert.ok(chosen.powerKW>0);
    if(event.noNos)assert.equal(chosen.state.nosInstalled,false);
  }
});
