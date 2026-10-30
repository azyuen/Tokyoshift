// R605 — Persistent Open Circuit driver + trophy event briefings.
import { settleLegacySeasonEvent, getFactoryStockStatus } from './proSeason.js?v=20261030-r740';
import { getCarMagazineMeta } from './carMagazine.js?v=20261011-r479';
import { getBaseCarId } from './carOwnership.js?v=20261011-r479';
import { getExhaustNosTuning } from './secondaryTuning.js?v=20261026-r687';
import { normaliseProCircuitState } from './proCircuit.js?v=20261030-r739';
// No races, fee settlement, physics or crew competition rules are changed here.
export function isOpenDriverBriefing(state) {
  return Boolean(state?.active && state?.proEvent && state?.openCircuit &&
    Array.isArray(state?.rounds) &&
    Number.isInteger(Number(state?.roundIndex)) &&
    state.rounds[Number(state.roundIndex)]);
}

// Open Circuit individual knockout entry is prepared before money changes
// hands. Crew, timed, stock and season formats use their own event workflows.
export function usesPrepaidDriverBriefing(event = {}) {
  return Boolean(event.openCircuit && !event.team &&
    !event.fourWide && !event.specialSlot && !event.seasonRules &&
    Array.isArray(event.opponentRatings) && event.opponentRatings.length>0);
}

// The returned changes are a single atomic pay-and-register transaction.
// Neither the preview NOS/part removals nor Sayaka's cooldown are committed
// when the user cancels this UNPAID room.
export function purchaseDriverBriefingEntry({
  circuit={},state=null,carStates={},preparedCarState={},owned=[],
  cash=0,powerKW=NaN,adviceCircuit=null,
}={}) {
  if(!isOpenDriverBriefing(state))return {error:'DRIVER ENTRY NOT AVAILABLE'};
  if(state.briefingEntryPending!==true)return {error:'EVENT ALREADY REGISTERED'};
  const current=normaliseProCircuitState(circuit);
  if(current.seasonStatus==='ACTIVE'||current.activeCrewEvent||
    current.activeTournament||current.activeTimedEvent||
    current.activeChampionship&&!current.activeChampionship.completed)
    return {error:'FINISH YOUR ACTIVE PROFESSIONAL EVENT FIRST'};
  if(!Number.isSafeInteger(state.entryFee)||state.entryFee<0)
    return {error:'INVALID ENTRY FEE'};
  if(!Number.isFinite(cash)||cash<state.entryFee)return {error:'INSUFFICIENT CASH'};
  const expectedId='open:'+state.eventId+':s'+current.season+':e'+(current.eventTick+1);
  if(state.proSeasonId!==expectedId||current.completedEventIds.includes(expectedId))
    return {error:'EVENT ENTRY EXPIRED — RETURN TO REGISTRATION'};
  const check=driverBriefingEligibility(state,preparedCarState,powerKW,owned);
  if(!check.eligible)return {error:'SCRUTINEERING FAILED // '+check.problems.join(' / ')};
  const eventCircuit=adviceCircuit?normaliseProCircuitState(adviceCircuit):current;
  if(eventCircuit.eventTick!==current.eventTick||
     (eventCircuit.crewAdviceCooldownUntil!==current.crewAdviceCooldownUntil &&
      !state.briefingAdviceUsed))
    return {error:'PROFESSIONAL EVENT CHANGED — REOPEN BRIEFING'};
  const {briefingEntryPending,...paid}=state;
  return {changes:{
    cash:cash-state.entryFee,
    carStates:{...carStates,[state.playerCarId]:preparedCarState},
    competitionState:paid,
    ...(state.briefingAdviceUsed?{proCircuit:eventCircuit}:{}),
  }};
}

export function driverBriefingRules(state, fallback = {}) {
  const saved = state?.briefingRules || {};
  return {
    maxPowerKW: Number.isFinite(saved.maxPowerKW) ? saved.maxPowerKW :
      Number.isFinite(fallback.maxPowerKW) ? fallback.maxPowerKW : null,
    noNos: typeof saved.noNos === 'boolean' ? saved.noNos : Boolean(fallback.noNos),
    stock: typeof saved.stock === 'boolean' ? saved.stock : Boolean(fallback.stock),
    drivetrain: String(saved.drivetrain || fallback.drivetrain || '').toUpperCase(),
  };
}

