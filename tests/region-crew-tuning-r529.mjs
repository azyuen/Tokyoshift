import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getRecruitedCrewCharacterIds, buildRegionalCrewBattleRounds } from '../src/data/crewSystem.js';
import { getTunerTeamChallengeRoster, buildTunerTeamChallengeRounds } from '../src/data/tunerChallenges.js';
import { getRegionalCrewRoster } from '../src/data/crewRoster.js';
import { TRAVEL_REGIONS, getRegionTravelCost } from '../src/data/travelRegions.js';
import { getTravelCost, getWorkshopDepartureCost } from '../src/data/meetAssets.js';
import { getTunerShopForRegion } from '../src/data/tunerShops.js';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const state = { crewMembers: {
  ODAIBA: { characterId: 'aoiShindou', baseCarId: '240z' },
  SHINAGAWA: { characterId: 'reikaTachibana', baseCarId: 'fc3s' },
} };
test('recruits disappear from regional championships and the final crew battle', () => {
  const blocked = getRecruitedCrewCharacterIds(state);
  assert(blocked.has('aoiShindou'));
  assert(blocked.has('reikaTachibana'));
  const roster = getTunerTeamChallengeRoster('ODAIBA', '', state);
  assert.equal(roster.length, 7);
  assert.equal(new Set(roster).size, 7);
  assert(!roster.some(id => blocked.has(id)));
  assert.equal(roster.at(-1), getRegionalCrewRoster('ODAIBA').mainRivalId);
  const rounds = buildTunerTeamChallengeRounds('ODAIBA', '', 'STANDARD', state);
  assert.equal(rounds.length, 7);
  assert(!rounds.some(r => blocked.has(r.characterId)));
  const battle = buildRegionalCrewBattleRounds('ODAIBA', state);
  assert.equal(battle.length, 6);
  assert(!battle.some(r => blocked.has(r.characterId)));
  assert.equal(battle.at(-1).characterId, getRegionalCrewRoster('ODAIBA').mainRivalId);
});
test('meet fallback, cached rival cards, and saved team rounds enforce exclusions', () => {
  const s = read('src/scenes/MeetScene.js');
  assert(s.includes('const blocked = new Set([playerId, ...exclude, ...getRecruitedCrewCharacterIds(this.registry)]);'));
  assert(s.includes('visibleOffers.some(offer => getRecruitedCrewCharacterIds(this.registry).has(offer?.characterId))'));
  assert(s.includes('const hasRecruitedOpponent = storedRounds.some'));
  assert(s.includes('hasRecruitedOpponent ? generatedRounds'));
});
test('regional trip has one entry fee; destinations within that region are free', () => {
  const homeRegion = TRAVEL_REGIONS.ODAIBA;
  const nextRegion = TRAVEL_REGIONS.SHINAGAWA;
  const first = homeRegion.locations[0].id;
  const second = homeRegion.locations[1].id;
  const cross = nextRegion.locations[0].id;
  assert.equal(getRegionTravelCost({ currentLocationId:first, targetLocationId:second }), 0);
  assert.equal(getTravelCost(first,second), 0);
  assert.equal(getRegionTravelCost({ currentLocationId:first,targetLocationId:cross }),nextRegion.baseCost);
  assert.equal(getTravelCost(first,cross),nextRegion.baseCost);
  assert.equal(getWorkshopDepartureCost(first,second),homeRegion.baseCost);
  for (const location of homeRegion.locations)
    assert.equal(getRegionTravelCost({fromWorkshop:true,currentLocationId:first,targetLocationId:location.id}),homeRegion.baseCost);
});
test('map groups fees by region and removes day/night from location rows', () => {
  const map = read('src/ui/TravelMap.js');
  assert(map.includes("'ENTRY // ' + MONEY(region.baseCost || 0)"));
  assert(map.includes("'LOCAL TRAVEL // FREE'"));
  assert(map.includes("(isCurrent ? 'HERE' : 'AVAILABLE')"));
  assert(!map.includes("item.difficulty + '  •  ' + time"));
});
test('meet car shadows use one ellipse and sit higher under the right car', () => {
  const segment = read('src/scenes/MeetScene.js').split('  createCarDisplay(').at(-1);
  assert(segment.includes('const shadowY = tyreBottom - (flipX ? 12 : 7);'));
  assert(!segment.includes('contactShadow'));
});
test('tuner display names are universal; permanent save IDs stay compatible', () => {
  const zero = getTunerShopForRegion('SHINAGAWA');
  const re = getTunerShopForRegion('DAIKOKU');
  assert.equal(zero.specialty,'DRIVETRAIN & LAUNCH');
  assert.equal(re.specialty,'COOLING & FLOW');
  assert.deepEqual(zero.tuningOptions.map(o=>o.id),['zeroSportsBoxerResponse','zeroSportsAwdLaunch','zeroSportsCompleteSetup']);
  assert.deepEqual(re.tuningOptions.map(o=>o.id),['reAmemiyaCoolingFlow','reAmemiyaTurboResponse','reAmemiyaCircuitRotary']);
  for (const option of [...zero.tuningOptions,...re.tuningOptions])
    assert(!/rotary|boxer|AWD|EJ /i.test(option.name + ' ' + option.description + ' ' + option.shortName));
});
