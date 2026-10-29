// Tokyo SHIFT — provisional championship state and scoring.
// Independent of vehicle sprites, car geometry, and calibration assets.
// This module is deliberately pure: callers persist its returned state.
import { normaliseProCircuitState, getProCircuitDriverSeeds } from './proCircuit.js?v=20261030-r724';
import { getProQualification } from './proSeason.js?v=20261030-r724';
import { characters } from './characters.js?v=20261010-r459';

export const TOKYO_CHAMPIONSHIP_SCORING = Object.freeze({
  knockout: Object.freeze([20,17,13,9,5]),
  crew: Object.freeze([3,8,14,20]),
  fourWide: Object.freeze([40,34,29,25,22,21,20,17,15,14,13,12,10,8,6,5]),
});
const PLAYER='player:driver';
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=s=>{let n=2166136261;for(const ch of String(s))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;};
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
  return {championship:{schema:1,id:'tokyo:s'+c.season,season:c.season,
    rosterType:'TOKYO_CHAMPIONSHIP',stage:'KNOCKOUT',entrants,
    knockout:{round:0,results:[]},crew:{results:[]},fourWide:{results:[]},
    points:Object.fromEntries(entrants.map(r=>[r.id,{knockout:0,crew:0,fourWide:0}])),
    completed:false,championId:null}};
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
