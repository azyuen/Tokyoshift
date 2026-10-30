// Open Circuit and Pro Season opponents are subject to the same installed
// parts / drivetrain / power / NOS rules as the player. This module is used
// both when opponents are registered and again on a resumed saved heat.
import { cars } from './cars.js?v=20261027-r694';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import {
  getProfessionalCarEligibility, getProfessionalOpponentBuild,
} from './proSeason.js?v=20261030-r741';
import { getBuiltCar } from '../vehicles/VehiclePerformance.js?v=20261026-r687';

const finite = value => value == null || value === '' ? null :
  Number.isFinite(Number(value)) ? Number(value) : null;

export function inspectProOpponent(carId, state = {}, rules = {}) {
  const raw = getProfessionalCarEligibility(carId, state, rules);
  const built = getBuiltCar(carId, state);
  if (!built) return { eligible:false, reasons:['VEHICLE BUILD UNAVAILABLE'] };
  // These are the literal physics values fed to Vehicle and DragRacingAI,
  // not just a workshop label or a checkbox in the entrant's saved state.
  const live = built.car;
  const reasons = [...raw.reasons];
  const powerKW = Number(live.powerKW);
  const limit = finite(rules?.maxPowerKW);
  if (!Number.isFinite(powerKW) || limit !== null && powerKW > limit + .001)
    reasons.push('LIVE POWER EXCEEDS CLASS LIMIT');
  const nitrousLive = Number(live.nosPower || 0) > 0 &&
    (Number(live.nosShots || 0) > 0 ||
     Number(live.nosCapacitySeconds || 0) > 0);
  if (rules?.noNos && nitrousLive)
    reasons.push('LIVE NOS SYSTEM INSTALLED');
  return {
    eligible:reasons.length === 0, reasons, powerKW,
    nitrousLive, drivetrain:raw.drivetrain,
  };
}

function candidatesForCar(carId, state, rules, seed, rating) {
  const items=[];
  // If a legacy entrant was legal except for NOS, retain every other
  // upgrade, engine characteristic and driver identity.
  if(rules?.noNos){
    const stripped={
      ...(state||{}), nosInstalled:false, nosPower:0,
      exhaustNosTuning:{...(state?.exhaustNosTuning||{}),nosKit:0,nitrousShot:0},
    };
    items.push(stripped);
  }
  // Rebuild the SAME car at legal development levels before considering a
  // different model. Do not tune the AI's engine with ad-hoc power multipliers.
  for(const level of [...new Set([rating,5,4,3,2,1])]){
    items.push(createRivalBuildState(cars[carId],level,{
      seed:seed+':'+carId+':scrutineering:'+level,
      raceType:'Standing Start',noNos:Boolean(rules?.noNos),
    }));
  }
  items.push({});
  return items;
}

export function scrutineerProOpponentRound(round, rules = {}, {
  targetPowerKW = null, seed = 'professional', excludedCarId = null,
} = {}) {
  if(!round?.carId || !cars[round.carId])return null;
  const before = round.opponentBuildState || {};
  const check = inspectProOpponent(round.carId,before,rules);
  if(check.eligible){
    // An absent state is not the same as an explicit stock build in
    // FourLaneTestScene: null there triggers unrestricted random 4/5-star
    // NOS tuning. Materialise a legal empty build so the actual AI runs
    // the same configuration that scrutineering just checked.
    return round.opponentBuildState
      ? {round,repaired:false,check}
      : {round:{...round,opponentBuildState:{}},repaired:true,check};
  }
  const rating=Math.max(1,Math.min(5,Math.round(Number(
    round.opponentBuildRating || round.encounterRating || 4))));
  const target=Number.isFinite(Number(targetPowerKW)) && Number(targetPowerKW)>0
    ? Number(targetPowerKW)
    : finite(rules.maxPowerKW) != null ? finite(rules.maxPowerKW)
    : Number(cars[round.carId].powerKW)||200;
  let legal=[];
  for(const state of candidatesForCar(round.carId,before,rules,seed,rating)){
    const result=inspectProOpponent(round.carId,state,rules);
    if(result.eligible)legal.push({carId:round.carId,state,check:result});
  }
  // Keep the closest class-legal variant of the same actual model.
  // Power proximity never permits even 0.001 kW beyond the official cap.
  legal.sort((a,b)=>Math.abs(a.check.powerKW-target)-
    Math.abs(b.check.powerKW-target));
  let chosen=legal[0];
  if(!chosen){
    const replacement=getProfessionalOpponentBuild(rules,target,rating,
      seed+':legal-opponent',excludedCarId);
    if(replacement){
      const verified=inspectProOpponent(replacement.carId,replacement.state,rules);
      if(verified.eligible)chosen={
        carId:replacement.carId,state:replacement.state,check:verified,
      };
    }
  }
  if(!chosen)return null;
  return {
    repaired:true,check:chosen.check,
    round:{...round,carId:chosen.carId,opponentBuildState:chosen.state,
      opponentBuildArchetype:chosen.state.buildArchetype||null,
      opponentBuildRating:chosen.state.buildRating||rating},
    priorViolations:check.reasons,
  };
}
