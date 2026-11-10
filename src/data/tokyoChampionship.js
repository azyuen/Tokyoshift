// Tokyo SHIFT — provisional championship state and scoring.
// Independent of vehicle sprites, car geometry, and calibration assets.
// This module is deliberately pure: callers persist its returned state.
import { normaliseProCircuitState, getProCircuitDriverSeeds } from './proCircuit.js?v=20261030-r724';
import { getProQualification } from './proSeason.js?v=20261030-r724';
import { characters } from './characters.js?v=20261010-r459';

import { cars } from './cars.js?v=20261026-r687';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { TUNER_OPTION_BY_ID, areTunerOptionRequirementsMet } from './tunerShops.js?v=20261006-r392';

// Road cars are common; special hero/collector builds are deliberately rare.
// Le Mans prototypes remain excluded. Save snapshots never reroll mid-event.
export const CHAMPIONSHIP_AI_CAR_POOL=Object.freeze([
  'r34','evo6','rx7fd','s2000','r32','jza80','gc8','gdb','s15',
]);
export const CHAMPIONSHIP_AI_RARE_CAR_POOL=Object.freeze([
  'minesR34','topSecretSupra','amuseS2000Gt1','libertyWalkR35','spoonEk9',
]);
// Per garage slot, not per frame or race: approximately one in ten rivals'
// registered vehicles is a special build, and ordinary cars remain dominant.
export const CHAMPIONSHIP_AI_RARE_CAR_PERCENT=10;
export function createChampionshipAiGarage(championshipId,entrantId) {
  const pool=CHAMPIONSHIP_AI_CAR_POOL.filter(id=>Boolean(cars[id]));
  if(pool.length<3)throw Error('CHAMPIONSHIP AI CAR POOL INCOMPLETE');
  const offset=hash(championshipId+':'+entrantId)%pool.length;
  return Array.from({length:3},(_,slot)=>{
    const rarePool=CHAMPIONSHIP_AI_RARE_CAR_POOL.filter(id=>Boolean(cars[id]));
    const rarityRoll=hash(championshipId+':'+entrantId+':rarity:'+slot)%100;
    const carId=rarePool.length&&rarityRoll<CHAMPIONSHIP_AI_RARE_CAR_PERCENT
      ?rarePool[hash(championshipId+':'+entrantId+':rare-model:'+slot)%rarePool.length]
      :pool[(offset+slot*3)%pool.length];
    const paintColor=[0xd43135,0x397dc1,0xe8c34a,0x52a57c,0xb0a3d9,0xf2f2ed][hash(entrantId+':paint:'+slot)%6];
    const state=createRivalBuildState(cars[carId],5,{
      seed:championshipId+':'+entrantId+':garage:'+slot,
      paintColor,raceType:'Standing Start',
      archetype:slot===0?'launchDrag':slot===1?'balancedStreet':'turboRoll',
    });
    // Championship rivals use the same actual upgrade schema as player cars.
    // Regional packages are installed only when their prerequisites are met.
    for(const group of ['tuning','drivetrainTuning','chassisTuning','exhaustNosTuning'])
      for(const part of Object.keys(state[group]||{}))state[group][part]=3;
    state.stock=false;
    state.tuneLevel=3;
    state.nosInstalled=true;
    state.acquiredVia='tokyoChampionship';
    const maps=[
      {ecuBias:-2,boostBias:-1,gearBias:1},
      {ecuBias:0,boostBias:0,gearBias:0},
      {ecuBias:2,boostBias:1,gearBias:-1},
    ];
    state.stage3Calibration={...maps[slot]};
    // A reproducible subset of compatible specialist packages, not a blanket
    // grant of mutually incompatible upgrades or a hidden performance bonus.
    state.specialistTuning=[];
    const options=Object.values(TUNER_OPTION_BY_ID)
      .filter(option=>option?.id&&option.regionId);
    // Resolve prerequisite chains before picking the final regional set.
    // The tuner system does not itself reject a conflicting package, so
    // selecting a reproducible subset avoids granting every shop upgrade.
    const eligible=[];
    let pending=options.slice();
    for(let pass=0;pass<options.length&&pending.length;pass++){
      let progress=false;
      pending=pending.filter(option=>{
        if(!areTunerOptionRequirementsMet({...state,specialistTuning:eligible.map(o=>o.id)},option))
          return true;
        eligible.push(option);
        progress=true;
        return false;
      });
      if(!progress)break;
    }
    const ordered=eligible.sort((a,b)=>
      (hash(entrantId+':'+slot+':'+a.id)%100000)-
      (hash(entrantId+':'+slot+':'+b.id)%100000));
    // Re-check dependencies on the final installation set: some packages
    // require other specialist packages that may not have been selected.
    const chosen=new Set();
    const select=option=>{
      if(!option||chosen.has(option.id)||chosen.size>=6)return;
      for(const dependency of option.requirements?.specialist||[])
        select(eligible.find(candidate=>candidate.id===dependency));
      if(chosen.size<6&&areTunerOptionRequirementsMet(
        {...state,specialistTuning:[...chosen]},option))chosen.add(option.id);
    };
    for(const option of ordered)select(option);
    state.specialistTuning=[...chosen];
    return {carId,state};
  });
}
export function getChampionshipAiCar(raw,entrantId,stage='KNOCKOUT',round=0) {
  const entrant=raw?.entrants?.find(e=>e.id===entrantId);
  if(!entrant)return null;
  const garage=entrant.garage;
  if(!Array.isArray(garage)||garage.length!==3)return null; // legacy: original selection
  // Change cars between Four-Wide rounds, never within a round. Existing
  // saved garages still work and their builds are not regenerated.
  const slot=stage==='FOUR_WIDE'
    ?(2+(Math.max(0,Math.floor(Number(round)||0))%3))%3
    :stage==='CREW'?1:0;
  return garage[slot];
}

