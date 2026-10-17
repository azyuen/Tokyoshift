// Living seasons and manager-led crew series. Pure, seeded transitions; no clock.
import { normaliseProCircuitState, getProCircuitAccess, getProCircuitDriverSeeds, getProCircuitTeamSeeds, PRO_CIRCUIT_TROPHIES } from './proCircuit.js?v=20261018-r584';
import { getCrewMembers } from './crewSystem.js?v=20261007-r413';
import { cars } from './cars.js?v=20261017-r565';
import { characters } from './characters.js?v=20261017-r565';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261006-r388';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';
import { getCarMagazineMeta } from './carMagazine.js?v=20261011-r479';

export const PRO_SEASON_LENGTH = 8;
export const OPEN_CIRCUIT_CREW_FEE = 35000;
export const OPEN_CIRCUIT_TROPHY_FEE = 45000;
export const OPEN_CIRCUIT_TROPHY_PRIZE = 90000;
// Cooldown is event-based, never real-world time. Two other completed open
// events are needed after a trophy attempt before the next one is offered.
export const OPEN_CIRCUIT_TROPHY_COOLDOWN = 2;
export function isOpenCircuitAvailable(raw) {
  const c=normaliseProCircuitState(raw);
  if(c.seasonStatus==='ACTIVE'||(c.activeChampionship&&!c.activeChampionship.completed))return false;
  return !(c.calendar.round>=PRO_SEASON_LENGTH&&getProQualification(c).qualified&&!c.activeChampionship);
}
export function getOpenCircuitTrophy(raw) {
  const c=normaliseProCircuitState(raw);
  const unlocked=t=>c.season>=t.season&&
    (!t.requiredTrophies||Object.values(c.trophyWins).filter(n=>n>0).length>=t.requiredTrophies);
  // Skip future-season invitations without permanently losing the rotation.
  const trophy=Array.from({length:PRO_CIRCUIT_TROPHIES.length},(_,i)=>
    PRO_CIRCUIT_TROPHIES[(c.minorTrophyIndex+i)%PRO_CIRCUIT_TROPHIES.length]).find(unlocked)
    ||PRO_CIRCUIT_TROPHIES[c.minorTrophyIndex];
  const eventsRemaining=Math.max(0,c.minorTrophyCooldownUntil-c.openCircuitTick);
  return {...trophy, available:isOpenCircuitAvailable(c)&&unlocked(trophy)&&!eventsRemaining,
    eventsRemaining,locked:!unlocked(trophy),firstWin:!c.trophyWins[trophy.id]};
}
// Settled once for each official paid standalone competition. No season points,
// calendar round, or championship qualification change in this path.
export function finishOpenCircuitEvent(raw,summary) {
  const c=normaliseProCircuitState(raw);
  if(!isOpenCircuitAvailable(c)||!summary?.id||c.completedEventIds.includes(summary.id))return c;
  c.eventTick++;
  c.openCircuitTick++;
  c.completedEventIds=[...c.completedEventIds,summary.id].slice(-250);
  if(summary.trophyId){
    const trophy=getOpenCircuitTrophy({...c,openCircuitTick:c.openCircuitTick-1});
    if(trophy.id===summary.trophyId){
      if(summary.placing===1)c.trophyWins[trophy.id]=(c.trophyWins[trophy.id]||0)+1;
      c.trophyHistory=[...c.trophyHistory,{id:summary.id,trophyId:trophy.id,season:c.season,
        placing:summary.placing,carId:summary.carId||null,driverIds:summary.driverIds||null,
        cashPrize:summary.cashPrize||0,rounds:summary.rounds||trophy.fixtures}].slice(-100);
      c.minorTrophyIndex=(PRO_CIRCUIT_TROPHIES.findIndex(t=>t.id===trophy.id)+1)%PRO_CIRCUIT_TROPHIES.length;
      c.minorTrophyCooldownUntil=c.openCircuitTick+OPEN_CIRCUIT_TROPHY_COOLDOWN;
    }
  }
  c.lastTournament={...summary,points:0,openCircuit:true};
  return c;
}
export function startProfessionalSeason(raw) {
  let c=normaliseProCircuitState(raw);
  if(!isOpenCircuitAvailable(c)||c.activeCrewEvent||c.activeTournament||c.activeTimedEvent||
    (c.activeChampionship&&!c.activeChampionship.completed))
    return {error:'FINISH THE CURRENT EVENT OR CHAMPIONSHIP'};
  if(c.seasonStatus==='COMPLETE'){
    const next=nextProfessionalSeason(c);
    if(next.error)return next;
    c=next.circuit;
  }
  if(c.calendar.round!==0||c.calendar.history.length)return {error:'SEASON ALREADY IN PROGRESS'};
  c.seasonStatus='ACTIVE';
  return {circuit:c};
}
export function forfeitProfessionalSeason(raw) {
  const c=normaliseProCircuitState(raw);
  if(c.seasonStatus!=='ACTIVE'&&
    !(c.seasonStatus==='COMPLETE'&&getProQualification(c).qualified))
    return {error:'NO ACTIVE SEASON TO FORFEIT'};
  const result={season:c.season,forfeited:true,roundsCompleted:c.calendar.round,
    driverPoints:c.playerDriver.seasonPoints,crewPoints:c.playerTeam.seasonPoints};
  c.calendar={round:0,history:[],result:null,
    archives:[...c.calendar.archives,result].slice(-20)};
  c.season++;
  c.seasonStatus='OPEN';
  c.activeCrewEvent=null;c.activeTournament=null;c.activeTimedEvent=null;c.activeChampionship=null;
  for(const row of [c.playerDriver,c.playerTeam,...Object.values(c.drivers),...Object.values(c.teams)])row.seasonPoints=0;
  return {circuit:c};
}
export const PRO_QUALIFICATION = Object.freeze({driver:60,crew:40});
// One official entry per round, with equal maximum points for driver and crew.
export const PRO_EVENT_POINTS = Object.freeze([20,17,15,13,12,11,10,9,8,7,6,5,4,3,2,1]);
export const PRO_SEASON_CALENDAR = Object.freeze([
  {driver:{id:'streetShootout',format:'KNOCKOUT',stock:true,maxPowerKW:180,noNos:true},crew:{format:'DUEL'}},
  {driver:{id:'midnightCup',format:'TIME_ATTACK',drivetrain:'RWD',maxPowerKW:380},crew:{format:'RELAY'}},
  {driver:{id:'fourWideOpen',format:'FOUR_WIDE'},crew:{format:'DUEL'}},
  {driver:{id:'streetShootout',format:'CONSISTENCY',drivetrain:'FWD',maxPowerKW:180},crew:{format:'TECHNICAL'}},
  {driver:{id:'midnightCup',format:'KNOCKOUT',drivetrain:'AWD',maxPowerKW:550},crew:{format:'FOUR_WIDE'}},
  {driver:{id:'streetShootout',format:'TIME_ATTACK',stock:true,maxPowerKW:300,noNos:true},crew:{format:'RELAY'}},
  {driver:{id:'fourWideOpen',format:'FOUR_WIDE',drivetrain:'RWD',maxPowerKW:260},crew:{format:'TECHNICAL'}},
  {driver:{id:'tokyoInvitational',format:'KNOCKOUT'},crew:{format:'DUEL'}},
]);
export function getProfessionalRoundEvents(round){return PRO_SEASON_CALENDAR[Math.max(0,Math.min(7,Math.floor(Number(round)||0)))];}
// Scrutineering checks the actual installed parts, not just horsepower.
// Cosmetic paint/wheels, ownership metadata and unused saved presets do not
// affect factory specification. Missing/legacy states default to stock.
export function getFactoryStockStatus(state={}) {
  if(!state||typeof state!=='object'||Array.isArray(state))
    return {stock:false,reasons:['INVALID VEHICLE STATE']};
  const reasons=[];
  const groups=['tuning','engineTuning','drivetrainTuning','chassisTuning','exhaustNosTuning'];
  for(const key of groups) {
    const group=state[key];
    if(group==null)continue;
    if(typeof group!=='object'||Array.isArray(group)) {
      reasons.push('UNVERIFIED '+key.toUpperCase());
      continue;
    }
    if(Object.entries(group).some(([part,level])=>
      (typeof level==='object' ? level!==null :
        typeof level==='boolean'?level:
        typeof level==='number'?level!==0:
        typeof level==='string'?level!==''&&level!=='0':false)))
      reasons.push('MODIFIED '+key.toUpperCase());
  }
  // Old pink-slip cars can have a hidden legacy tune with no workshop parts.
  if(Number(state.tuneLevel||0)>2)reasons.push('LEGACY PERFORMANCE TUNE');
  if(state.nosInstalled||Number(state.nosPower||0)>0&&state.nosInstalled)
    reasons.push('AFTERMARKET NITROUS');
  if(state.stage3Calibration&&['ecuBias','boostBias','gearBias'].some(k=>Number(state.stage3Calibration[k]||0)!==0))
    reasons.push('CUSTOM ECU / BOOST / GEAR CALIBRATION');
  if(state.specialistTuning&&Object.values(state.specialistTuning).some(v=>Boolean(v)))
    reasons.push('SPECIALIST TUNING');
  return {stock:reasons.length===0,reasons};
}
export function getProfessionalCarEligibility(carId, carState={}, rules={}) {
  const car=cars[carId];
  if(!car)return {eligible:false,reasons:['UNKNOWN CAR']};
  const power=Number(getVehiclePerformance(carId,carState)?.car?.powerKW);
  const drivetrain=String(getCarMagazineMeta(carId)?.drivetrain||'').toUpperCase();
  const expected=String(rules.drivetrain||'').toUpperCase();
  const aliases={FF:'FWD',FR:'RWD',AWD:'AWD',FWD:'FWD',RWD:'RWD'};
  const reasons=[];
  if(car.ginzaDemo)reasons.push('GINZA GALLERY LOAN // EXHIBITION ONLY');
  if(!Number.isFinite(power))reasons.push('PERFORMANCE UNAVAILABLE');
  if(Number.isFinite(rules.maxPowerKW)&&power>rules.maxPowerKW+0.001)reasons.push('POWER LIMIT '+rules.maxPowerKW+' KW');
  if(expected&&aliases[drivetrain]!==aliases[expected])reasons.push('REQUIRES '+expected);
  if(rules.stock)reasons.push(...getFactoryStockStatus(carState).reasons);
  if(rules.noNos&&(Boolean(carState?.nosInstalled)||Number(carState?.exhaustNosTuning?.nosKit||0)>0))reasons.push('NOS PROHIBITED');
  return {eligible:reasons.length===0,reasons,powerKW:power,drivetrain};
}


