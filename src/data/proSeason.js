// Living seasons and manager-led crew series. Pure, seeded transitions; no clock.
import { normaliseProCircuitState, getProCircuitAccess, getProCircuitDriverSeeds, getProCircuitTeamSeeds } from './proCircuit.js?v=20261010-r469';
import { getCrewMembers } from './crewSystem.js?v=20261007-r413';
import { cars } from './cars.js?v=20261006-r388';
import { characters } from './characters.js?v=20261010-r459';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261006-r388';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';
import { getCarMagazineMeta } from './carMagazine.js?v=20261010-r467';

export const PRO_SEASON_LENGTH = 8;
export const CREW_SERIES = Object.freeze({id:'crewOpen',label:'CREW CLUB SERIES',team:true,entryFee:75000,prizeCash:210000,prizes:[210000,90000,40000,0],fixtures:3,squadSize:5,fieldSize:3});
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const value=(s,k,d=null)=>(typeof s?.get==='function'?s.get(k):s?.[k])??d;
const PLAYER='player:team';
export function seasonRandom(seed) {
  let n=2166136261;
  for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);
  return ()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function getSeasonStandings(raw,kind='DRIVER') {
  return (kind==='TEAM'?getProCircuitTeamSeeds(raw):getProCircuitDriverSeeds(raw))
    .sort((a,b)=>b.seasonPoints-a.seasonPoints||b.rating-a.rating||a.id.localeCompare(b.id));
}
export function getProfessionalAttendance(raw,{prestige=1,stage=0,final=false,team=false}={}) {
  const c=normaliseProCircuitState(raw),rank=(team?getProCircuitTeamSeeds(c):getProCircuitDriverSeeds(c)).find(r=>r.id=== (team?PLAYER:'player:driver'))?.seed||32;
  const score=prestige-1+(final?2:stage>0?1:0)+(rank<=5?1:0)+(c.calendar.round>=6?1:0);
  return score>=3?'full':score>=1?'half':'low';
}
function elo(a,b,won,k=20) {
  const delta=Math.round(k*((won?1:0)-1/(1+10**((b.rating-a.rating)/400))));
  a.rating=clamp(a.rating+delta,100,3000);b.rating=clamp(b.rating-delta,100,3000);
  a.wins+=won?1:0;a.losses+=won?0:1;b.wins+=won?0:1;b.losses+=won?1:0;
}
// The event is already settled by its owner. Do not increment eventTick here.
// Background races exclude official participants and never race the player.
export function completeSeasonRound(raw,summary,participants=[]) {
  const c=normaliseProCircuitState(raw);
  if(!summary?.id||c.calendar.history.some(e=>e.id===summary.id)||c.calendar.round>=PRO_SEASON_LENGTH)return c;
  const excluded=new Set(participants),rng=seasonRandom('season:'+c.season+':'+summary.id),background=[];
  for(const kind of ['DRIVER','TEAM']) {
    const roster=kind==='TEAM'?c.teams:c.drivers;
    const ids=Object.keys(roster).filter(id=>!excluded.has(id)).sort();
    for(let i=ids.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
    for(let i=0;i+1<ids.length;i+=2) {
      const a=roster[ids[i]],b=roster[ids[i+1]],won=rng()<1/(1+10**((b.rating-a.rating)/400));
      elo(a,b,won,10);a.entered++;b.entered++;a.seasonPoints+=won?5:1;b.seasonPoints+=won?1:5;
      background.push({kind,winner:ids[i+(won?0:1)],loser:ids[i+(won?1:0)]});
    }
  }
  c.calendar.round++;
  c.calendar.history=[...c.calendar.history,{...summary,background}].slice(-PRO_SEASON_LENGTH);
  if(c.calendar.round===PRO_SEASON_LENGTH)c.calendar.result={season:c.season,drivers:getSeasonStandings(c),teams:getSeasonStandings(c,'TEAM')};
  return c;
}
export function nextProfessionalSeason(raw) {
  const c=normaliseProCircuitState(raw);
  if(c.calendar.round<PRO_SEASON_LENGTH||c.activeTournament||c.activeCrewEvent)return {error:'FINISH THE CURRENT SEASON'};
  const result=c.calendar.result||{season:c.season,drivers:getSeasonStandings(c),teams:getSeasonStandings(c,'TEAM')};
  c.calendar={round:0,history:[],result:null,archives:[...c.calendar.archives,result].slice(-20)};c.season++;
  for(const row of [c.playerDriver,c.playerTeam,...Object.values(c.drivers),...Object.values(c.teams)])row.seasonPoints=0;
  return {circuit:c};
}
export function getCrewSeriesUnits(source,assignments={}) {
  const owned=value(source,'ownedCarIds',[]),states=value(source,'carStates',{});
  return Object.values(getCrewMembers(source)).filter(m=>owned.includes(m.loanCarId)&&cars[m.loanCarId]).map(m=>{
    const requested=assignments[m.characterId]||m.loanCarId;
    const valid=owned.includes(requested)&&cars[requested]&&(!cars[requested].crewLoan||requested===m.loanCarId);
    const carId=valid?requested:m.loanCarId,p=getVehiclePerformance(carId,states[carId]||{}),ai=characters[m.characterId]?.skill?.ai||getEncounterAi(3);
    const skill=clamp((ai.launchSkill+ai.shiftSkill+ai.reactionSkill)/3,.4,.99);
    return {id:m.characterId,name:characters[m.characterId]?.name||m.characterId,loanCarId:m.loanCarId,carId,validAssignment:valid,
      skill,performance:p.index.standing,powerKW:p.car.powerKW,drivetrain:getCarMagazineMeta(cars[carId].crewBaseCarId||carId)?.drivetrain||'RWD'};
  });
}
export function crewSeriesEligibility(source,squadIds=[],assignments={}) {
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  if(!getProCircuitAccess(source).unlocked)return 'RECRUIT ALL SEVEN CREW MEMBERS';
  if(c.activeTournament||c.activeCrewEvent||value(source,'competitionState')?.active)return 'RESUME THE ACTIVE COMPETITION';
  if(c.calendar.round>=PRO_SEASON_LENGTH)return 'BEGIN THE NEXT SEASON';
  if(c.calendar.round<1&&!value(source,'devMode'))return 'COMPLETE ONE PROFESSIONAL EVENT FIRST';
  if(Number(value(source,'cash',0))<CREW_SERIES.entryFee)return 'INSUFFICIENT CASH';
  const units=getCrewSeriesUnits(source,assignments), chosen=squadIds.map(id=>units.find(u=>u.id===id));
  if(squadIds.length<3||squadIds.length>5||new Set(squadIds).size!==squadIds.length||chosen.some(u=>!u||!u.validAssignment))return 'SELECT THREE TO FIVE ELIGIBLE DRIVERS';
  if(new Set(chosen.map(u=>u.carId)).size!==chosen.length)return 'REGISTER A DISTINCT CAR FOR EACH DRIVER';
  return null;
}
function opponentBuild(id,rating,slot) {
  const rng=seasonRandom(id+':'+slot),pool=['ae86','ek9','fc3s','evo3','r32','s2000','rx7fd','jza80'];
  const carId=pool[Math.floor(rng()*pool.length)],level=clamp(Math.round(2+(rating-1400)/220),1,5);
  const state=createRivalBuildState(cars[carId],level,{seed:id+':'+slot,raceType:'Standing Start'});
  return {carId,state,performance:getVehiclePerformance(carId,state).index.standing,skill:clamp(.72+(rating-1200)/1800,.65,.97)};
}
export function registerCrewSeries(source,squadIds,assignments={}) {
  const error=crewSeriesEligibility(source,squadIds,assignments);if(error)return {error};
  const c=normaliseProCircuitState(value(source,'proCircuit')),id='crewOpen:s'+c.season+':e'+(c.eventTick+1);
  const selected=getProCircuitTeamSeeds(c).filter(r=>r.id!==PLAYER).sort((a,b)=>Math.abs(a.rating-c.playerTeam.rating)-Math.abs(b.rating-c.playerTeam.rating)||a.id.localeCompare(b.id)).slice(0,3);
  const teams=[{id:PLAYER,name:'YOUR CREW',rating:c.playerTeam.rating},...selected].sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id));
  const entrants=teams.map((r,i)=>({...r,seed:i+1,drivers:[0,1,2].map(n=>opponentBuild(r.id,r.rating,n))}));
  const ids=entrants.map(t=>t.id),schedule=[[[ids[0],ids[3]],[ids[1],ids[2]]],[[ids[0],ids[2]],[ids[3],ids[1]]],[[ids[0],ids[1]],[ids[2],ids[3]]]];
  const units=getCrewSeriesUnits(source,assignments);
  const registeredCars=Object.fromEntries(squadIds.map(id=>[id,units.find(u=>u.id===id).carId]));
  c.activeCrewEvent={schema:1,id,eventId:CREW_SERIES.id,label:CREW_SERIES.label,round:0,entrants,schedule,squadIds:[...squadIds],assignments:registeredCars,history:[],fixture:null,entryFee:CREW_SERIES.entryFee,prizes:[...CREW_SERIES.prizes],difficulty:value(source,'playerDifficulty','STANDARD')};
  return {circuit:c,cash:Number(value(source,'cash'))-CREW_SERIES.entryFee};
}
export function getCrewFixture(raw) {
  const t=raw?.activeCrewEvent;
  if(!t||t.schema!==1||!Number.isInteger(t.round)||t.round<0||t.round>2||!Array.isArray(t.schedule?.[t.round])||!Array.isArray(t.entrants)||!Array.isArray(t.squadIds))return null;
  const pair=t.schedule[t.round].find(p=>Array.isArray(p)&&p.includes(PLAYER));
  const opponent=t.entrants.find(e=>e.id===pair?.find(id=>id!==PLAYER));
  if(!opponent||opponent.drivers?.length!==3)return null;
  return {id:t.id+':fixture:'+t.round,pair,opponent,round:t.round,prepared:t.fixture};
}
export function estimateCrewHeat(unit,rng,difficulty='STANDARD',opponent=false) {
  const adjustment=opponent?(difficulty==='EASY'?.4:difficulty==='HARD'?-.18:0):0;
  return Number(clamp(15.2*Math.pow(100/Math.max(15,unit.performance),.23)+(1-unit.skill)*3.5+adjustment+(rng()+rng()-1)*.6,7,29).toFixed(3));
}
export function prepareCrewSeriesFixture(source,lineupIds,fixtureId) {
  const c=normaliseProCircuitState(value(source,'proCircuit')),f=getCrewFixture(c),t=c.activeCrewEvent;
  if(!f||f.id!==fixtureId)return {error:'SAVED FIXTURE UNAVAILABLE'};
  if(f.prepared)return {circuit:c,fixture:f.prepared};
  const units=getCrewSeriesUnits(source,t.assignments),chosen=lineupIds.map(id=>units.find(u=>u.id===id));
  if(lineupIds.length!==3||new Set(lineupIds).size!==3||chosen.some(u=>!u||!u.validAssignment)||lineupIds.some(id=>!t.squadIds.includes(id)))return {error:'FIELD THREE REGISTERED DRIVERS AND CARS'};
  const rng=seasonRandom(f.id),heats=chosen.map((u,i)=>{
    const own=estimateCrewHeat(u,rng),other=estimateCrewHeat(f.opponent.drivers[i],rng,t.difficulty,true);
    return {driverId:u.id,name:u.name,carId:u.carId,opponentCarId:f.opponent.drivers[i].carId,ownSeconds:own,opponentSeconds:other,won:own<=other};
  });
  c.activeCrewEvent={...clone(t),fixture:{id:f.id,lineup:[...lineupIds],heats,revealed:0}};
  return {circuit:c,fixture:c.activeCrewEvent.fixture};
}
export function revealCrewSeriesHeat(raw,fixtureId,all=false) {
  const c=normaliseProCircuitState(raw),f=getCrewFixture(c);
  if(!f||f.id!==fixtureId||f.prepared?.heats?.length!==3)return {error:'NO PREPARED FIXTURE'};
  c.activeCrewEvent=clone(c.activeCrewEvent);const fixture=c.activeCrewEvent.fixture;
  fixture.revealed=all?3:Math.min(3,fixture.revealed+1);
  return {circuit:c,fixture};
}
function simulateTeamPair(t,pair,id) {
  const rng=seasonRandom(id),teams=pair.map(id=>t.entrants.find(e=>e.id===id));let wins=0;
  for(let n=0;n<3;n++)if(estimateCrewHeat(teams[0].drivers[n],rng)<=estimateCrewHeat(teams[1].drivers[n],rng))wins++;
  return {ids:pair,score:[wins,3-wins]};
}
export function getCrewSeriesTable(t) {
  if(!t?.entrants)return [];
  const rows=t.entrants.map(e=>({id:e.id,name:e.name,seed:e.seed,points:0,heatDifference:0}));
  for(const round of t.history||[])for(const f of round.fixtures)f.ids.forEach((id,i)=>{
    const row=rows.find(r=>r.id===id);if(row){row.points+=f.score[i]>=2?3:0;row.heatDifference+=f.score[i]-f.score[1-i];}
  });
  return rows.sort((a,b)=>b.points-a.points||b.heatDifference-a.heatDifference||a.seed-b.seed);
}
export function settleCrewSeriesFixture(raw,fixtureId) {
  const c=normaliseProCircuitState(raw),f=getCrewFixture(c),t=clone(c.activeCrewEvent);
  if(!f||f.id!==fixtureId||f.prepared?.revealed!==3||c.completedEventIds.includes(t.id))return {circuit:c,status:'STALE',cashPrize:0};
  const wins=f.prepared.heats.filter(h=>h.won).length;
  const fixtures=t.schedule[t.round].map((pair,i)=>pair.includes(PLAYER)?{ids:pair,score:pair.map(id=>id===PLAYER?wins:3-wins)}:simulateTeamPair(t,pair,t.id+':'+t.round+':'+i));
  t.history.push({round:t.round,fixtures,playerHeats:clone(f.prepared.heats)});t.round++;t.fixture=null;
  if(t.round<3){c.activeCrewEvent=t;return {circuit:c,status:'ADVANCED',cashPrize:0,wins};}
  const rankBefore=getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,ratingBefore=c.playerTeam.rating,table={[PLAYER]:c.playerTeam,...c.teams};
  for(const round of t.history)for(const match of round.fixtures)elo(table[match.ids[0]],table[match.ids[1]],match.score[0]>=2);
  const result=getCrewSeriesTable(t),place=result.findIndex(r=>r.id===PLAYER)+1;
  result.forEach((r,i)=>{table[r.id].entered++;table[r.id].seasonPoints+=[32,24,14,6][i];});
  const cashPrize=Math.floor(t.prizes[place-1]*(c.crewSeriesWins>0?.65:1));if(place===1)c.crewSeriesWins++;
  c.activeCrewEvent=null;c.eventTick++;c.completedEventIds=[...c.completedEventIds,t.id].slice(-250);
  const summary={id:t.id,label:t.label,discipline:'TEAM',placing:place,cashPrize,rankBefore,rankAfter:getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,ratingBefore,ratingAfter:c.playerTeam.rating,points:[32,24,14,6][place-1],table:result};
  c.lastTournament=summary;c.lastCrewEvent=t;
  return {circuit:completeSeasonRound(c,summary,t.entrants.map(e=>e.id)),status:'COMPLETE',cashPrize,wins,summary};
}
// Legacy three-round pro cups retain their original fee, purse and race engine.
export function settleLegacySeasonEvent(raw,state,roundsWon) {
  const c=normaliseProCircuitState(raw),id=state.proSeasonId||'legacy:'+state.eventId+':s'+c.season+':e'+(c.eventTick+1);
  if(c.completedEventIds.includes(id))return c;
  const participants=['player:driver'];
  const rankBefore=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver').seed;
  const ratingBefore=c.playerDriver.rating;
  for(let n=0;n<Math.min(3,roundsWon+1);n++) {
    const round=state.rounds[n],rivalId=Object.keys(c.drivers).find(id=>c.drivers[id].characterId===round?.characterId);
    const rival=rivalId?c.drivers[rivalId]:{rating:1300+Number(round?.encounterRating||3)*70,wins:0,losses:0};
    elo(c.playerDriver,rival,n<roundsWon);if(rivalId)participants.push(rivalId);
  }
  c.playerDriver.entered++;const points=[3,8,16,32][roundsWon];c.playerDriver.seasonPoints+=points;c.eventTick++;
  c.completedEventIds=[...c.completedEventIds,id].slice(-250);
  const summary={id,label:state.eventId==='midnightCup'?'MIDNIGHT CUP':'STREET SHOOTOUT',discipline:'DRIVER',placing:roundsWon===3?1:4-roundsWon,points,rankBefore,rankAfter:getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver').seed,ratingBefore,ratingAfter:c.playerDriver.rating,cashPrize:roundsWon===3?Number(state.prizeCash||0):0};
  c.lastTournament=summary;
  return completeSeasonRound(c,summary,participants);
}
