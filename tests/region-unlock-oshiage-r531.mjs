import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCareerRegionStatus } from '../src/data/careerProgression.js';
import {
  isTravelRegionUnlocked, isTravelLocationUnlocked,
  getTravelLocationUnlockLabel, TRAVEL_REGIONS,
} from '../src/data/travelRegions.js';
import {
  getCentralTokyoEligibility, getCentralTokyoAccess,
  getCentralTokyoUnlockLabel, getPendingCentralTokyoInvite,
} from '../src/data/centralTokyo.js';
import { CREW_REGIONS, REGIONAL_CREW_ROSTERS } from '../src/data/crewRoster.js';
import { MEET_LOCATIONS } from '../src/data/meetAssets.js';
import { LOCATION_ENCOUNTERS } from '../src/data/encounterProfiles.js';
import { getOshiageEliteProgress } from '../src/data/oshiageElite.js';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const stages = count => Object.fromEntries(CREW_REGIONS.slice(0,count).map(
  region => [region, { championEarned: true }]
));
const recruits = count => Object.fromEntries(CREW_REGIONS.slice(0,count).map(
  region => [region, { characterId: REGIONAL_CREW_ROSTERS[region].members[0].characterId }]
));
const battles = count => Object.fromEntries(CREW_REGIONS.slice(0,count).map(
  region => [region, { completed: true }]
));
const state = (wins=0, champs=0, crew=0, battle=0) => ({
  wins, garageTier: 2, devMode: false, cash: 20000,
  ownedCarIds: ['ae86'],
  tunerTeamChallenges: stages(champs),
  crewMembers: recruits(crew),
  crewBattleProgress: battles(battle),
  centralTokyoUnlocks: {},
});

test('early districts unlock at exactly nine wins, without a car development gate', () => {
  for (const region of ['SHINAGAWA','TATSUMI']) {
    assert.equal(isTravelRegionUnlocked(state(8),region),false);
    assert.equal(getCareerRegionStatus(state(8),region).label,'9 WINS REQUIRED');
    assert.equal(isTravelRegionUnlocked({...state(9),garageTier:0},region),true);
  }
});
test('championship gate thresholds require exactly 1/2/4/5 titles', () => {
  const gates = { SHIBUYA:1, YOKOHAMA:2, DAIKOKU:4, SHINJUKU:5 };
  for (const [region,number] of Object.entries(gates)) {
    assert.equal(isTravelRegionUnlocked(state(500,number-1),region),false);
    assert.equal(isTravelRegionUnlocked(state(0,number),region),true);
  }
});
test('all three Shinjuku locations and meet difficulty labels are ELITE', () => {
  assert.equal(TRAVEL_REGIONS.SHINJUKU.level,'ELITE');
  for(const item of TRAVEL_REGIONS.SHINJUKU.locations) {
    assert.equal(item.difficulty,'ELITE');
    assert.equal(MEET_LOCATIONS[item.id].difficulty,'ELITE');
    assert.equal(LOCATION_ENCOUNTERS[item.id].difficulty,'ELITE');
  }
});
test('Oshiage services open early; Skytree requires seven regional championships', () => {
  const six = state(3,6);
  assert.equal(isTravelLocationUnlocked(six,'oshiageCustomWorks'),true);
  assert.equal(isTravelLocationUnlocked(six,'oshiageDrivingSchool'),true);
  assert.equal(isTravelLocationUnlocked(six,'oshiageSkytreeMeet'),false);
  assert.match(getTravelLocationUnlockLabel(six,'oshiageSkytreeMeet'),/7 REGIONAL CHAMPIONSHIPS/);
  assert.equal(getOshiageEliteProgress(state(3,7)).complete,true);
  assert.equal(isTravelLocationUnlocked(state(3,7),'oshiageSkytreeMeet'),true);
});
test('Drag Complex unlocks with full recruited crew, not winning their battles', () => {
  assert.equal(getCentralTokyoEligibility(state(100,7,6,0)).drag,false);
  assert.equal(getCentralTokyoEligibility(state(100,7,7,0)).drag,true);
  assert.equal(getCentralTokyoAccess(state(100,7,7,0)).drag,true);
  assert.match(getCentralTokyoUnlockLabel(state(100,7,6,0),'tokyoDragComplex'),/RECRUIT FULL CREW/);
});
test('Ginza requires all seven completed crew battles plus the invitation', () => {
  const nearly = state(100,7,7,6);
  assert.equal(getCentralTokyoEligibility(nearly).ginza,false);
  assert.equal(getCentralTokyoUnlockLabel(nearly,'ginzaMotorGallery'),'BY INVITATION ONLY');
  const complete = state(100,7,7,7);
  assert.equal(getCentralTokyoEligibility(complete).ginza,true);
  assert.equal(getCentralTokyoAccess(complete).ginza,false);
  assert.equal(getPendingCentralTokyoInvite({ ...complete,centralTokyoUnlocks:{autoMarket:true} }),'ginza');
  const accepted = {...complete, centralTokyoUnlocks:{ginza:true}};
  assert.equal(getCentralTokyoAccess(accepted).ginza,true);
});
test('Oshiage landing has only two blue shop buttons and Ginza-style descriptive copy', () => {
  const s = read('src/scenes/OshiageScene.js');
  const home = s.split('  drawCustomWorks() {')[1].split('  returnToCustomWorks() {')[0];
  assert(home.includes("'Shop for bodywork and rims', true"));
  assert(home.includes('EXTERIOR CUSTOMISATION'));
  assert(home.includes("RIMS: Try and buy new and rare wheel designs"));
  assert(!home.includes('ENTER PAINT BOOTH'));
  assert(!home.includes('BODYKIT // COMING SOON'));
  assert.equal((home.match(/accent: true/g)||[]).length,2);
});
test('paint studio uses tappable HSV colour square, lower car and right-side actions', () => {
  const s=read('src/scenes/OshiageScene.js');
  assert(s.includes('drawPaintColourSquare()'));
  assert(s.includes('createCanvas(key, width, height)'));
  assert(s.includes("square.on('pointerdown', chooseSquare)"));
  assert(s.includes("strip.on('pointerdown', chooseHue)"));
  assert(s.includes('car, state, 609, 410, 483, this.pendingPaint'));
  assert(!s.includes("this.button(SIDE.x + 112, y, 48, 42, '-'"));
  assert(s.includes("'APPLY PAINT // ' + MONEY(fee)"));
  assert(s.includes("'RETURN TO CUSTOM WORKS'"));
});
test('rim wall is width-filled/top-aligned; preview back moved into stage', () => {
  const s=read('src/scenes/OshiageScene.js');
  assert(s.includes("rimWall ? STAGE.y : STAGE.y + STAGE.h / 2"));
  assert(s.includes('const scale = STAGE.w / sourceW'));
  assert(s.includes("'BACK TO RIM WALL'"));
  assert(s.includes("'WHEEL COLLECTION // EIGHT DESIGNS ON DISPLAY'"));
  assert(s.includes("'SELECT A WHEEL TO PREVIEW'"));
  assert(!s.includes("this.button(326, 745, 550, 64"));
});