// Official timing rules shared by future driver Time Attack and Consistency
// events. All attempts must be recorded by the live race scene; no simulated
// player times or free wins are generated here.
export function scoreProfessionalTimedRuns(format, attempts, rivalAttempts=[]) {
  const mode=String(format||'').toUpperCase();
  if(!['TIME_ATTACK','CONSISTENCY'].includes(mode))return {valid:false,reason:'UNSUPPORTED FORMAT'};
  const parse=r=>Array.isArray(r)&&r.length===3?r.map(a=>{
    const time=typeof a==='number'?a:a?.finishSeconds;
    const disqualified=typeof a==='object'&&a!==null&&Boolean(a.disqualified);
    return !disqualified&&typeof time==='number'&&Number.isFinite(time)&&time>0&&time<120?time:null;
  }):null;
  const own=parse(attempts),rival=parse(rivalAttempts);
  if(!own||!rival)return {valid:false,reason:'THREE RECORDED RUNS REQUIRED'};
  const score=times=>{
    const finished=times.filter(t=>t!==null);
    if(mode==='TIME_ATTACK')return finished.length?Math.min(...finished):null;
    return finished.length===3?Math.max(...finished)-Math.min(...finished):null;
  };
  const playerScore=score(own),rivalScore=score(rival);
  // A tie is not a win; compare raw seconds with a small tolerance to avoid
  // floating-point noise awarding an artificial victory.
  const tied=playerScore!==null&&rivalScore!==null&&Math.abs(playerScore-rivalScore)<=0.000001;
  const won=playerScore!==null&&(rivalScore===null||playerScore<rivalScore-0.000001);
  return {valid:true,format:mode,playerScore,rivalScore,tied,won,
    completedRuns:own.filter(t=>t!==null).length,
    rivalCompletedRuns:rival.filter(t=>t!==null).length};
}