export const TOKYO_CHAMPIONSHIP_SCORING = Object.freeze({
  knockout: Object.freeze([20,17,13,9,5]),
  crew: Object.freeze([3,8,14,20]),
  fourWide: Object.freeze([40,34,29,25,22,21,20,17,15,14,13,12,10,8,6,5]),
});
const PLAYER='player:driver';
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=s=>{let n=2166136261;for(const ch of String(s))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;};
// Event-specific vehicle locks. Legacy championships without locks are valid
// until their first solo race. Never infer a lock from the previous event.
export function getChampionshipEventCar(raw,stage) {
  if(!['KNOCKOUT','FOUR_WIDE'].includes(stage))return null;
  return raw?.eventCarLocks?.[stage]||null;
}
export function lockChampionshipEventCar(raw,stage,carId,registeredCarIds=[],ownedCarIds=[],devBypass=false) {
  if(!raw||raw.completed||raw.stage!==stage||
    !['KNOCKOUT','FOUR_WIDE'].includes(stage))
    return {error:'CHAMPIONSHIP EVENT IS NOT ACTIVE'};
  if(typeof carId!=='string'||!carId||
    !ownedCarIds.includes(carId)||
    (!devBypass&&(!Array.isArray(registeredCarIds)||!registeredCarIds.includes(carId))))
    return {error:'SELECT ONE OF YOUR THREE REGISTERED CARS'};
  const existing=getChampionshipEventCar(raw,stage);
  if(existing&&existing!==carId)return {error:'CAR LOCKED FOR THIS CHAMPIONSHIP EVENT'};
  return {championship:existing?raw:{
    ...raw,eventCarLocks:{...(raw.eventCarLocks||{}),[stage]:carId}
  }};
}
/**
 * Four-Wide is a three-heat finale: allow the player to choose a different
 * CHAMPIONSHIP-REGISTERED personal car between heats in the Pro Paddock.
 * This updates only the Four-Wide car choice. Knockout event locks remain
 * permanent and past heat results are never rewritten.
 */
