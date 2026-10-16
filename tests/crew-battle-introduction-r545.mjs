import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { characters } from '../src/data/characters.js';
import { CREW_REGIONS, getRegionalMainRivalId } from '../src/data/crewRoster.js';
import { buildRegionalCrewBattleRounds } from '../src/data/crewSystem.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';
import {
  REGIONAL_CREW_BATTLE_LINES,
  getRegionalCrewBattleDialogue,
  createRegionalCrewBattleIntroduction,
} from '../src/data/crewBattleIntroductions.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('every regional leader has three distinct, bible-consistent battle invitations', () => {
  assert.deepEqual(Object.keys(REGIONAL_CREW_BATTLE_LINES), [...CREW_REGIONS]);
  const allLines = [];
  for (const regionId of CREW_REGIONS) {
    const leaderId = getRegionalMainRivalId(regionId);
    assert.ok(characters[leaderId], regionId + ': missing canonical leader');
    const variants = REGIONAL_CREW_BATTLE_LINES[regionId];
    assert.equal(variants.length, 3, regionId + ': exactly three permutations');
    for (let index = 0; index < 3; index++) {
      const lines = getRegionalCrewBattleDialogue(regionId, index);
      assert.equal(lines.variantIndex, index);
      for (const part of ['leader', 'rules', 'boast', 'challenge']) {
        const text = lines[part];
        assert.ok(typeof text === 'string' && text.length > (part === 'challenge' ? 8 : 25), regionId + ': ' + part);
        assert.doesNotMatch(text, /TODO|PLACEHOLDER|\{\w+\}/i);
        allLines.push(text);
      }
      assert.match(lines.rules, /three|two|2|3|best of three/i,
        regionId + ': rules must state battle format');
      assert.equal(getRegionalCrewBattleDialogue(regionId, index + 3).variantIndex, index,
        'variants rotate on the next set of three visits');
    }
  }
  assert.equal(new Set(allLines).size, allLines.length,
    'every region and variation should have its own dialogue');
  assert.equal(getRegionalCrewBattleDialogue('not-a-region'), null);
});

test('Manga definition stages leader first then active rival and prompts explicit choice', () => {
  for (const regionId of CREW_REGIONS) {
    const definition = createRegionalCrewBattleIntroduction(regionId, 1);
    assert.equal(definition.once, false, 'every crew challenge can be replayed');
    assert.equal(definition.characters.left, '$LEADER');
    assert.equal(definition.characters.right, '$CHALLENGER');
    assert.equal(definition.pages.length, 4);
    assert.deepEqual(definition.pages.map(page => page.speaker),
      ['left', 'left', 'right', 'right']);
    assert.equal(definition.pages[3].requireActionButton, true);
    assert.equal(definition.finalActionLabel, 'ACCEPT CHALLENGE');
    assert.equal(definition.secondaryFinalActionLabel, 'RACE LATER');
    assert.ok(definition.title.startsWith(regionId + ' //'));
    const rounds = buildRegionalCrewBattleRounds(regionId);
    assert.equal(rounds.length, 3);
    assert.ok(rounds.every(round => !round.leader), 'captain never drives a crew heat');
    assert.ok(rounds.every(round => round.characterId !== getRegionalMainRivalId(regionId)));
    assert.ok(characters[rounds[0].characterId], regionId + ': actual crew opponent exists');
  }
});

test('Meet opens manga before selection and never treats SKIP as acceptance', () => {
  const meet = source('src/scenes/MeetScene.js');
  const start = meet.indexOf('  showCrewBattleIntroduction(regionId) {');
  const end = meet.indexOf('  showCrewBattleLineup(regionId) {', start);
  const method = meet.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.match(meet, /if \(action\.id === 'CREW'\) this\.showCrewBattleIntroduction\(regionId\)/);
  assert.match(method, /getCrewBattleCaptainId\(key\)/);
  assert.match(method, /rounds\[0\]\?\.characterId/);
  assert.match(method, /createRegionalCrewBattleIntroduction\(key, count\)/);
  assert.match(method, /playMangaCutscene\(this, definition,/);
  assert.match(method, /if \(reason === 'action'\) this\.showCrewBattleLineup\(key\)/);
  assert.doesNotMatch(method, /reason === 'skip'\) this\.showCrewBattleLineup/);
  assert.match(method, /saveSessionState\(this\.registry\)/);
  assert.match(meet, /this\.showCrewBattleIntroduction\(regionId\);\s*this\.flashDevControl/);
});

test('per-region rotation survives normalization and cannot spill arbitrary keys', () => {
  assert.deepEqual(createDefaultGameState().crewBattleIntroVisits, {});
  const out = normaliseState({
    crewBattleIntroVisits: { ODAIBA: 2, SHINAGAWA: 7, TATSUMI: -12, INVALID_REGION: 500 },
  });
  assert.deepEqual(out.crewBattleIntroVisits, { ODAIBA: 2, SHINAGAWA: 7, TATSUMI: 0 });
  const stateSource = source('src/state/GameState.js');
  assert.match(stateSource, /crewBattleIntroVisits: registry\.get\('crewBattleIntroVisits'\) \|\| \{\}/);
  assert.deepEqual(normaliseState({}).crewBattleIntroVisits, {});
});

test('existing three-heat racing and crew picker remain separate from invitation', () => {
  const meet = source('src/scenes/MeetScene.js');
  assert.match(meet, /startCrewBattle\(regionId, slots, rounds\)/);
  assert.match(meet, /const slots = \[0, 1, 2\]/);
  assert.match(meet, /'3 VS 3  \/\/  BEST OF 3'/);
  const cutscene = source('src/ui/MangaCutscene.js');
  assert.match(cutscene, /secondaryBox\?\.on\('pointerdown', \(\) => controller\.finish\('secondary'\)\)/);
});
