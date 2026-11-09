// Preserve each recruited driver's loan-car identity when a specialist turns
// that car into a collector hero. The crew__ ID, roster link and garage slot
// remain constant; only its vehicle specification and artwork change.
//
// cars is a shared in-memory catalogue. Rehydrate *all* loan aliases whenever
// a profile is loaded so one saved profile cannot leak its hero builds into
// another profile's stock crew.
import { cars } from './cars.js';
import { CREW_CHARACTER_CARS, getCrewLoanCarId } from './crewRoster.js';
import { TUNER_SHOPS } from './tunerShops.js';
import { LBWK_CATALOG } from './lbwkFullWorks.js';

export function isCompatibleCrewHeroBuild(baseCarId, heroCarId) {
  const base = String(baseCarId || '');
  const hero = String(heroCarId || '');
  return Boolean(base && hero && cars[hero]?.collector && cars[hero]?.tuningLocked &&
    (Object.values(TUNER_SHOPS).some(shop =>
      !shop.cosmeticOnly && shop.donorCarId === base && shop.heroCarId === hero
    ) || LBWK_CATALOG.some(build => build.donor === base && build.id === hero)));
}

export function syncCrewHeroCarModels(source = {}) {
  const read = key => typeof source?.get === 'function'
    ? source.get(key) : source?.[key];
  const states = read('carStates') || {};
  const members = read('crewMembers') || {};
  const owned = new Set(read('ownedCarIds') || []);
  let restored = 0;

  for (const [characterId, baseCarId] of Object.entries(CREW_CHARACTER_CARS)) {
    const loanId = getCrewLoanCarId(characterId);
    const original = cars[baseCarId];
    if (!original) continue;

    const assigned = Object.values(members).some(member =>
      member?.characterId === characterId && member?.loanCarId === loanId);
    const heroId = states[loanId]?.crewHeroCarId;
    const hero = assigned && owned.has(loanId) &&
      isCompatibleCrewHeroBuild(baseCarId, heroId)
      ? cars[heroId] : null;
    const model = hero || original;
    // Replace, rather than Object.assign, to avoid stale collector-specific
    // properties remaining after switching to another save or leaving crew.
    cars[loanId] = {
      ...model,
      id: loanId,
      name: model.name + ' // CREW LOAN',
      shortName: model.shortName,
      crewLoan: true,
      crewOwnerCharacterId: characterId,
      crewBaseCarId: baseCarId,
      collector: Boolean(hero),
      tuningLocked: Boolean(hero),
      ginzaExclusive: false,
      visual: { ...(model.visual || {}) },
    };
    if (hero) restored++;
  }
  return restored;
}