export function selectChampionshipFourWideCar(raw,carId,registeredCarIds=[],ownedCarIds=[]) {
  if(!raw||raw.completed||raw.stage!=='FOUR_WIDE')
    return {error:'FOUR-WIDE CHAMPIONSHIP EVENT IS NOT ACTIVE'};
  if(typeof carId!=='string'||!carId||
    !Array.isArray(registeredCarIds)||!registeredCarIds.includes(carId)||
    !Array.isArray(ownedCarIds)||!ownedCarIds.includes(carId))
    return {error:'SELECT ONE OF YOUR THREE CHAMPIONSHIP REGISTERED CARS'};
  if(raw.eventCarLocks?.FOUR_WIDE===carId)return {championship:raw};
  return {championship:{...raw,
    eventCarLocks:{...(raw.eventCarLocks||{}),FOUR_WIDE:carId}}};
}
export function canEnterTokyoChampionship(raw) {
  const c=normaliseProCircuitState(raw),q=getProQualification(c);
  return c.calendar.round===8&&q.qualified&&!c.activeTournament&&!c.activeCrewEvent&&!c.activeTimedEvent&&!c.activeChampionship;
}
export function createProvisionalChampionship(raw) {
  const c=normaliseProCircuitState(raw);
  if(!canEnterTokyoChampionship(c))return {error:'COMPLETE EIGHT ROUNDS AND REACH 60 DRIVER / 40 CREW POINTS'};
  if(c.activeChampionship)return {error:'CHAMPIONSHIP ALREADY ACTIVE'};
  // Championship is 16 individual drivers drawn from 12 organisations.
  // Several drivers may represent the same team; the team's earned season
  // points contribute to each affiliated driver's qualification seed.
  const teamByDriver=Object.fromEntries(Object.entries(c.drivers).map(([id,driver])=>
    [id,c.teams[driver.teamId]||null]));
  const seedScore=(driver,team)=>Number((
    .7*Math.max(0,Number(driver?.seasonPoints)||0)/60+
    .3*Math.max(0,Number(team?.seasonPoints)||0)/40).toFixed(6));
  const rivals=getProCircuitDriverSeeds(c).filter(r=>r.id!==PLAYER).map(r=>({
    ...r,seasonSeedScore:seedScore(c.drivers[r.id],teamByDriver[r.id]),
  }));
  const bySeason=(a,b)=>b.seasonSeedScore-a.seasonSeedScore||
    b.rating-a.rating||a.id.localeCompare(b.id);
  // Seven established regional rivals remain recognisable in the finale;
  // the remaining eight places go to the best professional season qualifiers.
  const regional=rivals.filter(r=>r.characterId).sort(bySeason);
  const remaining=rivals.filter(r=>!r.characterId).sort(bySeason);
  const field=[...regional,...remaining].slice(0,15);
  if(field.length!==15)return {error:'INSUFFICIENT CHAMPIONSHIP RIVALS'};
  const entrants=[{id:PLAYER,name:'YOU',rating:c.playerDriver.rating,seed:0,
      seasonSeedScore:seedScore(c.playerDriver,c.playerTeam)},
    ...field.map(r=>({id:r.id,name:r.name||characters[r.characterId]?.name||r.id,
      characterId:r.characterId||null,rating:r.rating,seed:0,
      seasonSeedScore:r.seasonSeedScore}))];
  entrants.sort((a,b)=>b.seasonSeedScore-a.seasonSeedScore||b.rating-a.rating||
    hash(c.season+':'+a.id)-hash(c.season+':'+b.id));
  entrants.forEach((r,i)=>r.seed=i+1);
  // Around 75% Elite in the 16-car opener, the others Expert.
  // Snapshot skill tiers so old saves and completed brackets never reroll.
  const opposition=entrants.filter(r=>r.id!==PLAYER);
  opposition.forEach((r,i)=>r.skillTier=i<Math.round(opposition.length*.75)?5:4);
  opposition.forEach(r=>{r.garage=createChampionshipAiGarage('tokyo:s'+c.season,r.id);});
  return {championship:{schema:1,id:'tokyo:s'+c.season,season:c.season,
    rosterType:'TOKYO_CHAMPIONSHIP',stage:'KNOCKOUT',entrants,
    championshipRegisteredCars:null, // independent locked trio; set at Championship entry
    knockout:{round:0,results:[]},crew:{results:[]},fourWide:{results:[]},
    points:Object.fromEntries(entrants.map(r=>[r.id,{knockout:0,crew:0,fourWide:0}])),
    completed:false,championId:null}};
}
/**
 * Developer-only preview fixture. Normal qualification remains authoritative.
 * Simulate the minimum qualifying season in memory ONLY while seeding, so the
 * profile's real calendar, points, awards, car inventory and season registration
 * never get overwritten by this shortcut.
 *
 * The caller must gate this behind registry.devMode. This pure constructor does
 * not (and cannot) authenticate a user in a client-only Phaser game.
 */
