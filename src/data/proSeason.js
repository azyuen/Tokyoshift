// Living seasons and manager-led crew series. Pure, seeded transitions; no clock.
import { normaliseProCircuitState, getProCircuitAccess, getProCircuitDriverSeeds, getProCircuitTeamSeeds, PRO_CIRCUIT_TROPHIES, getProPrizeWithBonus, getProTeamIdForDriver, getProAiTeamDefinition } from './proCircuit.js?v=20261030-r724';
import { getCrewMembers } from './crewSystem.js?v=20261007-r413';
import { cars } from './cars.js?v=20261026-r687';
import { characters } from './characters.js?v=20261017-r565';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261026-r687';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';
import { getCarMagazineMeta } from './carMagazine.js?v=20261011-r479';
import { getStage3CalibrationEligibility } from './stage3Calibration.js?v=20261026-r687';

export const PRO_SEASON_LENGTH = 8;
export const OPEN_CIRCUIT_CREW_FEE = 0;
export const OPEN_CIRCUIT_TROPHY_FEE = 0;
export const OPEN_CIRCUIT_TROPHY_PRIZE = 450000;
// Cooldown is event-based, never real-world time. Two other completed open
// events are needed after a trophy attempt before the next one is offered.
export const OPEN_CIRCUIT_TROPHY_COOLDOWN = 2;
export function isOpenCircuitAvailable(raw) {
  const c=normaliseProCircuitState(raw);
  if(c.seasonStatus==='ACTIVE'||(c.activeChampionship&&!c.activeChampionship.completed))return false;
  return !(c.calendar.round>=PRO_SEASON_LENGTH&&getProQualification(c).qualified&&!c.activeChampionship);
}
export const OPEN_CIRCUIT_CREW_FORMATS=Object.freeze(['DUEL','RELAY','TECHNICAL','FOUR_WIDE']);
export function getOpenCircuitCrewFormat(rotation=null,completedEventTick=0) {
  const index=rotation&&Number.isInteger(rotation.rotationIndex)
    ?rotation.rotationIndex:completedEventTick;
  return OPEN_CIRCUIT_CREW_FORMATS[Math.abs(index)%OPEN_CIRCUIT_CREW_FORMATS.length];
}
// Passing a WorldClock rotation opts into the R592 schedule. Legacy callers
// without rotation keep their original event-based invitation state; in-game
// menu and registration must pass the same current rotation.
export function getOpenCircuitTrophy(raw,rotation=null) {
  const c=normaliseProCircuitState(raw);
  const unlocked=t=>c.season>=t.season&&
    (!t.requiredTrophies||Object.values(c.trophyWins).filter(n=>n>0).length>=t.requiredTrophies);
  const scheduled=rotation&&Number.isInteger(rotation.dayIndex);
  const availableTrophies=PRO_CIRCUIT_TROPHIES.filter(unlocked);
  const trophy=scheduled
    ?availableTrophies[Math.abs(rotation.dayIndex)%availableTrophies.length]
      ||PRO_CIRCUIT_TROPHIES[c.minorTrophyIndex]
    :Array.from({length:PRO_CIRCUIT_TROPHIES.length},(_,i)=>
      PRO_CIRCUIT_TROPHIES[(c.minorTrophyIndex+i)%PRO_CIRCUIT_TROPHIES.length]).find(unlocked)
      ||PRO_CIRCUIT_TROPHIES[c.minorTrophyIndex];
  // One slot in four complete in-game days has no trophy competition. This
  // is deterministic for a given clock epoch, and never changes mid-day.
  const isScheduled=!scheduled||rotation.dayIndex%4!==3;
  const eventsRemaining=Math.max(0,c.minorTrophyCooldownUntil-c.openCircuitTick);
  return {...trophy,scheduled:isScheduled,
    available:isScheduled&&isOpenCircuitAvailable(c)&&unlocked(trophy)&&!eventsRemaining,
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
    // The offer can rotate while a paid trophy event is in progress. Award
    // the saved event's trophy identity, never the current day's new offer.
    const trophy=PRO_CIRCUIT_TROPHIES.find(t=>t.id===summary.trophyId);
    if(trophy){
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
  const pending=getProfessionalSeasonBonus(c);
  if(pending&&!pending.claimed)return {error:'COLLECT SEASON RANKING AWARDS FIRST'};
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

// End-game ladder. Skill tiers use the existing AI engine unchanged:
// 3 Skilled, 4 Expert, 5 Elite. The short repeating fields avoid rerolls.
const PRO_SKILL_FIELDS=Object.freeze([
  Object.freeze([4,4,5,4,3,4,4,5,4,4]), // first two rounds: rare Skilled
  Object.freeze([4,5,4,5,4,5,4,5,4,5]),
  Object.freeze([5,4,5,5,4,5,4,5,5,4]),
  Object.freeze([5,5,5,4,5,5,5,4]),
]);
export function getProSeasonSkillTier(round,slot=0,invitation=false) {
  if(invitation)return [5,5,4,5,5][Math.abs(Math.floor(slot))%5];
  const phase=Math.min(3,Math.max(0,Math.floor((Number(round)||0)/2)));
  const field=PRO_SKILL_FIELDS[phase];
  return field[Math.abs(Math.floor(slot)+Math.max(0,Math.floor(Number(round)||0))*3)%field.length];
}
export const PRO_INVITATIONAL_DRIVER_FEE=0;
export const PRO_INVITATIONAL_DRIVER_PRIZE=1250000;
const PRO_INVITATIONAL_DRIVER_ROUNDS=Object.freeze([0,2,3,5,7]);
export function getProInvitationalDiscipline(raw) {
  const c=normaliseProCircuitState(raw),q=getProQualification(c);
  // Predictable 5-driver/3-crew starting schedule; if one qualification
  // requirement is materially further away, offer the lagging discipline.
  if(q.driverEventsNeeded>q.crewEventsNeeded+1)return 'DRIVER';
  if(q.crewEventsNeeded>q.driverEventsNeeded+1)return 'TEAM';
  return PRO_INVITATIONAL_DRIVER_ROUNDS.includes(c.calendar.round)?'DRIVER':'TEAM';
}
export function getProDriverInvitationRules(round) {
  const regular=getProfessionalRoundEvents(round).driver;
  return {id:'proDriverInvitational',format:'KNOCKOUT',
    maxPowerKW:regular.maxPowerKW?Math.max(regular.maxPowerKW,380):undefined,
    noNos:false};
}

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
  // A purchased calibration preset is not fitted tuning once its required
  // Level III hardware has been removed. The race physics disables it too.
  const calibrationActive=getStage3CalibrationEligibility(state);
  if(state.stage3Calibration&&['ecuBias','boostBias','gearBias'].some(k=>
    calibrationActive[k]&&Number(state.stage3Calibration[k]||0)!==0))
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
  const opponentRating=getProSeasonSkillTier(c.calendar.round,0,false);
  const challenger=getProfessionalOpponentBuild(rules,eligibility.powerKW,
    opponentRating,id+':timed',carId);
  if(!challenger)return {error:'NO LEGAL PROFESSIONAL OPPONENT FOR THIS CLASS'};
  c.activeTimedEvent={id,format:rules.format,carId,round:c.calendar.round,
    entryFee,carState:JSON.parse(JSON.stringify(carState)),
    opponentRating,opponentCarId:challenger.carId,opponentCarState:challenger.state,
    attempts:[],rivalAttempts:[]};
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
  const rankBefore=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver')?.seed||32;
  const sponsor=getProPrizeWithBonus(result.won?475000:result.tied?250000:100000,rankBefore);
  Object.assign(summary,{cashPrize:sponsor.totalPrize,sponsorBonus:sponsor.bonusCash,
    sponsorPercent:sponsor.bonusPercent,rankBefore});
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
  return {circuit:next,summary,cashPrize:summary.cashPrize};
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
// Separate once-per-season awards make Driver and Crew rankings valuable
// beyond championship qualification. No game balance, physics or AI changes.
export const PRO_SEASON_RANKING_PRIZES=Object.freeze({
  first:1500000,top3:1000000,top5:600000,top10:300000,
});
export function getProfessionalSeasonBonus(raw) {
  const c=normaliseProCircuitState(raw),r=c.calendar.result;
  if(c.seasonStatus!=='COMPLETE'||c.calendar.round!==PRO_SEASON_LENGTH||
     !r||r.season!==c.season)return null;
  const rank=(rows,id)=>Array.isArray(rows)?rows.findIndex(x=>x?.id===id)+1:0;
  const payout=n=>n===1?PRO_SEASON_RANKING_PRIZES.first:
    n>1&&n<=3?PRO_SEASON_RANKING_PRIZES.top3:
    n>3&&n<=5?PRO_SEASON_RANKING_PRIZES.top5:
    n>5&&n<=10?PRO_SEASON_RANKING_PRIZES.top10:0;
  const driverRank=rank(r.drivers,'player:driver'),crewRank=rank(r.teams,'player:team');
  const driverPrize=payout(driverRank),crewPrize=payout(crewRank);
  return {season:c.season,driverRank,crewRank,driverPrize,crewPrize,
    total:driverPrize+crewPrize,claimed:c.seasonBonusClaimed.includes(c.season)};
}
export function claimProfessionalSeasonBonus(raw) {
  const c=normaliseProCircuitState(raw),award=getProfessionalSeasonBonus(c);
  if(!award)return {error:'SEASON STANDINGS NOT FINAL'};
  if(award.claimed)return {circuit:c,cashPrize:0,alreadyClaimed:true,award};
  c.seasonBonusClaimed=[...c.seasonBonusClaimed,c.season].slice(-250);
  return {circuit:c,cashPrize:award.total,alreadyClaimed:false,award};
}

// A read-only season report shared by the header and final standings.
// Keep championship qualification separate from a season that has actually
// finished all eight rounds: reaching the targets early does not end a season.
export function getProfessionalSeasonReport(raw) {
  const c=normaliseProCircuitState(raw),q=getProQualification(c);
  const completed=c.calendar.round===PRO_SEASON_LENGTH&&c.seasonStatus==='COMPLETE';
  const driverRows=getSeasonStandings(c);
  const crewRows=getSeasonStandings(c,'TEAM');
  const playerDriver=driverRows.findIndex(r=>r.id==='player:driver');
  const playerTeam=crewRows.findIndex(r=>r.id==='player:team');
  return {
    season:c.season,completed,
    outcome:completed?(q.qualified?'QUALIFIED':'NOT_QUALIFIED'):
      !q.qualificationPossible?'UNREACHABLE':'IN_PROGRESS',
    ...q,
    roundsCompleted:c.calendar.round,
    driverStanding:playerDriver<0?null:playerDriver+1,
    crewStanding:playerTeam<0?null:playerTeam+1,
    driverShortfall:Math.max(0,q.driverRequired-q.driver),
    crewShortfall:Math.max(0,q.crewRequired-q.crew),
    canEnterTokyo:completed&&q.qualified,
    eventCount:c.calendar.history.length,
    seasonBonus:getProfessionalSeasonBonus(c),
  };
}
export const CREW_SERIES = Object.freeze({id:'crewOpen',label:'CREW CLUB SERIES',team:true,entryFee:0,prizeCash:1050000,prizes:[1050000,450000,200000,50000],fixtures:3,squadSize:5,fieldSize:3});

// Professional cars must pass the SAME class rules as the player's car.
// Select at registration and save the resulting legal build; never give a
// rival an invisible power, drivetrain or NOS exemption.
const PRO_RIVAL_CARS=Object.freeze([
  'ae86','ek9','fc3s','galant','gc8','r32','s2000','rx7fd',
  'jza80','evo6','r34','jzx100','dc2','crx','240z','gdb','z33',
]);
export function getProfessionalOpponentBuild(rules,playerPowerKW,rating,seed='',excludedId=null) {
  const skill=Math.max(3,Math.min(5,Math.floor(Number(rating)||4)));
  const candidates=[];
  for(const carId of PRO_RIVAL_CARS){
    if(carId===excludedId||!cars[carId])continue;
    // Stock events use genuine stock vehicles; non-stock opponents can bring
    // developed builds as long as the actual configured car passes scrutineering.
    const snapshots=rules?.stock?[{}]:
      [skill,4,3].map((buildRating,i)=>createRivalBuildState(cars[carId],buildRating,{
        seed:String(seed)+':'+carId+':'+i,raceType:'Standing Start',
        noNos:Boolean(rules?.noNos)}));
    if(!rules?.stock)snapshots.push({});
    for(const state of snapshots){
      const check=getProfessionalCarEligibility(carId,state,rules);
      if(!check.eligible)continue;
      const target=Math.max(1,Number(playerPowerKW)||check.powerKW);
      const ratio=check.powerKW/target;
      // Avoid a wildly overpowering rival, even if the class is open.
      if(ratio>1.15)continue;
      const difference=Math.abs(Math.log(Math.max(.1,ratio)));
      const developed=rules?.stock?0:Object.values(state.tuning||{}).reduce((a,b)=>a+Number(b||0),0);
      candidates.push({carId,state,powerKW:check.powerKW,
        score:difference+(!rules?.stock&&developed===0?0.15:0)});
    }
  }
  candidates.sort((a,b)=>a.score-b.score||a.carId.localeCompare(b.carId));
  const chosen=candidates[0];
  // A low-power class may have only one viable model. Two independent drivers
  // can legitimately race the same model; never strand a paid professional
  // event by insisting on a different make/model.
  if(!chosen&&excludedId)return getProfessionalOpponentBuild(rules,playerPowerKW,rating,seed,null);
  return chosen?{carId:chosen.carId,state:chosen.state,powerKW:chosen.powerKW,skillTier:skill}:null;
}
// A genuine third official event choice, using existing player-driven crew modes.
// Deliberately separate from Open Circuit trophies and the normal crew slot.
export const PRO_ALT_CREW_ENTRY_FEE = 0;
export const PRO_ALT_CREW_PRIZES = Object.freeze([1250000,575000,250000,50000]);
export function getAlternativeProCrewFormat(round) {
  const standard=getProfessionalRoundEvents(round).crew.format;
  return {DUEL:'FOUR_WIDE',RELAY:'TECHNICAL',TECHNICAL:'DUEL',FOUR_WIDE:'RELAY'}[standard]||'DUEL';
}
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
  // A professional team owns several individually ranked drivers. A team
  // can enter one crew fixture OR have its rated drivers contest the solo
  // event in a given background round. Never award a second result to an
  // organisation already involved in the player's official competition.
  const teams=getProCircuitTeamSeeds(c).filter(t=>t.id!==PLAYER);
  const drivers=getProCircuitDriverSeeds(c).filter(d=>d.id!=='player:driver');
  const entries={DRIVER:[],TEAM:[]};
  for(const team of teams) {
    const members=drivers.filter(d=>getProTeamIdForDriver(d.id)===team.id);
    if(occupied.has(team.id)||members.some(d=>occupied.has(d.id)))continue;
    const driverPoints=members.reduce((max,d)=>Math.max(max,d.seasonPoints),0);
    const driverGap=60-driverPoints;
    const crewGap=40-team.seasonPoints;
    const runCrew=crewGap>driverGap*.7||
      (Math.abs(crewGap-driverGap*.7)<4&&rng()<.5);
    if(runCrew)entries.TEAM.push({id:team.id,rating:team.rating});
    else for(const member of members)entries.DRIVER.push({id:member.id,rating:member.rating});
  }
  // Independently ranked legacy additions without a professional team may
  // still contest driver rounds; they never create anonymous extra teams.
  for(const member of drivers) {
    if(getProTeamIdForDriver(member.id)||occupied.has(member.id))continue;
    entries.DRIVER.push({id:member.id,rating:member.rating});
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
  // Never let a fully simulated old Championship disappear before its
  // once-only title/purse ledger has been committed. Lightweight historical
  // completed stubs without a scored stage still migrate normally.
  if(c.activeChampionship?.completed&&
     c.activeChampionship.stage==='COMPLETE'&&
     !c.championshipSettledIds.includes(c.activeChampionship.id))
    return {error:'CLAIM TOKYO CHAMPIONSHIP AWARDS BEFORE STARTING NEXT SEASON'};
  if(c.calendar.round<PRO_SEASON_LENGTH||c.activeTournament||c.activeCrewEvent||c.activeTimedEvent||(getProQualification(c).qualified&&!c.activeChampionship)||(c.activeChampionship&&!c.activeChampionship.completed))return {error:'FINISH THE CURRENT SEASON OR CHAMPIONSHIP'};
  const award=getProfessionalSeasonBonus(c);
  if(award&&!award.claimed)return {error:'COLLECT SEASON RANKING AWARDS BEFORE STARTING THE NEXT SEASON'};
  const result=c.calendar.result||{season:c.season,drivers:getSeasonStandings(c),teams:getSeasonStandings(c,'TEAM')};
  c.calendar={round:0,history:[],result:null,archives:[...c.calendar.archives,result].slice(-20)};
  if(c.activeChampionship?.completed){
    // Championship awards are settled before the season rolls over.
    // Do not append a second, incomplete history row for the same result.
    const complete=c.activeChampionship;
    if(!c.championshipHistory.some(r=>r.id===complete.id||
      (r.season===complete.season&&r.championId===complete.championId))){
      // Backwards-compatible record for older completed, unawarded saves.
      c.championshipHistory=[...c.championshipHistory,
        {id:complete.id,season:complete.season,completed:true,
          championId:complete.championId}].slice(-20);
    }
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
export function crewSeriesEligibility(source,squadIds=[],assignments={},seasonChoice='standard') {
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  if(!['standard','alternative'].includes(seasonChoice))return 'UNKNOWN SEASON EVENT';
  if(seasonChoice==='alternative'&&(isOpenCircuitAvailable(c)||c.seasonStatus!=='ACTIVE'))
    return 'ALTERNATIVE CREW EVENT ONLY AVAILABLE IN PRO SEASON';
  if(seasonChoice==='alternative'&&getProInvitationalDiscipline(c)!=='TEAM')
    return 'CREW INVITATIONAL NOT OFFERED THIS ROUND';
  if(!getProCircuitAccess(source).unlocked)return 'RECRUIT ALL SEVEN CREW MEMBERS';
  if(c.activeTournament||c.activeCrewEvent||c.activeTimedEvent||c.activeChampionship&&!c.activeChampionship.completed||value(source,'competitionState')?.active)return 'RESUME THE ACTIVE COMPETITION';
  if(!isOpenCircuitAvailable(c)&&c.seasonStatus!=='ACTIVE')return 'FINISH THE CHAMPIONSHIP';
  if(c.calendar.round>=PRO_SEASON_LENGTH&&!isOpenCircuitAvailable(c))return 'BEGIN THE NEXT SEASON';
  if(!['DUEL','RELAY','TECHNICAL','FOUR_WIDE'].includes(getProfessionalRoundEvents(c.calendar.round).crew.format))
    return 'CREW FORMAT NOT AVAILABLE';
  if(Number(value(source,'cash',0))<(isOpenCircuitAvailable(c)?OPEN_CIRCUIT_CREW_FEE:seasonChoice==='alternative'?PRO_ALT_CREW_ENTRY_FEE:CREW_SERIES.entryFee))return 'INSUFFICIENT CASH';
  const units=getCrewSeriesUnits(source,assignments), chosen=squadIds.map(id=>units.find(u=>u.id===id));
  if((squadIds.length<3||squadIds.length>5)&&squadIds.length!==7||new Set(squadIds).size!==squadIds.length||chosen.some(u=>!u||!u.validAssignment))return 'SELECT THREE TO FIVE ELIGIBLE DRIVERS';
  if(new Set(chosen.map(u=>u.carId)).size!==chosen.length)return 'REGISTER A DISTINCT CAR FOR EACH DRIVER';
  return null;
}
function opponentBuild(id,rating,slot,skillTier=null) {
  const rng=seasonRandom(id+':'+slot),pool=['ae86','ek9','fc3s','galant','r32','s2000','rx7fd','jza80'];
  const carId=pool[Math.floor(rng()*pool.length)],level=clamp(Math.round(2+(rating-1400)/220),1,5);
  const state=createRivalBuildState(cars[carId],level,{seed:id+':'+slot,raceType:'Standing Start'});
  const tier=skillTier||Math.max(3,Math.min(5,Math.round(3+(rating-1400)/250)));
  return {carId,state,performance:getVehiclePerformance(carId,state).index.standing,
    skill:tier===5?.93:tier===4?.85:.79,skillTier:tier};
}
export function registerCrewSeries(source,squadIds,assignments={},trophyId=null,rotation=null,seasonChoice='standard') {
  const error=crewSeriesEligibility(source,squadIds,assignments,seasonChoice);if(error)return {error};
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  const openCircuit=isOpenCircuitAvailable(c);
  if(seasonChoice==='alternative'&&(openCircuit||trophyId))
    return {error:'INVALID ALTERNATIVE CREW ENTRY'};
  const trophy=trophyId&&openCircuit?getOpenCircuitTrophy(c,rotation):null;
  if(trophyId&&(!trophy?.available||trophy.id!==trophyId||
    !['TEAM','MIXED'].includes(trophy.discipline)))return {error:'TROPHY ROTATION OR COOLDOWN CHANGED'};
  if(trophy?.id==='triDrive'){
    if(squadIds.length!==3&&squadIds.length!==7)return {error:'TRI-DRIVE REQUIRES THREE HEAT DRIVERS'};
    const units=getCrewSeriesUnits(source,assignments);
    const drives=squadIds.map(id=>String(units.find(u=>u.id===id)?.drivetrain||'').toUpperCase())
      .map(d=>({FF:'FWD',FR:'RWD'}[d]||d));
    if(squadIds.length===3&&(new Set(drives).size!==3||!['FWD','RWD','AWD'].every(d=>drives.includes(d))))
      return {error:'TRI-DRIVE NEEDS ONE FWD, ONE RWD AND ONE AWD CAR'};
  }
  const alternative=seasonChoice==='alternative';
  const fee=openCircuit?(trophy?.entryFee??OPEN_CIRCUIT_CREW_FEE):
    alternative?PRO_ALT_CREW_ENTRY_FEE:CREW_SERIES.entryFee;
  if(Number(value(source,'cash',0))<fee)return {error:'INSUFFICIENT CASH'};
  const id=(trophyId?'trophy:'+trophyId:alternative?'crewAlt':'crewOpen')+':s'+c.season+':e'+(c.eventTick+1);
  const format=trophy?.formats?.[0]||(openCircuit?getOpenCircuitCrewFormat(rotation,c.openCircuitTick):
    alternative?getAlternativeProCrewFormat(c.calendar.round):getProfessionalRoundEvents(c.calendar.round).crew.format);
  const teamsPool=getProCircuitTeamSeeds(c).filter(r=>r.id!==PLAYER);
  // Prestige entries face the seeded elite, not rating-matched open-circuit opponents.
  const selected=(trophy||alternative?
    teamsPool.sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id)):
    teamsPool.sort((a,b)=>Math.abs(a.rating-c.playerTeam.rating)-
      Math.abs(b.rating-c.playerTeam.rating)||a.id.localeCompare(b.id))).slice(0,3);
  const teams=[{id:PLAYER,name:c.playerTeamName,rating:c.playerTeam.rating},...selected].sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id));
  const entrants=teams.map((r,i)=>{
    const definition=getProAiTeamDefinition(r.id);
    const teamRoster=definition ? [...definition.rankedDriverIds, definition.reserveName] : [];
    return {...r,seed:i+1,leadDriverId:definition?.leadDriverId||null,
      drivers:[0,1,2].map(n=>({
        ...opponentBuild(r.id,r.rating,n,!openCircuit&&r.id!==PLAYER?
          getProSeasonSkillTier(c.calendar.round,i*3+n,alternative):null),
        driverId:definition?.rankedDriverIds[n]||null,
        name:r.id===PLAYER?c.playerTeamName:(c.drivers[teamRoster[n]]?.name ||
          (c.drivers[teamRoster[n]]?.characterId?characters[c.drivers[teamRoster[n]].characterId]?.name:null) ||
          teamRoster[n] || 'PRO DRIVER '+(n+1)),
      }))};
  });
  const ids=entrants.map(t=>t.id),schedule=[[[ids[0],ids[3]],[ids[1],ids[2]]],[[ids[0],ids[2]],[ids[3],ids[1]]],[[ids[0],ids[1]],[ids[2],ids[3]]]];
  const units=getCrewSeriesUnits(source,assignments);
  const registeredCars=Object.fromEntries(squadIds.map(id=>[id,units.find(u=>u.id===id).carId]));
  c.activeCrewEvent={schema:1,short:!trophy,format,formats:trophy?.formats||null,id,eventId:CREW_SERIES.id,
    seasonChoice:alternative?'alternative':'standard',
    label:trophy?.label||(alternative?'CREW '+format.replace('_',' ')+' INVITATIONAL':CREW_SERIES.label),
    openCircuit,trophyId:trophy?.id||null,
    round:0,entrants,schedule,squadIds:[...squadIds],assignments:registeredCars,
    history:[],fixture:null,entryFee:fee,prizes:trophy?
      [c.trophyWins[trophy.id]?trophy.repeatCash:trophy.prizeCash,450000,200000,50000]:
      openCircuit?[350000,150000,75000,35000]:alternative?[...PRO_ALT_CREW_PRIZES]:[...CREW_SERIES.prizes],
    difficulty:value(source,'playerDifficulty','STANDARD')};
  return {circuit:c,cash:Number(value(source,'cash'))-fee};
}
// Advice can be used once per competition. After using it, finish this event
// AND two other professional events before requesting another consultation.
// eventTick advances only on official settled professional events; it persists
// across reloads and is independent of the real-world clock.
export function getProCrewAdviceAvailability(source) {
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  const t=c.activeCrewEvent;
  const remaining=Math.max(0,c.crewAdviceCooldownUntil-c.eventTick);
  return {available:Boolean(t&&!t.adviceUsed&&remaining===0),
    remaining,usedThisEvent:Boolean(t?.adviceUsed)};
}
export function useProCrewAdvice(source,eventId) {
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  const t=c.activeCrewEvent;
  if(!t||t.id!==eventId)return {error:'EVENT NO LONGER AVAILABLE'};
  if(t.adviceUsed)return {error:'SAYAKA ADVICE ALREADY USED'};
  if(t.round>0||t.fixture?.revealed>0)return {error:'SAYAKA ADVICE ONLY AVAILABLE BEFORE FIRST HEAT'};
  if(c.eventTick<c.crewAdviceCooldownUntil)
    return {error:'SAYAKA AVAILABLE AFTER '+(c.crewAdviceCooldownUntil-c.eventTick)+' MORE PROFESSIONAL EVENTS'};
  c.activeCrewEvent={...clone(t),adviceUsed:true};
  c.crewAdviceCooldownUntil=c.eventTick+3;
  return {circuit:c};
}

export function getCrewFixture(raw) {
  const t=raw?.activeCrewEvent;
  if(!t||t.schema!==1||!Number.isInteger(t.round)||t.round<0||t.round>2||!Array.isArray(t.schedule?.[t.round])||!Array.isArray(t.entrants)||!Array.isArray(t.squadIds))return null;
  if (typeof t.id !== 'string' || t.entrants.length !== 4 ||
      t.entrants.some(e => !e || typeof e.id !== 'string' || !Array.isArray(e.drivers) || e.drivers.length !== 3 || e.drivers.some(d => !d || !cars[d.carId] || !Number.isFinite(d.performance) || !Number.isFinite(d.skill))) ||
      new Set(t.entrants.map(e => e.id)).size !== 4 || !t.entrants.some(e => e.id === PLAYER) ||
      !Array.isArray(t.history) || t.history.length !== t.round ||
      !Array.isArray(t.prizes) || t.prizes.length !== 4 || t.prizes.some(n => !Number.isFinite(n) || n < 0 || n > 3000000) ||
      (t.squadIds.length < 3 || t.squadIds.length > 5)&&t.squadIds.length!==7 || new Set(t.squadIds).size !== t.squadIds.length ||
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
  if(t.trophyId==='triDrive'&&new Set(chosen.map(u=>({FF:'FWD',FR:'RWD'}[String(u.drivetrain||'').toUpperCase()]||String(u.drivetrain||'').toUpperCase()))).size!==3)return {error:'FIELD ONE FWD, ONE RWD AND ONE AWD DRIVER'};
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
// Technical crew competition is not an ET sprint. Both crews must complete
// three different-car runs; only the spread (slowest ET minus fastest ET)
// decides the fixture. A DNF/DQ is not a clean three-run series.
export function getCrewTechnicalScore(heats=[]) {
  const valid=(side,status)=>heats.length===3&&heats.every(h=>
    h?.[status]==='FINISHED'&&Number.isFinite(h?.[side])&&h[side]>0);
  const ownValid=valid('ownSeconds','ownStatus');
  const opponentValid=valid('opponentSeconds','opponentStatus');
  const spread=key=>Number((Math.max(...heats.map(h=>h[key]))-
    Math.min(...heats.map(h=>h[key]))).toFixed(6));
  const ownSpread=ownValid?spread('ownSeconds'):null;
  const opponentSpread=opponentValid?spread('opponentSeconds'):null;
  return {complete:heats.length===3&&heats.every(h=>h&&!h.pending),
    ownSpread,opponentSpread,won:ownValid&&
    (!opponentValid||ownSpread<opponentSpread-0.000001),
    tied:ownValid&&opponentValid&&Math.abs(ownSpread-opponentSpread)<=0.000001};
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
  const technicalScore=getCrewTechnicalScore(f.prepared.heats);
  const {ownSpread,opponentSpread}=technicalScore;
  const technicalWon=technicalScore.won;
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
    const baseCashPrize=t.openCircuit?(t.trophyId?
      [35000,t.prizes[2],t.prizes[1],t.prizes[0]][wins]:
      [35000,75000,150000,350000][wins]):
      (t.seasonChoice==='alternative'
        ?[50000,PRO_ALT_CREW_PRIZES[2],PRO_ALT_CREW_PRIZES[1],PRO_ALT_CREW_PRIZES[0]][wins]
        :[50000,200000,450000,1050000][wins]);
    const sponsor=getProPrizeWithBonus(baseCashPrize,rankBefore,'TEAM');
    const cashPrize=sponsor?.totalPrize??baseCashPrize;
    if(wins===3&&!t.openCircuit)c.crewSeriesWins++;
    c.activeCrewEvent=null;
    if(!t.openCircuit){
      c.eventTick++;
      c.completedEventIds=[...c.completedEventIds,t.id].slice(-250);
    }
    const summary={id:t.id,label:t.seasonChoice==='alternative'?t.label:fourWide?'CREW FOUR-WIDE':technical?'CREW TECHNICAL':relay?'CREW RELAY':'CREW CLUB SPRINT',discipline:'TEAM',format:t.format||'DUEL',placing:4-wins,
      cashPrize,rankBefore,rankAfter:getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,
      ratingBefore,ratingAfter:c.playerTeam.rating,points,wins,heatWins,fourWidePoints,ownTotal,opponentTotal,ownSpread,opponentSpread,
      sponsorBonus:sponsor?.bonusCash||0,sponsorPercent:sponsor?.bonusPercent||0,
      trophyId:t.trophyId||null,openCircuit:Boolean(t.openCircuit)};
    c.lastTournament=summary;c.lastCrewEvent=t;
    return {circuit:t.openCircuit?finishOpenCircuitEvent(c,summary):completeSeasonRound(c,summary,t.entrants.map(e=>e.id)),status:'COMPLETE',cashPrize,wins,summary};
  }
  if(t.round<3){c.activeCrewEvent=t;return {circuit:c,status:'ADVANCED',cashPrize:0,wins};}
  const rankBefore=getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,ratingBefore=c.playerTeam.rating,table={[PLAYER]:c.playerTeam,...c.teams};
  for(const round of t.history)for(const match of round.fixtures)elo(table[match.ids[0]],table[match.ids[1]],match.score[0]>=2);
  const result=getCrewSeriesTable(t),place=result.findIndex(r=>r.id===PLAYER)+1;
  result.forEach((r,i)=>{table[r.id].entered++;if(!t.openCircuit)table[r.id].seasonPoints+=[20,15,10,5][i];});
  const baseCashPrize=Math.max(35000,t.prizes[place-1]);
  const sponsor=getProPrizeWithBonus(baseCashPrize,rankBefore,'TEAM');
  const cashPrize=sponsor?.totalPrize??baseCashPrize;
  if(place===1&&!t.openCircuit)c.crewSeriesWins++;
  c.activeCrewEvent=null;
  if(!t.openCircuit){c.eventTick++;c.completedEventIds=[...c.completedEventIds,t.id].slice(-250);}
  const summary={id:t.id,label:t.label,discipline:'TEAM',placing:place,cashPrize,
    rankBefore,rankAfter:getProCircuitTeamSeeds(c).find(r=>r.id===PLAYER).seed,
    ratingBefore,ratingAfter:c.playerTeam.rating,points:t.openCircuit?0:[20,15,10,5][place-1],
    sponsorBonus:sponsor?.bonusCash||0,sponsorPercent:sponsor?.bonusPercent||0,
    table:result,format:'TOURNAMENT',trophyId:t.trophyId||null,
    openCircuit:Boolean(t.openCircuit),rounds:3,driverIds:t.squadIds};
  c.lastTournament=summary;c.lastCrewEvent=t;
  return {circuit:t.openCircuit?finishOpenCircuitEvent(c,summary):
    completeSeasonRound(c,summary,t.entrants.map(e=>e.id)),
    status:'COMPLETE',cashPrize,wins,summary};
}
// R594: Leaving an entered crew competition is a forfeit, never a free
// 'save and return'. Entry fees are not refunded, trophy awards are zero and
// the season calendar records the loss. Saved heat results cannot be replayed.
export function forfeitCrewSeries(source,eventId) {
  const c=normaliseProCircuitState(value(source,'proCircuit'));
  const t=c.activeCrewEvent;
  if(!t||typeof t.id!=='string'||t.id!==eventId)return {error:'NO ACTIVE CREW EVENT'};
  if(c.completedEventIds.includes(t.id))return {error:'EVENT ALREADY SETTLED'};
  const before=getProCircuitTeamSeeds(c).find(row=>row.id===PLAYER)?.seed||32;
  const summary={id:t.id,label:t.label||'CREW EVENT',discipline:'TEAM',
    placing:4,points:0,cashPrize:0,openCircuit:Boolean(t.openCircuit),
    trophyId:t.trophyId||null,forfeited:true,wins:0,rankBefore:before,
    rankAfter:before,format:t.format||'DUEL'};
  c.activeCrewEvent=null;
  c.lastCrewEvent={...clone(t),forfeited:true};
  c.playerTeam.entered++;
  c.playerTeam.losses++;
  // A forfeited paid crew competition still advances the shared pro event
  // counter once. This counts toward Sayaka's current-event + two-more rule.
  let next;
  if(t.openCircuit)next=finishOpenCircuitEvent(c,summary);
  else {
    c.eventTick++;
    c.completedEventIds=[...c.completedEventIds,t.id].slice(-250);
    next=completeSeasonRound(c,summary,t.entrants?.map(e=>e.id)||[]);
  }
  next.lastTournament={...summary};
  return {circuit:next,summary,cashPrize:0,status:'FORFEITED'};
}

// Legacy three-round pro cups retain their original fee, purse and race engine.
export function settleLegacySeasonEvent(raw,state,roundsWon,actualBasePrize=null) {
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
  // Accept the actual paid baseline from the race scene (including Easy-mode
  // multipliers); never calculate sponsor money from the event's entry fee.
  const baseCashPrize=roundsWon===roundCount?
    Math.max(0,Number(actualBasePrize==null?state.prizeCash||0:actualBasePrize)||0):
    Math.max(30000,Math.floor(Math.max(0,Number(state.prizeCash||0))*.12));
  const sponsor=getProPrizeWithBonus(baseCashPrize,rankBefore);
  const summary={id,label:state.briefingLabel||trophy?.label||(state.eventId==='midnightCup'?'MIDNIGHT CUP':'STREET SHOOTOUT'),
    discipline:'DRIVER',placing:roundsWon===roundCount?1:roundCount-roundsWon+1,points,
    rankBefore,rankAfter:getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver').seed,
    ratingBefore,ratingAfter:c.playerDriver.rating,cashPrize:sponsor?.totalPrize??baseCashPrize,
    sponsorBonus:sponsor?.bonusCash||0,sponsorPercent:sponsor?.bonusPercent||0,
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
      (typeof r.finishSeconds==='number'&&
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
