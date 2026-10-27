// R694 — Ginza full-works pricing. An existing paid upgrade is never charged
// a second time: only the missing levels 1..3 plus a bespoke fixed premium.
import { ENGINE_PART_ORDER, getEngineTuning, getUpgradePathCost } from './tuning.js?v=20261026-r687';
import {
  DRIVETRAIN_PART_ORDER, CHASSIS_PART_ORDER, EXHAUST_NOS_PART_ORDER,
  getDrivetrainTuning, getChassisTuning, getExhaustNosTuning,
  getDrivetrainUpgradePathCost, getChassisUpgradePathCost,
  getExhaustNosUpgradePathCost,
} from './secondaryTuning.js?v=20261026-r687';
import { LBWK_CONVERSIONS } from './lbwkConversions.js';

export const LBWK_240Z = Object.freeze({
  id:'libertyWalk240z', donor:'240z', name:'LBWK 240Z', premium:3500000,
});
export const LBWK_CATALOG = Object.freeze([LBWK_240Z, ...LBWK_CONVERSIONS]);
export const LBWK_HERO_BOOST = 1.38; // measured full Lv3 baseline; NO regional stack
export const LBWK_NOS_SHOTS = 3;
export const LBWK_NOS_HP = 75;

const GROUPS = Object.freeze([
  [ENGINE_PART_ORDER, getEngineTuning, getUpgradePathCost],
  [DRIVETRAIN_PART_ORDER, getDrivetrainTuning, getDrivetrainUpgradePathCost],
  [CHASSIS_PART_ORDER, getChassisTuning, getChassisUpgradePathCost],
  [EXHAUST_NOS_PART_ORDER, getExhaustNosTuning, getExhaustNosUpgradePathCost],
]);

export function getLbwkConversionQuote(build, ownedState = {}) {
  if (!build || !LBWK_CATALOG.some(item => item.id === build.id)) return null;
  const groups = GROUPS.map(([ids, read, cost]) => {
    const levels = read(ownedState);
    return ids.reduce((t, part) => {
      t.full += cost(part,0,3);
      t.remaining += cost(part,levels[part],3);
      return t;
    },{full:0,remaining:0});
  });
  const fullPartsCost = groups.reduce((n,g)=>n+g.full,0);
  const remainingPartsCost = groups.reduce((n,g)=>n+g.remaining,0);
  const installedCredit = fullPartsCost - remainingPartsCost;
  const specialistPremium = Math.max(0, Math.round(Number(build.premium || 0)));
  return Object.freeze({
    fullPartsCost, installedCredit, remainingPartsCost, specialistPremium,
    fullPrice: fullPartsCost+specialistPremium,
    total: remainingPartsCost+specialistPremium,
  });
}

// Used for physically installed Lv3 hardware in sealed LBWK conversions.
// The showroom quote and engine build share the *same* 16 part categories.
const allLevel3 = order => Object.fromEntries(order.map(id=>[id,3]));
export const LBWK_FULL_WORKS_STATE = Object.freeze({
  tuning: allLevel3(ENGINE_PART_ORDER),
  drivetrainTuning: allLevel3(DRIVETRAIN_PART_ORDER),
  chassisTuning: allLevel3(CHASSIS_PART_ORDER),
  exhaustNosTuning: allLevel3(EXHAUST_NOS_PART_ORDER),
  nosInstalled: true,
});