export function createDevTokyoChampionship(raw,now=Date.now()) {
  const c=normaliseProCircuitState(raw);
  if(c.activeChampionship&&!c.activeChampionship.completed)
    return {championship:c.activeChampionship,resumed:true};
  if(c.activeCrewEvent||c.activeTournament||c.activeTimedEvent)
    return {error:'FINISH THE CURRENT PROFESSIONAL EVENT FIRST'};
  const preview={
    ...c,activeChampionship:null,
    calendar:{...c.calendar,round:8},
    playerDriver:{...c.playerDriver,seasonPoints:Math.max(60,c.playerDriver.seasonPoints)},
    playerTeam:{...c.playerTeam,seasonPoints:Math.max(40,c.playerTeam.seasonPoints)},
  };
  const created=createProvisionalChampionship(preview);
  if(created.error)return created;
  const id='tokyo:s'+c.season+':dev:'+String(Math.max(0,Number(now)||0));
  return {championship:{...created.championship,id,devBypass:true}};
}

// Decisive semifinal/final opposition is always Elite, with no hidden
// physics changes. Existing PROVISIONAL saves retain their original tiers.
export function getChampionshipOpponentSkill(state,entrantId,stage='KNOCKOUT',round=0) {
  if(!state||state.rosterType==='PROVISIONAL')return null;
  const entrant=state.entrants?.find(r=>r.id===entrantId);
  if(!entrant||entrant.id===PLAYER)return null;
  if((stage==='KNOCKOUT'&&round>=2)||
     (stage==='FOUR_WIDE'&&round>=1))return 5;
  return entrant.skillTier===4?4:5;
}
export function championshipStandings(state) {
  if(!state?.entrants)return [];
  return state.entrants.map(e=>{
    const p=state.points?.[e.id]||{};
    return {...e,knockout:p.knockout||0,crew:p.crew||0,fourWide:p.fourWide||0,
      total:(p.knockout||0)+(p.crew||0)+(p.fourWide||0)};
  }).sort((a,b)=>b.total-a.total||b.fourWide-a.fourWide||
    b.knockout-a.knockout||a.seed-b.seed);
}
// Tokyo Championship placing prizes are ten times the originally approved
// Championship payout scale: prestigious enough to move toward a ¥28m+ collector car, but
// not enough to purchase the rarest Ginza legends after one successful season.
// BASE purses only; no duplicate sponsor/difficulty multipliers. Awards are
// written once alongside the authoritative three-stage final standings.
export const TOKYO_CHAMPIONSHIP_PURSES=Object.freeze([
  10000000,5000000,3000000,1750000,
  1000000,1000000,1000000,1000000,
  500000,500000,500000,500000,500000,500000,500000,500000,
]);

export function getTokyoCareerRecord(raw) {
  const c=normaliseProCircuitState(raw);
  const history=[...c.championshipHistory].filter(r=>r&&r.championId);
  const last=history.at(-1)||null;
  return {titles:c.tokyoChampionWins,careerCompleted:c.careerCompleted,
    appearances:history.length,last,history};
}

