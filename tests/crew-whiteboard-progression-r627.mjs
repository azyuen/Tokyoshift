import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CREW_REGIONS, getRegionalCrewRoster } from '../src/data/crewRoster.js';
import { getCrewWhiteboardMode } from '../src/data/crewBattlePlaybook.js';
import { isCrewComplete } from '../src/data/crewSystem.js';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const recruitFixtures = regions => Object.fromEntries(regions.map(regionId => [
  regionId, {
    regionId,
    characterId: getRegionalCrewRoster(regionId).members[0].characterId,
  },
]));

test('uploaded crew onboarding and existing regional whiteboards both exist', () => {
  assert.ok(existsSync(new URL('../assets/Garage/whiteboard_crewrecruit.png', import.meta.url)));
  assert.ok(existsSync(new URL('../assets/Garage/whiteboard_crewbattle.png', import.meta.url)));
});

test('How to Recruit unlocks only when Chapter 06 concludes', () => {
  const state = { cutscenesSeen: [], crewMembers: {} };
  assert.equal(getCrewWhiteboardMode(state), null);
  state.cutscenesSeen.push('sevenRegionsConquered');
  assert.equal(getCrewWhiteboardMode(state), 'recruit');
  const registry = { get: key => state[key] };
  assert.equal(getCrewWhiteboardMode(registry), 'recruit');
});

test('seven valid regional members AND the end of Chapter 07 unlock regional intel', () => {
  const state = {
    cutscenesSeen: ['sevenRegionsConquered'],
    crewMembers: recruitFixtures(CREW_REGIONS.slice(0, 6)),
  };
  assert.equal(isCrewComplete(state), false);
  assert.equal(getCrewWhiteboardMode(state), 'recruit');
  state.crewMembers = recruitFixtures(CREW_REGIONS);
  assert.equal(isCrewComplete(state), true);
  assert.equal(getCrewWhiteboardMode(state), 'recruit',
    'seven recruits alone must not skip Chapter 07');
  state.cutscenesSeen.push('fullCrewTogether');
  assert.equal(getCrewWhiteboardMode(state), 'playbook');
});

test('invalid members do not count as complete regional representation', () => {
  const state = {
    cutscenesSeen: ['sevenRegionsConquered','fullCrewTogether'],
    crewMembers: recruitFixtures(CREW_REGIONS.slice(0, 6)),
  };
  state.crewMembers.SHINJUKU = { regionId: 'SHINJUKU', characterId: 'fakeDriver' };
  assert.equal(isCrewComplete(state), false);
  assert.equal(getCrewWhiteboardMode(state), 'recruit');
});

test('dev preview does not mutate Chapter 06 or Chapter 07 completion flags', () => {
  const state = { cutscenesSeen: [], crewMembers: recruitFixtures(CREW_REGIONS) };
  assert.equal(getCrewWhiteboardMode(state), null);
  assert.equal(getCrewWhiteboardMode(state, { developerPreview: true }), 'playbook');
  assert.deepEqual(state.cutscenesSeen, []);
});

test('Crew Space swaps the same hotspot and shows the tutorial board as static artwork', () => {
  const garage = read('src/scenes/GarageScene.js');
  const bridge = read('src/scenes/CrewSpaceScene.js');
  const main = read('src/main.js');
  assert.ok(garage.includes('whiteboard_crewrecruit.png'));
  assert.ok(garage.includes('HOW TO RECRUIT  >'));
  assert.ok(garage.includes('REGIONAL PLAYBOOK  >'));
  assert.ok(garage.includes("if (mode === 'recruit') this.showCrewRecruitWhiteboard()"));
  assert.ok(garage.includes("else if (mode === 'playbook') this.showCrewBattleWhiteboard()"));
  assert.ok(garage.includes("this.getCrewWhiteboardMode() !== 'playbook'"));
  assert.ok(garage.includes("this.getCrewWhiteboardMode() !== 'recruit'"));
  assert.ok(garage.includes('this.refreshCrewPlaybookHotspot()'));
  const staticViewer = garage.split('  showCrewRecruitWhiteboard() {')[1]
    .split('  // Seven transparent hit areas')[0];
  assert.ok(staticViewer.includes("crewRecruitWhiteboard"));
  assert.ok(staticViewer.includes("CLOSE  X"));
  assert.ok(!staticViewer.includes("const targets ="));
  assert.ok(bridge.includes("GarageScene.js?v=20261021-r627"));
  assert.ok(main.includes("GarageScene.js?v=20261021-r627"));
  assert.ok(main.includes("CrewSpaceScene.js?v=20261021-r627"));
});

test('Chapter 06 Daichi points at the tutorial whiteboard, Chapter 07 triggers swap', () => {
  const story = read('src/data/cutscenes.js');
  const garage = read('src/scenes/GarageScene.js');
  assert.ok(story.includes('I put a quick guide on the whiteboard here'));
  assert.ok(story.includes('recruiting drivers from all seven regions'));
  assert.ok(garage.includes('Chapter 07 completion is saved before this callback fires'));
  assert.ok(garage.includes('this.refreshCrewPlaybookHotspot()'));
});

test('a finished Chapter 07 remains locked if the crew later loses a member', () => {
  const state = {
    cutscenesSeen: ['sevenRegionsConquered', 'fullCrewTogether'],
    crewMembers: recruitFixtures(CREW_REGIONS),
  };
  assert.equal(getCrewWhiteboardMode(state), 'playbook');
  delete state.crewMembers.DAIKOKU;
  assert.equal(getCrewWhiteboardMode(state), 'recruit');
});
