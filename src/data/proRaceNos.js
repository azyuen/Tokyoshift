// Event allowances affect this race's usable shots, never purchased hardware.
// Apply identically to player and rival configurations before Vehicle creation.
export function applyProRaceNosLimit(config, rules) {
  const result = {...config};
  if (!rules) return result;
  const allowed = rules.noNos ? 0 : Number.isFinite(rules.maxNosShots)
    ? Math.max(0, Math.floor(rules.maxNosShots)) : null;
  if (allowed === null) return result;
  result.nosShots = Math.min(Number(result.nosShots || 0), allowed);
  result.nosCapacitySeconds = result.nosShots * Number(result.nosShotDurationSeconds || 1);
  if (!result.nosShots) result.nosPower = 0;
  return result;
}