/** Pure and idempotent. Caller must save circuit and cash in ONE transaction. */
export function settleTokyoChampionship(raw) {
  const c=normaliseProCircuitState(raw),state=c.activeChampionship;
  if(!state||!state.completed||state.stage!=='COMPLETE'||
     !state.id?.startsWith('tokyo:s')||state.season!==c.season)
    return {error:'CHAMPIONSHIP RESULT NOT FINAL'};
  if(c.championshipSettledIds.includes(state.id))
    return {circuit:c,cashPrize:0,alreadySettled:true,
      result:c.championshipHistory.find(r=>r.id===state.id)||null};
  const standings=championshipStandings(state);
  if(standings.length!==16||standings[0].id!==state.championId||
     !standings.some(r=>r.id===PLAYER)||
     standings.some(r=>!Number.isFinite(r.total)))
    return {error:'CHAMPIONSHIP STANDINGS INVALID'};
  const playerPlace=standings.findIndex(r=>r.id===PLAYER)+1;
  const won=state.championId===PLAYER;
  const cashPrize=TOKYO_CHAMPIONSHIP_PURSES[playerPlace-1]||0;
  const podium=standings.slice(0,3).map((r,index)=>({
    place:index+1,id:r.id,name:r.name,points:r.total,
    knockout:r.knockout,crew:r.crew,fourWide:r.fourWide,
  }));
  const legacyWinAlreadyRecorded=won&&c.championshipHistory.some(r=>
    r?.championId===PLAYER&&(r.id===state.id||
      (r.season===state.season&&(!r.id||r.completed))));
  const result={id:state.id,season:state.season,completed:true,
    championId:state.championId,championName:standings[0].name,
    playerPlace,playerPoints:standings[playerPlace-1].total,
    playerChampion:won,cashPrize,podium,
    points:clone(state.points)};
  c.championshipSettledIds=[...c.championshipSettledIds,state.id].slice(-250);
  // Older versions already recorded the outcome when the final heat saved;
  // replace that record instead of adding a duplicate entry for this season.
  const history=c.championshipHistory.filter(r=>
    r?.id!==state.id&&!(r?.season===state.season&&r?.championId===state.championId));
  c.championshipHistory=[...history,result].slice(-20);
  if(won){
    if(!legacyWinAlreadyRecorded)c.tokyoChampionWins++;
    c.careerCompleted=true;
  }
  return {circuit:c,cashPrize,alreadySettled:false,result};
}

export function scoreChampionshipStage(raw,stage,placements) {
  const state=clone(raw);
  if(!state||state.completed||state.stage!==stage||!['KNOCKOUT','FOUR_WIDE'].includes(stage))throw Error('CHAMPIONSHIP STAGE MISMATCH');
  if(!Array.isArray(placements)||placements.length!==16||
    new Set(placements).size!==16||
    placements.some(id=>!state.points[id]))throw Error('INVALID CHAMPIONSHIP FINISH ORDER');
  const points=stage==='KNOCKOUT'?placements.map((_,i)=>i===0?20:i===1?17:i<4?13:i<8?9:5):
    stage==='CREW'?null:TOKYO_CHAMPIONSHIP_SCORING.fourWide;
  if(!points)throw Error('CREW RESULTS MUST USE PER-HEAT SCORING');
  placements.forEach((id,i)=>{state.points[id][stage==='KNOCKOUT'?'knockout':'fourWide']=points[i];});
  state.stage=stage==='KNOCKOUT'?'CREW':'COMPLETE';
  if(state.stage==='COMPLETE'){state.completed=true;state.championId=championshipStandings(state)[0].id;}
  return state;
}
export function scoreChampionshipCrew(raw,winCounts) {
  const state=clone(raw);
  if(!state||state.stage!=='CREW'||(state.crew?.results?.length||0)!==3)throw Error('THREE CREW HEATS REQUIRED');
  for(const e of state.entrants){
    const wins=winCounts?.[e.id];
    if(!Number.isInteger(wins)||wins<0||wins>3)throw Error('INVALID CREW HEAT RESULTS');
    state.points[e.id].crew=TOKYO_CHAMPIONSHIP_SCORING.crew[wins];
  }
  state.stage='FOUR_WIDE';
  return state;
}

/**
 * Championship knockout: sixteen entrants race through four two-car rounds.
 * AI-only matches resolve deterministically; the player's actual win/loss
 * must be supplied by the racing scene. Losing does not end the championship.
 */
