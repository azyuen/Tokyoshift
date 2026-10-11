// Tokyo SHIFT — provisional championship state and scoring.
// Independent of vehicle sprites, car geometry, and calibration assets.
// This module is deliberately pure: callers persist its returned state.
import { normaliseProCircuitState, getProCircuitDriverSeeds } from './proCircuit.js?v=20261008-r443';
import { getProQualification } from './proSeason.js?v=20261011-r485';
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
  return c.calendar.round===8&&q.qualified&&!c.activeTournament&&!c.activeCrewEvent;
}
export function createProvisionalChampionship(raw) {
  const c=normaliseProCircuitState(raw);
  if(!canEnterTokyoChampionship(c))return {error:'COMPLETE EIGHT ROUNDS AND REACH 100 DRIVER / 40 CREW POINTS'};
  if(c.activeChampionship)return {error:'CHAMPIONSHIP ALREADY ACTIVE'};
  const rivals=getProCircuitDriverSeeds(c).filter(r=>r.id!==PLAYER);
  // Preserve main regional rivals in the provisional roster; actual season
  // qualification will replace this selection in releases 2A/2B.
  const regional=rivals.filter(r=>r.characterId);
  const remaining=rivals.filter(r=>!r.characterId);
  const field=[...regional.sort((a,b)=>b.rating-a.rating),
    ...remaining.sort((a,b)=>b.rating-a.rating)].slice(0,15);
  const entrants=[{id:PLAYER,name:'YOU',rating:c.playerDriver.rating,seed:0},
    ...field.map(r=>({id:r.id,name:r.name||characters[r.characterId]?.name||r.id,
      characterId:r.characterId||null,rating:r.rating,seed:0}))];
  entrants.sort((a,b)=>b.rating-a.rating||hash(c.season+':'+a.id)-hash(c.season+':'+b.id));
  entrants.forEach((r,i)=>r.seed=i+1);
  return {championship:{schema:1,id:'tokyo:s'+c.season,season:c.season,
    rosterType:'PROVISIONAL',stage:'KNOCKOUT',entrants,
    knockout:{round:0,results:[]},crew:{results:[]},fourWide:{results:[]},
    points:Object.fromEntries(entrants.map(r=>[r.id,{knockout:0,crew:0,fourWide:0}])),
    completed:false,championId:null}};
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
export function scoreChampionshipStage(raw,stage,placements) {
  const state=clone(raw);
  if(!state||state.completed||state.stage!==stage)throw Error('CHAMPIONSHIP STAGE MISMATCH');
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
  if(!state||state.stage!=='CREW')throw Error('CREW STAGE NOT ACTIVE');
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