// Timed driver events are recorded one real run at a time. These transitions
// are idempotent so an interrupted PWA session cannot double-record a run.
export function registerProfessionalTimedEvent(raw, carId, entryFee=0, carState=null) {
  const c=normaliseProCircuitState(raw);
  if(c.seasonStatus!=='ACTIVE'||c.calendar.round>=PRO_SEASON_LENGTH)return {error:'SEASON NOT ACTIVE'};
  const rules=getProfessionalRoundEvents(c.calendar.round).driver;
  if(!['TIME_ATTACK','CONSISTENCY'].includes(rules.format)||
    c.activeTimedEvent||c.activeTournament||c.activeCrewEvent||
    c.activeChampionship||!cars[carId])return {error:'TIMED EVENT UNAVAILABLE'};
  // Registration must validate the actual owned car build, not just the ID.
  // Null means the caller has not supplied a trustworthy tuning snapshot.
  if(!carState||typeof carState!=='object'||Array.isArray(carState))
    return {error:'CAR BUILD REQUIRED FOR SCRUTINEERING'};
  const eligibility=getProfessionalCarEligibility(carId,carState,rules);
  if(!eligibility.eligible)return {error:eligibility.reasons.join(' / ')};
  if(!Number.isSafeInteger(entryFee)||entryFee<0)return {error:'INVALID ENTRY FEE'};
  const id='timed:s'+c.season+':r'+c.calendar.round;
  c.activeTimedEvent={id,format:rules.format,carId,round:c.calendar.round,
    entryFee,carState:JSON.parse(JSON.stringify(carState)),attempts:[],rivalAttempts:[]};
  return {circuit:c,event:c.activeTimedEvent};
}
export function recordProfessionalTimedAttempt(raw,eventId,runIndex,result,rivalResult) {
  const c=normaliseProCircuitState(raw),e=c.activeTimedEvent;
  if(!e||e.id!==eventId||e.round!==c.calendar.round||
    !Array.isArray(e.attempts)||!Array.isArray(e.rivalAttempts)||
    e.attempts.length!==e.rivalAttempts.length||
    !Number.isInteger(runIndex)||runIndex!==e.attempts.length||runIndex>=3)
    return {error:'STALE TIMED ATTEMPT'};
  const valid=r=>r&&typeof r.disqualified==='boolean'&&
    (r.finishSeconds===null||
      (typeof r.finishSeconds==='number'&&!r.disqualified&&
       Number.isFinite(r.finishSeconds)&&r.finishSeconds>0&&r.finishSeconds<120));
  if(!valid(result)||!valid(rivalResult))return {error:'INVALID RACE RESULT'};
  // A disqualification cannot simultaneously count as a valid finish.
  // Store its time as null so downstream results and save resumes agree.
  const clean=r=>({finishSeconds:r.disqualified?null:r.finishSeconds,disqualified:r.disqualified});
  c.activeTimedEvent={...e,attempts:[...e.attempts,clean(result)],
    rivalAttempts:[...e.rivalAttempts,clean(rivalResult)]};
  return {circuit:c,event:c.activeTimedEvent,complete:c.activeTimedEvent.attempts.length===3};
}
// Finalisation is a single saved-state transition: repeating it after a
// reload cannot award points twice or advance the calendar again.
export function completeProfessionalTimedEvent(raw) {
  const c=normaliseProCircuitState(raw);
  const result=getProfessionalTimedEventResult(c);
  if(!result?.valid)return {error:'THREE COMPLETED ATTEMPTS REQUIRED'};
  const event=c.activeTimedEvent;
  const points=result.tied?12:result.won?20:8;
  const summary={id:event.id,discipline:'DRIVER',format:event.format,
    placing:result.tied?1:result.won?1:2,points,playerScore:result.playerScore,
    rivalScore:result.rivalScore,tied:result.tied,won:result.won};
  // Apply the player's standing before generating the round's final table.
  // completeSeasonRound handles AI standings, not the player's points.
  c.playerDriver.entered++;
  c.playerDriver.seasonPoints+=points;
  c.playerDriver.wins+=result.won?1:0;
  c.playerDriver.losses+=result.won||result.tied?0:1;
  c.eventTick++;
  c.completedEventIds=[...c.completedEventIds,event.id].slice(-250);
  const next=completeSeasonRound(c,summary,[]);
  if(next.calendar.round===c.calendar.round)return {error:'SEASON ROUND NOT ADVANCED'};
  next.activeTimedEvent=null;
  return {circuit:next,summary};
}
export function getProfessionalTimedEventResult(raw) {
  const c=normaliseProCircuitState(raw),e=c.activeTimedEvent;
  if(!e||e.round!==c.calendar.round||e.attempts?.length!==3||
    e.rivalAttempts?.length!==3)return null;
  return {...scoreProfessionalTimedRuns(e.format,e.attempts,e.rivalAttempts),
    id:e.id,carId:e.carId,round:e.round};
}