export function driverBriefingEligibility(state, carState = {}, powerKW = 0, owned = [], fallback = {}) {
  const rules = driverBriefingRules(state, fallback);
  const problems = [];
  if (!isOpenDriverBriefing(state)) problems.push('NO ACTIVE OPEN CIRCUIT DRIVER EVENT');
  if (!owned.includes(state?.playerCarId)) problems.push('REGISTERED CAR NOT OWNED');
  if (rules.maxPowerKW != null && (!Number.isFinite(powerKW) || powerKW > rules.maxPowerKW))
    problems.push('POWER EXCEEDS ' + rules.maxPowerKW + ' KW LIMIT');
  const nos = Boolean(carState.nosInstalled) || Number(carState.exhaustNosTuning?.nosKit || 0) > 0;
  if (rules.noNos && nos) problems.push('NOS IS PROHIBITED');
  if (rules.stock) problems.push(...getFactoryStockStatus(carState).reasons);
  if (rules.drivetrain) {
    const actual = String(getCarMagazineMeta(getBaseCarId(state?.playerCarId))?.drivetrain || '').toUpperCase();
    const aliases = {FF:'FWD',FR:'RWD',FWD:'FWD',RWD:'RWD',AWD:'AWD'};
    if (aliases[actual] !== aliases[rules.drivetrain])
      problems.push('REQUIRES ' + rules.drivetrain);
  }
  return { eligible: problems.length === 0, problems, rules };
}

// Advice is shared with the already-shipped Pro Crew cooldown counter: once
// now, then finish the current competition plus two OTHER competitions.
export function driverAdviceStatus(circuit = {}, state = {}) {
  const remaining = Math.max(0, Number(circuit.crewAdviceCooldownUntil || 0) -
    Number(circuit.eventTick || 0));
  const usedThisEvent = Boolean(state.briefingAdviceUsed);
  return { remaining, usedThisEvent,
    available: isOpenDriverBriefing(state) && !usedThisEvent && remaining === 0 };
}

export function consumeDriverAdvice(circuit = {}, state = {}) {
  const status = driverAdviceStatus(circuit, state);
  if (!isOpenDriverBriefing(state)) return { error: 'DRIVER EVENT NO LONGER AVAILABLE' };
  if (status.usedThisEvent) return { error: 'SAYAKA ADVICE ALREADY USED' };
  // One consultation per paid event, but an unused consultation remains
  // available from the optional between-heats Race Briefing screen.
  if (!status.available) return { error: 'SAYAKA AVAILABLE AFTER ' + status.remaining + ' MORE PROFESSIONAL EVENTS' };
  return {
    // A trophy consultation covers the entire competition but blocks
    // another consultation until the trophy plus FIVE other official events
    // have settled. Normal driver events retain the 3-event global cooldown.
    circuit: { ...circuit, crewAdviceCooldownUntil: Number(circuit.eventTick || 0) +
      (state.openTrophyId ? 6 : 3) },
    competitionState: { ...state, briefingAdviceUsed: true },
  };
}

export function driverOpponentAdvice(opponentCar = {}, opponent = {}, playerCar = {}) {
  const drivetrain = String(opponentCar.drivetrain || opponentCar.drive || '').toUpperCase();
  const carName = String(opponentCar.shortName || 'car');
  const intro = opponent?.name ? opponent.name.split(' ')[0] + ' is driving a ' + carName + '. ' :
    'The next car is a ' + carName + '. ';
  const note = drivetrain.includes('AWD') || drivetrain.includes('4WD') || drivetrain==='FOUR_WHEEL_DRIVE'
    ? "Expect a clean launch from an AWD car. Don't chase the start light; hold your own launch range and stay tidy through second."
    : drivetrain.includes('RWD') || drivetrain === 'FR'
    ? "With rear-wheel drive, too much throttle early can cost traction. Watch your own grip and concentrate on clean shifts."
    : drivetrain.includes('FWD') || drivetrain === 'FF'
    ? "Front-wheel drive can struggle when power overwhelms the front tyres. Keep your launch measured and avoid rushing the first shift."
    : "The first few seconds will matter. Focus on your own launch, shift points, and the best use of your available gears.";
  return 'Hrmmm. ' + intro + note;
}

// Don't delete purchased NOS upgrades. A saved, reversible removal is kept in
// the car state; it survives reload and is restored after the competition ends.
export function toggleBriefingNos(state = {}) {
  const next = { ...state, exhaustNosTuning: { ...(state.exhaustNosTuning || {}) } };
  if (state.proBriefingNosStash) {
    next.nosInstalled = Boolean(state.proBriefingNosStash.nosInstalled);
    // Only put the nitrous hardware back. Any exhaust/header downgrades made
    // afterwards must survive until THEIR own event stash is restored.
    next.exhaustNosTuning = {
      ...(state.exhaustNosTuning || {}),
      nosKit: Number(state.proBriefingNosStash.exhaustNosTuning?.nosKit || 0),
      nitrousShot: Number(state.proBriefingNosStash.exhaustNosTuning?.nitrousShot || 0),
    };
    delete next.proBriefingNosStash;
  } else {
    const fitted = Boolean(state.nosInstalled) || Number(state.exhaustNosTuning?.nosKit || 0) > 0;
    if (!fitted) return state;
    next.proBriefingNosStash = {
      nosInstalled: Boolean(state.nosInstalled),
      exhaustNosTuning: { ...(state.exhaustNosTuning || {}) },
    };
    next.nosInstalled = false;
    next.exhaustNosTuning.nosKit = 0;
    next.exhaustNosTuning.nitrousShot = 0;
  }
  if (state.dyno) next.dyno = { ...state.dyno, officialReading: null };
  return next;
}