export function getChampionshipKnockoutHeat(raw) {
  const state=raw;
  if(!state||state.stage!=='KNOCKOUT')return null;
  const bracket=state.knockout?.bracket||seedKnockoutBracket(state.entrants);
  const round=state.knockout?.round||0;
  const matches=bracket[round]||[];
  const match=matches.find(m=>m.includes(PLAYER));
  if(!match)return null;
  return {round,opponentId:match.find(id=>id!==PLAYER),
    opponent:state.entrants.find(e=>e.id===match.find(id=>id!==PLAYER))};
}
export function seedKnockoutBracket(entrants) {
  if(!Array.isArray(entrants)||entrants.length!==16)throw Error('EXPECTED 16 ENTRANTS');
  const bySeed=[...entrants].sort((a,b)=>a.seed-b.seed);
  const order=[0,15,7,8,3,12,4,11,1,14,6,9,2,13,5,10];
  return [Array.from({length:8},(_,i)=>[bySeed[order[i*2]].id,bySeed[order[i*2+1]].id])];
}
export function settleChampionshipKnockout(raw,playerWon) {
  const state=clone(raw);
  if(state?.stage!=='KNOCKOUT'||typeof playerWon!=='boolean')throw Error('INVALID KNOCKOUT RESULT');
  if(!state.knockout.bracket)state.knockout.bracket=seedKnockoutBracket(state.entrants);
  const round=state.knockout.round||0,matches=state.knockout.bracket[round];
  if(!matches?.some(m=>m.includes(PLAYER)))throw Error('NO ACTIVE PLAYER KNOCKOUT');
  const winners=[],losers=[];
  for(const match of matches) {
    const [a,b]=match;
    const first=state.entrants.find(e=>e.id===a),second=state.entrants.find(e=>e.id===b);
    const winner=match.includes(PLAYER)?(playerWon?PLAYER:(a===PLAYER?b:a)):
      hash(state.id+':knockout:'+round+':'+a+':'+b)%1000 <
        Math.round(1000/(1+Math.exp(((second.rating||1400)-(first.rating||1400))/220)))?a:b;
    winners.push(winner);losers.push(winner===a?b:a);
  }
  state.knockout.results.push({round,matches:matches.map((entrants,i)=>({entrants,winner:winners[i]}))});
  if(winners.length===1) {
    // Final order: champion, runner-up, semi exits, quarter exits, first-round exits.
    const eliminated=state.knockout.results.map(r=>r.matches.flatMap(m=>m.entrants.filter(id=>id!==m.winner)));
    const finish=[winners[0],...eliminated.reverse().flat()];
    return scoreChampionshipStage(state,'KNOCKOUT',finish);
  }
  state.knockout.round=round+1;
  state.knockout.bracket.push(Array.from({length:winners.length/2},(_,i)=>[winners[2*i],winners[2*i+1]]));
  // Once eliminated, simulate remaining rounds immediately, preserving the
  // actual loss and ensuring the player can still enter the crew stage.
  if(!winners.includes(PLAYER)) {
    while(state.knockout.bracket[state.knockout.round].length>1) {
      const current=state.knockout.bracket[state.knockout.round];
      const advanced=current.map(([a,b])=>{
        const x=state.entrants.find(e=>e.id===a),y=state.entrants.find(e=>e.id===b);
        return hash(state.id+':remainder:'+state.knockout.round+':'+a+':'+b)%1000 <
          Math.round(1000/(1+Math.exp(((y.rating||1400)-(x.rating||1400))/220)))?a:b;
      });
      state.knockout.results.push({round:state.knockout.round,
        matches:current.map((entrants,i)=>({entrants,winner:advanced[i]}))});
      state.knockout.round++;
      state.knockout.bracket.push(Array.from({length:advanced.length/2},(_,i)=>[advanced[2*i],advanced[2*i+1]]));
    }
    const finalMatch=state.knockout.bracket[state.knockout.round][0];
    const winner=hash(state.id+':final')%2?finalMatch[0]:finalMatch[1];
    state.knockout.results.push({round:state.knockout.round,matches:[{entrants:finalMatch,winner}]});
    const eliminated=state.knockout.results.map(r=>r.matches.flatMap(m=>m.entrants.filter(id=>id!==m.winner)));
    return scoreChampionshipStage(state,'KNOCKOUT',[winner,...eliminated.reverse().flat()]);
  }
  return state;
}