export function getProQualification(raw) {
  const c=normaliseProCircuitState(raw);
  const driver=c.playerDriver.seasonPoints,crew=c.playerTeam.seasonPoints;
  const roundsRemaining=Math.max(0,PRO_SEASON_LENGTH-c.calendar.round);
  // Only one official discipline can score in each remaining round.
  // Each event awards at most 20 points, so qualification requires enough
  // remaining slots for BOTH targets, not merely enough total points.
  const driverEventsNeeded=Math.ceil(Math.max(0,PRO_QUALIFICATION.driver-driver)/20);
  const crewEventsNeeded=Math.ceil(Math.max(0,PRO_QUALIFICATION.crew-crew)/20);
  const qualified=driver>=PRO_QUALIFICATION.driver&&crew>=PRO_QUALIFICATION.crew;
  return {driver,crew,driverRequired:PRO_QUALIFICATION.driver,crewRequired:PRO_QUALIFICATION.crew,
    qualified,roundsRemaining,driverEventsNeeded,crewEventsNeeded,
    qualificationPossible:qualified||driverEventsNeeded+crewEventsNeeded<=roundsRemaining};
}
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
// Pure, repeatable season simulation. It only computes fixtures; callers commit
// these results once after the player's official competition is settled.
export function simulateProfessionalRound(raw, round, playerDiscipline='DRIVER', occupiedIds=[]) {
  const c=normaliseProCircuitState(raw);
  const index=Math.max(0,Math.min(PRO_SEASON_LENGTH-1,Math.floor(Number(round)||0)));
  const rng=seasonRandom('pro:season:'+c.season+':round:'+index);
  const occupied=new Set(occupiedIds);
  // Player-opponent IDs can be supplied as driver IDs or team IDs.
  // The mapped counterpart must not earn a second simulated result.
  // Pair the original 23 AI drivers with the original 23 teams.
  // Unknown roster entries from older/future saves are appended, never
  // allowed to shift the established driver-to-team correspondence.
  const baseline=normaliseProCircuitState(null);
  const canonicalDrivers=Object.keys(baseline.drivers).sort();
  const canonicalTeams=Object.keys(baseline.teams).sort();
  const extraDrivers=Object.keys(c.drivers).filter(id=>!baseline.drivers[id]).sort();
  const extraTeams=Object.keys(c.teams).filter(id=>!baseline.teams[id]).sort();
  const driverIds=[...canonicalDrivers,...extraDrivers].filter(id=>c.drivers[id]);
  const teamIds=[...canonicalTeams,...extraTeams].filter(id=>c.teams[id]);
  const competitors=driverIds.map((id,index)=>({id,record:c.drivers[id],teamId:teamIds[index]||null}));
  competitors.forEach(({id,teamId})=>{
    if(teamId&&(occupied.has(id)||occupied.has(teamId))){occupied.add(id);occupied.add(teamId);}
  });
  // A single decision per professional: driver OR crew, never both.
  const entries={DRIVER:[],TEAM:[]};
  for(const item of competitors.sort((a,b)=>a.id.localeCompare(b.id))) {
    if(occupied.has(item.id)||occupied.has(item.teamId))continue;
    const teamId=item.teamId;
    const team=c.teams[teamId];
    const driverGap=60-item.record.seasonPoints;
    const crewGap=40-(team?.seasonPoints||0);
    const discipline=team&&(crewGap>driverGap*0.7 || (Math.abs(crewGap-driverGap*0.7)<4&&rng()<0.5))?'TEAM':'DRIVER';
    entries[discipline].push({id:discipline==='TEAM'?teamId:item.id,rating:discipline==='TEAM'?team.rating:item.record.rating});
  }
  const results={};
  for(const discipline of ['DRIVER','TEAM']){
    const field=entries[discipline].map(e=>({
      ...e,performance:e.rating+(rng()+rng()+rng()-1.5)*210
    })).sort((a,b)=>b.performance-a.performance||a.id.localeCompare(b.id));
    results[discipline]=field.map((e,i)=>({
      id:e.id,placing:i+1,points:PRO_EVENT_POINTS[i]||0,
      rating:e.rating
    }));
  }
  return {season:c.season,round:index,events:getProfessionalRoundEvents(index),results};
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
  // Resolve one AI event per competitor. Player-driven opponents are excluded
  // from background scoring so their actual race result remains authoritative.
  const simulation=simulateProfessionalRound(c,c.calendar.round,summary.discipline,participants);
  const background=[];
  for(const kind of ['DRIVER','TEAM']) {
    const roster=kind==='TEAM'?c.teams:c.drivers;
    for(const result of simulation.results[kind]) {
      const standing=roster[result.id];
      if(!standing)continue;
      standing.entered++;
      standing.seasonPoints+=result.points;
      background.push({kind,id:result.id,placing:result.placing,points:result.points});
    }
  }
  c.calendar.round++;
  c.calendar.history=[...c.calendar.history,{...summary,background}].slice(-PRO_SEASON_LENGTH);
  if(c.calendar.round===PRO_SEASON_LENGTH){
    c.calendar.result={season:c.season,drivers:getSeasonStandings(c),teams:getSeasonStandings(c,'TEAM')};
    c.seasonStatus='COMPLETE';
  }
  return c;
}
export function nextProfessionalSeason(raw) {
  const c=normaliseProCircuitState(raw);
  if(c.calendar.round<PRO_SEASON_LENGTH||c.activeTournament||c.activeCrewEvent||c.activeTimedEvent||(getProQualification(c).qualified&&!c.activeChampionship)||(c.activeChampionship&&!c.activeChampionship.completed))return {error:'FINISH THE CURRENT SEASON OR CHAMPIONSHIP'};
  const result=c.calendar.result||{season:c.season,drivers:getSeasonStandings(c),teams:getSeasonStandings(c,'TEAM')};
  c.calendar={round:0,history:[],result:null,archives:[...c.calendar.archives,result].slice(-20)};
  if(c.activeChampionship?.completed){
    // Keep completed championship results across seasons. Ginza vault access
    // must not vanish after the next professional calendar begins.
    c.championshipHistory = [...(c.championshipHistory || []),
      { season:c.activeChampionship.season, completed:true,
        championId:c.activeChampionship.championId }].slice(-20);
    c.activeChampionship=null;
  }
  c.season++;
  c.seasonStatus='OPEN';
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
  if(c.activeTournament||c.activeCrewEvent||c.activeTimedEvent||c.activeChampionship&&!c.activeChampionship.completed||value(source,'competitionState')?.active)return 'RESUME THE ACTIVE COMPETITION';
  if(!isOpenCircuitAvailable(c)&&c.seasonStatus!=='ACTIVE')return 'FINISH THE CHAMPIONSHIP';
  if(c.calendar.round>=PRO_SEASON_LENGTH&&!isOpenCircuitAvailable(c))return 'BEGIN THE NEXT SEASON';
  if(!['DUEL','RELAY','TECHNICAL','FOUR_WIDE'].includes(getProfessionalRoundEvents(c.calendar.round).crew.format))
    return 'CREW FORMAT NOT AVAILABLE';
  if(Number(value(source,'cash',0))<(isOpenCircuitAvailable(c)?OPEN_CIRCUIT_CREW_FEE:CREW_SERIES.entryFee))return 'INSUFFICIENT CASH';
  const units=getCrewSeriesUnits(source,assignments), chosen=squadIds.map(id=>units.find(u=>u.id===id));
  if(squadIds.length<3||squadIds.length>5||new Set(squadIds).size!==squadIds.length||chosen.some(u=>!u||!u.validAssignment))return 'SELECT THREE TO FIVE ELIGIBLE DRIVERS';
  if(new Set(chosen.map(u=>u.carId)).size!==chosen.length)return 'REGISTER A DISTINCT CAR FOR EACH DRIVER';
  return null;
}
function opponentBuild(id,rating,slot) {
  const rng=seasonRandom(id+':'+slot),pool=['ae86','ek9','fc3s','galant','r32','s2000','rx7fd','jza80'];
  const carId=pool[Math.floor(rng()*pool.length)],level=clamp(Math.round(2+(rating-1400)/220),1,5);
  const state=createRivalBuildState(cars[carId],level,{seed:id+':'+slot,raceType:'Standing Start'});
  return {carId,state,performance:getVehiclePerformance(carId,state).index.standing,skill:clamp(.72+(rating-1200)/1800,.65,.97)};
}
export function registerCrewSeries(source,squadIds,assignments={},trophyId=null) {
  const error=crewSeriesEligibility(source,squadIds,assignments);if(error)return {error};
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  const openCircuit=isOpenCircuitAvailable(c);
  const trophy=trophyId&&openCircuit?getOpenCircuitTrophy(c):null;
  if(trophyId&&(!trophy?.available||trophy.id!==trophyId||
    !['TEAM','MIXED'].includes(trophy.discipline)))return {error:'TROPHY ROTATION OR COOLDOWN CHANGED'};
  if(trophy?.id==='triDrive'){
    if(squadIds.length!==3)return {error:'REGISTER EXACTLY THREE DRIVERS FOR TRI-DRIVE'};
    const units=getCrewSeriesUnits(source,assignments);
    const drives=squadIds.map(id=>String(units.find(u=>u.id===id)?.drivetrain||'').toUpperCase())
      .map(d=>({FF:'FWD',FR:'RWD'}[d]||d));
    if(new Set(drives).size!==3||!['FWD','RWD','AWD'].every(d=>drives.includes(d)))
      return {error:'TRI-DRIVE NEEDS ONE FWD, ONE RWD AND ONE AWD CAR'};
  }
  const fee=openCircuit?(trophy?.entryFee||OPEN_CIRCUIT_CREW_FEE):CREW_SERIES.entryFee;
  if(Number(value(source,'cash',0))<fee)return {error:'INSUFFICIENT CASH'};
  const id=(trophyId?'trophy:'+trophyId:'crewOpen')+':s'+c.season+':e'+(c.eventTick+1);
  const format=trophy?.formats?.[0]||(openCircuit?['DUEL','RELAY','TECHNICAL','FOUR_WIDE'][c.openCircuitTick%4]:
    getProfessionalRoundEvents(c.calendar.round).crew.format);
  const teamsPool=getProCircuitTeamSeeds(c).filter(r=>r.id!==PLAYER);
  // Prestige entries face the seeded elite, not rating-matched open-circuit opponents.
  const selected=(trophy?teamsPool:teamsPool.sort((a,b)=>
    Math.abs(a.rating-c.playerTeam.rating)-Math.abs(b.rating-c.playerTeam.rating)||a.id.localeCompare(b.id))).slice(0,3);
  const teams=[{id:PLAYER,name:'YOUR CREW',rating:c.playerTeam.rating},...selected].sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id));
  const entrants=teams.map((r,i)=>({...r,seed:i+1,drivers:[0,1,2].map(n=>opponentBuild(r.id,r.rating,n))}));
  const ids=entrants.map(t=>t.id),schedule=[[[ids[0],ids[3]],[ids[1],ids[2]]],[[ids[0],ids[2]],[ids[3],ids[1]]],[[ids[0],ids[1]],[ids[2],ids[3]]]];
  const units=getCrewSeriesUnits(source,assignments);
  const registeredCars=Object.fromEntries(squadIds.map(id=>[id,units.find(u=>u.id===id).carId]));
  c.activeCrewEvent={schema:1,short:!trophy,format,formats:trophy?.formats||null,id,eventId:CREW_SERIES.id,
    label:trophy?.label||CREW_SERIES.label,openCircuit,trophyId:trophy?.id||null,
    round:0,entrants,schedule,squadIds:[...squadIds],assignments:registeredCars,
    history:[],fixture:null,entryFee:fee,prizes:trophy?
      [c.trophyWins[trophy.id]?trophy.repeatCash:trophy.prizeCash,90000,40000,0]:
      openCircuit?[70000,30000,15000,0]:[...CREW_SERIES.prizes],
    difficulty:value(source,'playerDifficulty','STANDARD')};
  return {circuit:c,cash:Number(value(source,'cash'))-fee};
}
export function getCrewFixture(raw) {
  const t=raw?.activeCrewEvent;
  if(!t||t.schema!==1||!Number.isInteger(t.round)||t.round<0||t.round>2||!Array.isArray(t.schedule?.[t.round])||!Array.isArray(t.entrants)||!Array.isArray(t.squadIds))return null;
  if (typeof t.id !== 'string' || t.entrants.length !== 4 ||
      t.entrants.some(e => !e || typeof e.id !== 'string' || !Array.isArray(e.drivers) || e.drivers.length !== 3 || e.drivers.some(d => !d || !cars[d.carId] || !Number.isFinite(d.performance) || !Number.isFinite(d.skill))) ||
      new Set(t.entrants.map(e => e.id)).size !== 4 || !t.entrants.some(e => e.id === PLAYER) ||
      !Array.isArray(t.history) || t.history.length !== t.round ||
      !Array.isArray(t.prizes) || t.prizes.length !== 4 || t.prizes.some(n => !Number.isFinite(n) || n < 0 || n > 500000) ||
      t.squadIds.length < 3 || t.squadIds.length > 5 || new Set(t.squadIds).size !== t.squadIds.length ||
      t.schedule[t.round].length !== 2 || t.schedule[t.round].some(p => !Array.isArray(p) || p.length !== 2 || p.some(id => !t.entrants.some(e => e.id === id))) ||
      new Set(t.schedule[t.round].flat()).size !== 4) return null;
  if (t.fixture && (t.fixture.id !== t.id+':fixture:'+t.round ||
      !Array.isArray(t.fixture.heats) || t.fixture.heats.length !== 3 ||
      !Number.isInteger(t.fixture.revealed) || t.fixture.revealed < 0 || t.fixture.revealed > 3 ||
      t.fixture.heats.some(h => !h || typeof h.won !== 'boolean' || !Number.isFinite(h.ownSeconds) || !Number.isFinite(h.opponentSeconds)))) return null;
  const pair=t.schedule[t.round].find(p=>Array.isArray(p)&&p.includes(PLAYER));
  const opponent=t.entrants.find(e=>e.id===pair?.find(id=>id!==PLAYER));
  if(!opponent||opponent.drivers?.length!==3)return null;
  return {id:t.id+':fixture:'+t.round,pair,opponent,round:t.round,
    format:t.formats?.[t.round]||t.format,prepared:t.fixture};
}
export function estimateCrewHeat(unit,rng,difficulty='STANDARD',opponent=false) {
  const adjustment=opponent?(difficulty==='EASY'?.4:difficulty==='HARD'?-.18:0):0;
  return Number(clamp(15.2*Math.pow(100/Math.max(15,unit.performance),.23)+(1-unit.skill)*3.5+adjustment+(rng()+rng()-1)*.6,7,29).toFixed(3));
}
export function prepareCrewSeriesFixture(source,lineupIds,fixtureId,playerDriven=false) {
  const c=normaliseProCircuitState(value(source,'proCircuit')),f=getCrewFixture(c),t=c.activeCrewEvent;
  if(!f||f.id!==fixtureId)return {error:'SAVED FIXTURE UNAVAILABLE'};
  if(f.prepared)return {circuit:c,fixture:f.prepared};
  const units=getCrewSeriesUnits(source,t.assignments),chosen=lineupIds.map(id=>units.find(u=>u.id===id));
  if(lineupIds.length!==3||new Set(lineupIds).size!==3||chosen.some(u=>!u||!u.validAssignment)||lineupIds.some(id=>!t.squadIds.includes(id)))return {error:'FIELD THREE REGISTERED DRIVERS AND CARS'};
  if(new Set(chosen.map(u=>u.carId)).size!==3)return {error:'FIELD THREE DISTINCT CARS'};
  const rng=seasonRandom(f.id),heats=chosen.map((u,i)=>{
    const own=playerDriven?0:estimateCrewHeat(u,rng),other=playerDriven?0:estimateCrewHeat(f.opponent.drivers[i],rng,t.difficulty,true);
    return {driverId:u.id,name:u.name,carId:u.carId,opponentCarId:f.opponent.drivers[i].carId,ownSeconds:own,opponentSeconds:other,won:own<=other};
  });
  c.activeCrewEvent={...clone(t),fixture:{id:f.id,lineup:[...lineupIds],heats,revealed:0}};
  return {circuit:c,fixture:c.activeCrewEvent.fixture};
}
export function revealCrewSeriesHeat(raw,fixtureId,all=false) {
  const c=normaliseProCircuitState(raw),f=getCrewFixture(c);
  if(!f||f.id!==fixtureId||f.prepared?.heats?.length!==3)return {error:'NO PREPARED FIXTURE'};
  if(f.prepared.control==='PLAYER')return {error:'DRIVE THE HEAT TO RECORD A RESULT'};
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
  if(f.prepared.control==='PLAYER'&&f.prepared.heats.some(h=>h.pending))return {circuit:c,status:'STALE',cashPrize:0};
  const heatWins=f.prepared.heats.filter(h=>h.won).length;
  const fourWide=f.format==='FOUR_WIDE';
  const relay=f.format==='RELAY';
  // Relay uses the combined elapsed time of all three player-driven legs.
  // DNF/DQ loses the relay; individual heat wins do not decide its result.
  const playerFinished=f.prepared.heats.every(h=>h.ownStatus==='FINISHED'&&Number.isFinite(h.ownSeconds)&&h.ownSeconds>0);
  const opponentFinished=f.prepared.heats.every(h=>h.opponentStatus==='FINISHED'&&Number.isFinite(h.opponentSeconds)&&h.opponentSeconds>0);
  const ownTotal=f.prepared.heats.reduce((sum,h)=>sum+h.ownSeconds,0);
  const opponentTotal=f.prepared.heats.reduce((sum,h)=>sum+h.opponentSeconds,0);
  const relayWon=playerFinished&&(!opponentFinished||ownTotal<opponentTotal-0.000001);
  const technical=f.format==='TECHNICAL';
  // Technical rewards repeatability: smallest spread between fastest and
  // slowest completed leg wins. All three legs must finish cleanly.
  const spread=key=>Math.max(...f.prepared.heats.map(h=>h[key]))-
    Math.min(...f.prepared.heats.map(h=>h[key]));
  const ownSpread=playerFinished?spread('ownSeconds'):null;
  const opponentSpread=opponentFinished?spread('opponentSeconds'):null;
  const technicalWon=playerFinished&&(!opponentFinished||ownSpread<opponentSpread-0.000001);
  const fourWidePoints=f.prepared.heats.reduce((sum,h)=>sum+(Number.isInteger(h.place)&&h.place>=1&&h.place<=4?4-h.place:0),0);
  // Three personally driven four-lane heats: 0–9 placing points.
  // Convert aggregate performance to the existing four crew prize tiers.
  const wins=fourWide?(fourWidePoints>=8?3:fourWidePoints>=5?2:fourWidePoints>=2?1:0):technical?(technicalWon?3:0):relay?(relayWon?3:0):heatWins;
  const fixtures=t.schedule[t.round].map((pair,i)=>pair.includes(PLAYER)?{ids:pair,score:pair.map(id=>id===PLAYER?wins:3-wins)}:simulateTeamPair(t,pair,t.id+':'+t.round+':'+i));
  t.history.push({round:t.round,fixtures,playerHeats:clone(f.prepared.heats)});t.round++;t.fixture=null;
  if(t.short) {
    // New season crew sprints are exactly one three-heat fixture. Older saved
    // round-robin series omit 'short' and continue through all three fixtures.
    const rankBefore=getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed;
    const ratingBefore=c.playerTeam.rating;
    const match=fixtures.find(m=>m.ids.includes(PLAYER));
    const opponentId=match.ids.find(id=>id!==PLAYER);
    elo(c.playerTeam,c.teams[opponentId],wins>=2);
    c.playerTeam.entered++;
    const points=t.openCircuit?0:[2,7,13,20][wins];
    c.playerTeam.seasonPoints+=points;
    const cashPrize=t.openCircuit?(t.trophyId?(wins===3?OPEN_CIRCUIT_TROPHY_PRIZE:0):
      [0,15000,30000,70000][wins]):
      Math.floor([0,40000,90000,210000][wins]*(c.crewSeriesWins>0?.65:1));
    if(wins===3&&!t.openCircuit)c.crewSeriesWins++;
    c.activeCrewEvent=null;
    if(!t.openCircuit){
      c.eventTick++;
      c.completedEventIds=[...c.completedEventIds,t.id].slice(-250);
    }
    const summary={id:t.id,label:fourWide?'CREW FOUR-WIDE':technical?'CREW TECHNICAL':relay?'CREW RELAY':'CREW CLUB SPRINT',discipline:'TEAM',format:t.format||'DUEL',placing:4-wins,
      cashPrize,rankBefore,rankAfter:getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,
      ratingBefore,ratingAfter:c.playerTeam.rating,points,wins,heatWins,fourWidePoints,ownTotal,opponentTotal,ownSpread,opponentSpread,
      trophyId:t.trophyId||null,openCircuit:Boolean(t.openCircuit)};
    c.lastTournament=summary;c.lastCrewEvent=t;
    return {circuit:t.openCircuit?finishOpenCircuitEvent(c,summary):completeSeasonRound(c,summary,t.entrants.map(e=>e.id)),status:'COMPLETE',cashPrize,wins,summary};
  }
  if(t.round<3){c.activeCrewEvent=t;return {circuit:c,status:'ADVANCED',cashPrize:0,wins};}
  const rankBefore=getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,ratingBefore=c.playerTeam.rating,table={[PLAYER]:c.playerTeam,...c.teams};
  for(const round of t.history)for(const match of round.fixtures)elo(table[match.ids[0]],table[match.ids[1]],match.score[0]>=2);
  const result=getCrewSeriesTable(t),place=result.findIndex(r=>r.id===PLAYER)+1;
  result.forEach((r,i)=>{table[r.id].entered++;if(!t.openCircuit)table[r.id].seasonPoints+=[20,15,10,5][i];});
  const cashPrize=t.openCircuit?t.prizes[place-1]:
    Math.floor(t.prizes[place-1]*(c.crewSeriesWins>0?.65:1));
  if(place===1&&!t.openCircuit)c.crewSeriesWins++;
  c.activeCrewEvent=null;
  if(!t.openCircuit){c.eventTick++;c.completedEventIds=[...c.completedEventIds,t.id].slice(-250);}
  const summary={id:t.id,label:t.label,discipline:'TEAM',placing:place,cashPrize,
    rankBefore,rankAfter:getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,
    ratingBefore,ratingAfter:c.playerTeam.rating,points:t.openCircuit?0:[20,15,10,5][place-1],
    table:result,format:'TOURNAMENT',trophyId:t.trophyId||null,
    openCircuit:Boolean(t.openCircuit),rounds:3,driverIds:t.squadIds};
  c.lastTournament=summary;c.lastCrewEvent=t;
  return {circuit:t.openCircuit?finishOpenCircuitEvent(c,summary):
    completeSeasonRound(c,summary,t.entrants.map(e=>e.id)),
    status:'COMPLETE',cashPrize,wins,summary};
}
// Legacy three-round pro cups retain their original fee, purse and race engine.
export function settleLegacySeasonEvent(raw,state,roundsWon) {
  const c=normaliseProCircuitState(raw),id=state.proSeasonId||'legacy:'+state.eventId+':s'+c.season+':e'+(c.eventTick+1);
  if(c.completedEventIds.includes(id))return c;
  const participants=['player:driver'];
  const rankBefore=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver').seed;
  const ratingBefore=c.playerDriver.rating;
  const roundCount=state.rounds?.length===5?5:3;
  for(let n=0;n<Math.min(roundCount,roundsWon+1);n++) {
    const round=state.rounds[n],rivalId=Object.keys(c.drivers).find(id=>c.drivers[id].characterId===round?.characterId);
    const rival=rivalId?c.drivers[rivalId]:{rating:1300+Number(round?.encounterRating||3)*70,wins:0,losses:0};
    elo(c.playerDriver,rival,n<roundsWon);if(rivalId)participants.push(rivalId);
  }
  c.playerDriver.entered++;const openCircuit=Boolean(state.openCircuit);
  const points=openCircuit?0:[2,7,13,20][roundsWon];
  c.playerDriver.seasonPoints+=points;
  if(!openCircuit){
    c.eventTick++;
    c.completedEventIds=[...c.completedEventIds,id].slice(-250);
  }
  const trophy=PRO_CIRCUIT_TROPHIES.find(t=>t.id===state.openTrophyId);
  const summary={id,label:trophy?.label||(state.eventId==='midnightCup'?'MIDNIGHT CUP':'STREET SHOOTOUT'),
    discipline:'DRIVER',placing:roundsWon===roundCount?1:roundCount-roundsWon+1,points,
    rankBefore,rankAfter:getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver').seed,
    ratingBefore,ratingAfter:c.playerDriver.rating,cashPrize:roundsWon===roundCount?Number(state.prizeCash||0):0,
    trophyId:state.openTrophyId||null,openCircuit,rounds:roundCount,carId:state.playerCarId};
  c.lastTournament=summary;
  return openCircuit?finishOpenCircuitEvent(c,summary):completeSeasonRound(c,summary,participants);
}