export const BRIEFING_POWER_PARTS = Object.freeze([
  Object.freeze({id:'turbo',group:'tuning',label:'TURBO'}),
  Object.freeze({id:'engine',group:'tuning',label:'ENGINE'}),
  Object.freeze({id:'ecu',group:'tuning',label:'ECU'}),
  Object.freeze({id:'intake',group:'tuning',label:'INTAKE'}),
  Object.freeze({id:'intercooler',group:'tuning',label:'INTERCOOLER'}),
  Object.freeze({id:'headers',group:'exhaustNosTuning',label:'HEADERS'}),
  Object.freeze({id:'exhaust',group:'exhaustNosTuning',label:'EXHAUST'}),
  Object.freeze({id:'muffler',group:'exhaustNosTuning',label:'MUFFLER'}),
  Object.freeze({id:'nosKit',group:'exhaustNosTuning',label:'NOS EQUIPMENT'}),
  Object.freeze({id:'clutch',group:'drivetrainTuning',label:'CLUTCH'}),
  Object.freeze({id:'gearbox',group:'drivetrainTuning',label:'GEARBOX'}),
  Object.freeze({id:'differential',group:'drivetrainTuning',label:'DIFFERENTIAL'}),
  Object.freeze({id:'suspension',group:'drivetrainTuning',label:'SUSPENSION'}),
  Object.freeze({id:'tyres',group:'chassisTuning',label:'TYRES'}),
  Object.freeze({id:'weightReduction',group:'chassisTuning',label:'WEIGHT REDUCTION'}),
]);

// Install any owned level from 0 through the level purchased before the
// professional event. Never create extra upgrades or modify the bought kit.
export function getDriverPowerPartLevelInfo(carState = {}, partId) {
  const part = BRIEFING_POWER_PARTS.find(p => p.id === partId);
  if (!part) return null;
  const stash = carState.proBriefingPowerStash?.[part.group] || {};
  const active = part.group === 'tuning'
    ? carState.tuning || carState.engineTuning || {}
    : part.group === 'exhaustNosTuning'
      ? getExhaustNosTuning(carState) : carState[part.group] || {};
  if (partId === 'nosKit') {
    const nosStash = carState.proBriefingNosStash;
    const savedKit = nosStash?.exhaustNosTuning || {};
    const current = nosStash ? 0 : Math.max(
      Number(active.nosKit || 0), Boolean(carState.nosInstalled) ? 1 : 0
    );
    return {
      current, original: nosStash
        ? Math.max(Number(savedKit.nosKit || 0), nosStash.nosInstalled ? 1 : 0)
        : current,
      stored: Boolean(nosStash),
    };
  }
  const current = Math.max(0, Math.min(3, Math.round(Number(active[partId] || 0))));
  const stored = Object.prototype.hasOwnProperty.call(stash, partId);
  const original = stored
    ? Math.max(0, Math.min(3, Math.round(Number(stash[partId] || 0))))
    : current;
  return { current, original, stored };
}

export function setDriverPowerPartLevel(carState = {}, partId, targetLevel = 0) {
  const part = BRIEFING_POWER_PARTS.find(p => p.id === partId);
  const info = getDriverPowerPartLevelInfo(carState, partId);
  if (!part || !info || !Number.isInteger(targetLevel) ||
      targetLevel < 0 || targetLevel > info.original) return carState;
  if (targetLevel === info.current) return carState;
  if (partId === 'nosKit') {
    // NOS is regulated as a complete equipment installation rather than an
    // arbitrary power toggle. Keep the reversible full-kit stash.
    if (targetLevel !== 0 && targetLevel !== info.original) return carState;
    return toggleBriefingNos(carState);
  }

  const source = part.group === 'tuning'
    ? carState.tuning || carState.engineTuning || {}
    : carState[part.group] || {};
  const saved = { ...(carState.proBriefingPowerStash || {}) };
  const category = { ...(saved[part.group] || {}) };
  if (targetLevel < info.original) category[partId] = info.original;
  else delete category[partId];
  if (Object.keys(category).length) saved[part.group] = category;
  else delete saved[part.group];
  const next = {
    ...carState,
    [part.group]: { ...source, [partId]: targetLevel },
  };
  if (Object.keys(saved).length) next.proBriefingPowerStash = saved;
  else delete next.proBriefingPowerStash;
  if (carState.dyno) next.dyno = { ...carState.dyno, officialReading: null };
  return next;
}