/** Three distinct player-driven crew heats; AI results are stable by seed. */
export function getChampionshipCrewHeat(raw) {
  if(raw?.stage!=='CREW')return null;
  const index=raw.crew?.results?.length||0;
  if(index>=3)return null;
  const opponents=raw.entrants.filter(e=>e.id!==PLAYER)
    .sort((a,b)=>hash(raw.id+':crew:'+a.id)-hash(raw.id+':crew:'+b.id));
  return {index,opponent:opponents[index*5]||opponents[index],
    usedCarIds:(raw.crew.results||[]).map(r=>r.carId)};
}
export function settleChampionshipCrewHeat(raw,{carId,won,opponentId}={}) {
  const state=clone(raw),heat=getChampionshipCrewHeat(state);
  if(!heat)throw Error('NO ACTIVE CREW HEAT');
  if(typeof carId!=='string'||!carId||heat.usedCarIds.includes(carId))
    throw Error('CHOOSE A DISTINCT CREW CAR FOR EACH HEAT');
  if(typeof won!=='boolean'||opponentId!==heat.opponent?.id)
    throw Error('CREW HEAT RESULT MISMATCH');
  state.crew.results.push({index:heat.index,carId,won,opponentId});
  if(state.crew.results.length<3)return state;
  const counts={};
  counts[PLAYER]=state.crew.results.filter(r=>r.won).length;
  for(const e of state.entrants) {
    if(e.id===PLAYER)continue;
    // Ratings influence expected crew results; do not award automatic 3/3.
    const strength=Math.max(.12,Math.min(.88,.48+((e.rating||1400)-1400)/1800));
    counts[e.id]=Array.from({length:3},(_,i)=>
      (hash(state.id+':crew:'+e.id+':'+i)%10000)/10000<strength?1:0
    ).reduce((a,b)=>a+b,0);
  }
  return scoreChampionshipCrew(state,counts);
}

/** Four-wide championship: four qualifiers, two semifinals, one final.
 * Only the player's own heat is interactive; all other heats are simulated.
 * On elimination, the remaining bracket completes to award all 16 positions.
 */
