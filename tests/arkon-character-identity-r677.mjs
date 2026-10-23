import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {characters} from '../src/data/characters.js';
import {
  DEV_LOGIN_NAME, ARUKEN_CHARACTER_ID, ARUKEN_CHARACTER_NAME,
  getInGamePlayerDisplayName,
} from '../src/data/characterDisplayName.js';
import {isArkonName,ethanCompensationCutscene} from '../src/data/specialProfileRewards.js';
import {createArkonStoryState, normaliseState} from '../src/state/GameState.js';
import {ARKON_CHAPTER_01_REVISED} from '../src/data/arkonChapter01Revised.js';
import {ARKON_CHAPTER_10} from '../src/data/arkonChapter10.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const registry = state => ({get: key => state[key]});
test('Aruken is the character in both Story and Career, but Arkon Den is the login', () => {
  assert.equal(DEV_LOGIN_NAME, 'Arkon Den');
  assert.equal(ARUKEN_CHARACTER_ID, 'arkonDen');
  assert.equal(ARUKEN_CHARACTER_NAME, 'Aruken Denzaki');
  assert.equal(characters.arkonDen.name, 'Aruken Denzaki');
  assert.equal(ethanCompensationCutscene().category, 'ARUKEN DENZAKI // SPECIAL DELIVERY');
  assert.equal(isArkonName('Arkon', 'Den'), true);
  assert.equal(isArkonName('Aruken', 'Denzaki'), false);
  for (const mode of ['arkonStory', 'career']) {
    const state = {firstName:'Arkon',lastName:'Den',
      playerCharacterId:'arkonDen',gameMode:mode};
    assert.equal(getInGamePlayerDisplayName(state), 'Aruken Denzaki');
    assert.equal(getInGamePlayerDisplayName(registry(state)), 'Aruken Denzaki');
    assert.equal(state.firstName, 'Arkon');
    assert.equal(state.lastName, 'Den');
  }
  assert.equal(getInGamePlayerDisplayName({
    firstName:'Other',lastName:'Driver',playerCharacterId:'renMizuno',
  }), 'Other Driver');
});

test('historic Arkon Story save identity and mode gates remain untouched', () => {
  const story = createArkonStoryState(1);
  assert.equal(story.firstName, 'Arkon');
  assert.equal(story.lastName, 'Den');
  assert.equal(story.playerCharacterId, 'arkonDen');
  assert.equal(story.gameMode, 'arkonStory');
  assert.equal(story.devMode, false);
  assert.equal(normaliseState(story).gameMode,'arkonStory');
  assert.match(source('src/scenes/ProfileSelectScene.js'),
    /ARKON DEN \/\/ TWO JOURNEYS/);
  assert.match(source('src/scenes/CharacterSelectScene.js'),
    /ARKON DEN \/\/ ENTER THE CORRECT 4-DIGIT PIN/);
  assert.match(source('src/state/GameState.js'),
    /=== 'arkonden'/);
});

test('story chapter titles and spoken dialogue consistently use Aruken', () => {
  assert.match(ARKON_CHAPTER_01_REVISED.title,/^ARUKEN DENZAKI/);
  assert.match(ARKON_CHAPTER_10.title,/^ARUKEN DENZAKI/);
  for (const name of [
    'arkonChapter01.js','arkonChapter01Extended.js',
    'arkonChapter01Revised.js','arkonChapter02.js','arkonChapter03.js',
    'arkonChapter04.js','arkonChapter05.js','arkonChapter06.js',
    'arkonChapter07.js','arkonChapter08.js','arkonChapter09.js',
    'arkonChapter10.js',
  ]) {
    const script = source('src/data/' + name);
    assert.doesNotMatch(script, /\bArkon\b|\bARKON\b/,
      'legacy character name in ' + name);
  }
  assert.match(source('src/data/arkonChapter03.js'),
    /speakerLabel:'ARUKEN'/);
  assert.match(source('src/ui/ArkonChapter10Finale.js'), /ARUKEN DENZAKI/);
  assert.match(source('src/ui/ArkonRwbContract.js'), /ARUKEN DENZAKI/);
});
test('Career scenes and racing names use the in-game identity', () => {
  assert.match(source('src/data/chapter08.js'),
    /Aruken and I spent/);
  assert.match(source('src/data/ginzaScenes.js'),
    /Aruken Denzaki!/);
  assert.match(source('src/data/cutscenes.js'),
    /Aruken will tell/);
  assert.match(source('src/scenes/MeetScene.js'),
    /const playerName = getInGamePlayerDisplayName\(this.registry\)/);
  assert.match(source('src/scenes/RaceScene.js'),
    /const playerDisplayName = getInGamePlayerDisplayName\(this.registry\)/);
  assert.match(source('src/data/cars.js'),
    /Liberty Walk Datsun 240Z \/\/ Aruken Denzaki/);
});
test('keep stable persisted IDs, dev login, and existing asset paths', () => {
  assert.match(source('src/data/characters.js'), /id: 'arkonDen'/);
  assert.match(source('src/data/characters.js'),
    /assets\/Characters\/Main\/arkon_den_idle\.png/);
  assert.match(source('src/data/specialProfileRewards.js'),
    /=== 'arkonden'/);
  assert.doesNotMatch(source('src/scenes/MeetScene.js'),
    /const playerName = \[\s*String\(this.registry.get\('firstName'\)/);
  assert.match(source('src/ui/GinzaBanterHud.js'), /create\('ARUKEN'/);
});