export function assignCrewSeriesCar(source,driverId,carId) {
  const c=normaliseProCircuitState(value(source,'proCircuit')),f=getCrewFixture(c),t=c.activeCrewEvent;
  if(!f||f.prepared||!t.squadIds.includes(driverId))return {error:'LINEUP ALREADY LOCKED'};
  const assignments={...t.assignments,[driverId]:carId};
  const unit=getCrewSeriesUnits(source,assignments).find(u=>u.id===driverId);
  if(!unit?.validAssignment||unit.carId!==carId)return {error:'CAR NOT ELIGIBLE'};
  c.activeCrewEvent={...clone(t),assignments};return {circuit:c};
}

// Player-driven fixtures supersede the R470 manager presentation. Preserve
// already revealed legacy results, but never precompute an unplayed heat.
export function preparePlayerCrewFixture(source,lineupIds,fixtureId) {
  const out=prepareCrewSeriesFixture(source,lineupIds,fixtureId,true);
  if(out.error)return out;
  out.circuit.activeCrewEvent=clone(out.circuit.activeCrewEvent);
  const t=out.circuit.activeCrewEvent,f=t.fixture;
  if(f.control==='PLAYER')return {circuit:out.circuit,fixture:f};
  const states=value(source,'carStates',{});
  f.control='PLAYER';
  f.heats=f.heats.map((h,i)=>({...h,playerState:clone(states[h.carId]||{}),
    ...(i<f.revealed?{}:{ownSeconds:0,opponentSeconds:0,won:false,pending:true})}));
  return {circuit:out.circuit,fixture:f};
}