const FOUR_GRID=[[0,7,8,15],[3,4,11,12],[1,6,9,14],[2,5,10,13]];
function fourHeat(state,ids,round,index) {
  return {id:state.id+':four:'+round+':'+index,round,index,entrants:ids,results:null};
}
export function getChampionshipFourWideHeat(raw) {
  if(raw?.stage!=='FOUR_WIDE')return null;
  const state=raw.fourWide;
  const heats=state.heats||FOUR_GRID.map((slots,i)=>fourHeat(raw,slots.map(n=>
    [...raw.entrants].sort((a,b)=>a.seed-b.seed)[n].id),0,i));
  return heats.find(h=>h.entrants.includes(PLAYER)&&!h.results)||null;
}
function simulateChampionshipFourHeat(state,heat) {
  return heat.entrants.map(id=>{
    const e=state.entrants.find(r=>r.id===id);
    const noise=(hash(heat.id+':'+id)%1000)/1000;
    return {id,finishSeconds:Math.max(8,12.8-((e.rating||1400)-1400)*.003+(noise-.5)*1.5)};
  }).sort((a,b)=>a.finishSeconds-b.finishSeconds||a.id.localeCompare(b.id));
}
export function settleChampionshipFourWideHeat(raw,heatId,finishers) {
  const state=clone(raw);
  if(state?.stage!=='FOUR_WIDE'||state.completed)throw Error('NO ACTIVE FOUR-WIDE CHAMPIONSHIP');
  if(!state.fourWide.heats)state.fourWide.heats=FOUR_GRID.map((slots,i)=>
    fourHeat(state,slots.map(n=>[...state.entrants].sort((a,b)=>a.seed-b.seed)[n].id),0,i));
  const active=state.fourWide.heats.find(h=>h.entrants.includes(PLAYER)&&!h.results);
  if(!active||active.id!==heatId)throw Error('FOUR-WIDE HEAT MISMATCH');
  if(!Array.isArray(finishers)||finishers.length!==4||
    new Set(finishers.map(r=>r.id)).size!==4||
    finishers.some(r=>!active.entrants.includes(r.id)))throw Error('INVALID FOUR-WIDE FINISHERS');
  const ordered=[...finishers].sort((a,b)=>{
    const valid=r=>r.finishSeconds!==null&&r.finishSeconds!==undefined&&Number.isFinite(Number(r.finishSeconds))&&Number(r.finishSeconds)>=0;
    const rank=r=>r.disqualified?2:valid(r)?0:1;
    return rank(a)-rank(b)||(valid(a)?Number(a.finishSeconds):Infinity)-(valid(b)?Number(b.finishSeconds):Infinity)||
      a.id.localeCompare(b.id);
  }).map(r=>({id:r.id,finishSeconds:r.finishSeconds??null}));
  active.results=ordered;
  const round=active.round;
  for(const heat of state.fourWide.heats)if(!heat.results)heat.results=simulateChampionshipFourHeat(state,heat);
  state.fourWide.results.push({round,heats:clone(state.fourWide.heats)});
  const heats=state.fourWide.heats;
  if(round===2) {
    const history=state.fourWide.results;
    const final=history[2].heats[0].results.map(r=>r.id);
    const semiExits=history[1].heats.flatMap(h=>h.results.slice(2).map(r=>r.id));
    const qualifyingExits=history[0].heats.flatMap(h=>h.results.slice(2).map(r=>r.id));
    const rank=id=>state.entrants.find(e=>e.id===id)?.seed||99;
    const orderedExits=ids=>ids.sort((a,b)=>rank(a)-rank(b));
    return scoreChampionshipStage(state,'FOUR_WIDE',
      [...final,...orderedExits(semiExits),...orderedExits(qualifyingExits)]);
  }
  const advanced=heats.map(h=>h.results.slice(0,2).map(r=>r.id));
  state.fourWide.heats=round===0?[
    fourHeat(state,[advanced[0][0],advanced[1][1],advanced[2][0],advanced[3][1]],1,0),
    fourHeat(state,[advanced[1][0],advanced[0][1],advanced[3][0],advanced[2][1]],1,1),
  ]:[fourHeat(state,[advanced[0][0],advanced[1][1],advanced[1][0],advanced[0][1]],2,0)];
  if(!state.fourWide.heats.some(h=>h.entrants.includes(PLAYER))) {
    // Eliminated drivers still receive championship points. Simulate the
    // remaining rounds, without requiring the player to watch AI-only heats.
    while(state.fourWide.heats[0].round<2) {
      const roundHeats=state.fourWide.heats;
      roundHeats.forEach(h=>{h.results=simulateChampionshipFourHeat(state,h);});
      state.fourWide.results.push({round:roundHeats[0].round,heats:clone(roundHeats)});
      const qualified=roundHeats.map(h=>h.results.slice(0,2).map(r=>r.id));
      state.fourWide.heats=[fourHeat(state,[qualified[0][0],qualified[1][1],qualified[1][0],qualified[0][1]],2,0)];
    }
    const last=state.fourWide.heats[0];
    last.results=simulateChampionshipFourHeat(state,last);
    state.fourWide.results.push({round:2,heats:clone(state.fourWide.heats)});
    const history=state.fourWide.results;
    const rank=id=>state.entrants.find(e=>e.id===id)?.seed||99;
    return scoreChampionshipStage(state,'FOUR_WIDE',[
      ...history[2].heats[0].results.map(r=>r.id),
      ...history[1].heats.flatMap(h=>h.results.slice(2).map(r=>r.id)).sort((a,b)=>rank(a)-rank(b)),
      ...history[0].heats.flatMap(h=>h.results.slice(2).map(r=>r.id)).sort((a,b)=>rank(a)-rank(b))
    ]);
  }
  return state;
}