export function removeDriverPowerPart(carState = {}, partId) {
  return setDriverPowerPartLevel(carState, partId, 0);
}

// Batch downgrade requests stage all levels first. Saves/payment remain an
// explicit one-time transaction handled by CentralTokyoScene.
export function setDriverPowerPartLevels(carState = {}, requestedLevels = {}) {
  let next = carState;
  for (const part of BRIEFING_POWER_PARTS) {
    if (Object.prototype.hasOwnProperty.call(requestedLevels, part.id))
      next = setDriverPowerPartLevel(next, part.id, requestedLevels[part.id]);
  }
  return next;
}

export function removeDriverPowerParts(carState = {}, partIds = []) {
  const requested = {};
  for (const id of new Set(Array.isArray(partIds) ? partIds : []))
    requested[id] = 0;
  return setDriverPowerPartLevels(carState, requested);
}

export function restoreDriverPowerParts(carState = {}) {
  const saved=carState.proBriefingPowerStash;
  if(!saved)return carState;
  const next={...carState};
  for(const group of ['tuning','drivetrainTuning','chassisTuning','exhaustNosTuning']){
    if(saved[group])next[group]={...(group==='tuning'?
      carState.tuning||carState.engineTuning||{}:carState[group]||{}),
      ...saved[group]};
  }
  delete next.proBriefingPowerStash;
  if(carState.dyno)next.dyno={...carState.dyno,officialReading:null};
  return next;
}

export function restoreDriverBriefingNos(carStates = {}, state = {}) {
  const carId = state.playerCarId;
  if (!isOpenDriverBriefing(state) || !carStates[carId]?.proBriefingNosStash) return null;
  return { ...carStates, [carId]: toggleBriefingNos(carStates[carId]) };
}

export function restoreDriverBriefingParts(carStates = {}, state = {}) {
  if(!isOpenDriverBriefing(state))return null;
  const car=carStates[state.playerCarId];
  if(!car?.proBriefingNosStash&&!car?.proBriefingPowerStash)return null;
  let next=car;
  if(next.proBriefingNosStash)next=toggleBriefingNos(next);
  if(next.proBriefingPowerStash)next=restoreDriverPowerParts(next);
  return {...carStates,[state.playerCarId]:next};
}

/** A paid Open Circuit driver forfeit is a competitive loss but counts as
 * one settled professional event for the shared Sayaka cooldown, exactly as
 * completing an event would. Restore all stored upgrades atomically.
 */
export function forfeitOpenDriverTransaction(rawCircuit = {}, state = {}, carStates = {}) {
  if(!isOpenDriverBriefing(state))return {error:'NO ACTIVE OPEN CIRCUIT DRIVER EVENT'};
  const circuit=normaliseProCircuitState(rawCircuit);
  if(circuit.completedEventIds.includes(state.proSeasonId))
    return {error:'EVENT HAS ALREADY BEEN SETTLED'};
  const next=settleLegacySeasonEvent(circuit,state,Math.max(0,Number(state.roundIndex||0)));
  next.lastTournament={...next.lastTournament,forfeited:true,cashPrize:0};
  const changes={proCircuit:next,competitionState:null};
  const restored=restoreDriverBriefingParts(carStates,state);
  if(restored)changes.carStates=restored;
  return {changes};
}

// Stable per-entrant presentation: each ordinary Open Circuit professional
// receives one of four helmeted house-driver portraits. These are cosmetic;
// known regional MAIN rivals retain their authored identity and character art.
export function getProDriverHelmetIndex(state = {}, round = {}) {
  // Stable for each named professional across all events and save reloads.
  // Historical unnamed rounds retain their previous event-based fallback.
  const seed=round.opponentDriverId
    ? String(round.opponentDriverId)
    : String(state.proSeasonId||state.eventId||'open')+'|'+
      String(state.roundIndex??0)+'|'+String(round.characterId||round.opponentName||'npc');
  let hash=2166136261;
  for(let i=0;i<seed.length;i++) {
    hash=Math.imul(hash^seed.charCodeAt(i),16777619);
  }
  // Mix higher hash bits before taking four slots: the unmixed FNV low
  // bits correlate with sequential driver IDs and underuse two portraits.
  return ((hash^(hash>>>16)^(hash>>>9))>>>0)%4+1;
}
