// One authoritative validation path for saved and newly generated Street
// Showdown lineups. Normal single-race Meet rivals MAY appear again here;
// recruited drivers, unavailable leaders and duplicate visual identities MAY NOT.
import {
  characters, getRivalCharacterOrderForRegion, getCharacterForContext,
  isMainRivalAvailableAtRegionalMeet,
} from './characters.js?v=20261013-r494';
import { cars } from './cars.js?v=20261011-r479';
import { getMeetLocation } from './meetAssets.js?v=20261016-r529';
import { getRecruitedCrewCharacterIds } from './crewSystem.js?v=20261016-r544';

export function isStreetShowdownOfferRosterValid(offer, {
  source = null, activeDriverCharacterId = '', playerCharacterId = '',
} = {}) {
  if (!Array.isArray(offer?.rounds) || offer.rounds.length !== 3) return false;
  const region = getMeetLocation(offer.locationId)?.district;
  if (!region) return false;

  const regionalIds = new Set(getRivalCharacterOrderForRegion(region));
  const recruited = getRecruitedCrewCharacterIds(source);
  const usedIds = new Set();
  const usedFaces = new Set();
  const activeId = String(activeDriverCharacterId || '');

  return offer.rounds.every(round => {
    const id = String(round?.characterId || '');
    const person = characters[id];
    const resolved = getCharacterForContext(id, {
      rivalContext: true, playerCharacterId,
    });
    const displayId = resolved?.id || id;

    if (!id || !person || person.rivalEligible === false ||
        !cars[round?.carId] || !regionalIds.has(id) ||
        recruited.has(id) || id === activeId ||
        !isMainRivalAvailableAtRegionalMeet(source, id, region) ||
        usedIds.has(id) || usedFaces.has(displayId)) return false;
    usedIds.add(id);
    usedFaces.add(displayId);
    return true;
  });
}