export function getPlayerCrewHeat(raw) {
  const f=getCrewFixture(raw),p=f?.prepared;
  if(p?.control!=='PLAYER'||p.revealed>=3)return null;
  const index=p.revealed,h=p.heats[index];
  if(!h?.pending||!cars[h.carId])return null;
  return {id:f.id+':heat:'+index,fixtureId:f.id,index,round:f.round,
    ...h,opponent:f.opponent.drivers[index],opponentName:f.opponent.name};
}

export function settlePlayerCrewHeat(raw,heatId,results) {
  const c=normaliseProCircuitState(raw),h=getPlayerCrewHeat(c);
  if(!h||h.id!==heatId)return {circuit:c,status:'STALE_HEAT',cashPrize:0};
  const fourWide=getCrewFixture(c)?.format==='FOUR_WIDE';
  const own=results?.find(r=>r.id==='player'),other=results?.find(r=>r.id==='ai-1');
  const valid=r=>r&&typeof r.disqualified==='boolean'&&
    (r.finishSeconds===null||
      (typeof r.finishSeconds==='number'&&!r.disqualified&&
       Number.isFinite(r.finishSeconds)&&r.finishSeconds>0&&r.finishSeconds<120));
    if(!valid(own)||!valid(other)||
    (fourWide&&(!Array.isArray(results)||results.length!==4||
      new Set(results.map(r=>r.id)).size!==4||
      ['ai-1','ai-2','ai-3'].some(id=>!valid(results.find(r=>r.id===id))))))
    return {circuit:c,status:'ERROR',cashPrize:0};
  const finished=r=>!r.disqualified&&Number.isFinite(r.finishSeconds)&&r.finishSeconds>0;
  const won=finished(own)&&(!finished(other)||own.finishSeconds<other.finishSeconds-0.000001);
  const tied=finished(own)&&finished(other)&&Math.abs(own.finishSeconds-other.finishSeconds)<=0.000001;
  const ranking=fourWide?[...results].sort((a,b)=>(finished(b)?1:0)-(finished(a)?1:0)||((a.finishSeconds??Infinity)-(b.finishSeconds??Infinity))||a.id.localeCompare(b.id)):null;
  const place=fourWide?ranking.findIndex(r=>r.id==='player')+1:null;
  c.activeCrewEvent=clone(c.activeCrewEvent);
  const fixture=c.activeCrewEvent.fixture;
  fixture.heats[h.index]={...fixture.heats[h.index],pending:false,won:fourWide?place===1:won,tied:fourWide?false:tied,place,
    ownSeconds:own.finishSeconds||0,opponentSeconds:other.finishSeconds||0,
    ownStatus:own.disqualified?'DQ':finished(own)?'FINISHED':'DNF',
    opponentStatus:other.disqualified?'DQ':finished(other)?'FINISHED':'DNF'};
  fixture.revealed++;
  return {circuit:c,status:'CREW_HEAT',won:fourWide?place===1:won,tied:fourWide?false:tied,place,heatNumber:h.index+1,
    wins:fixture.heats.slice(0,fixture.revealed).filter(r=>r.won).length,cashPrize:0};
}
