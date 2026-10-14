import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const cutscene = read('src/ui/MangaCutscene.js');
const school = read('src/scenes/OshiageScene.js');
const race = read('src/scenes/RaceScene.js');

test('course starts in the SAME standard manga renderer as developer cutscenes', () => {
  assert.match(school, /playMangaCutscene\(this, definition/);
  assert.match(school, /characters: \\{ left: 'sayakaFujieda' \\}/);
  assert.match(school, /nameOverride: 'LADY INSTRUCTOR'/);
  assert.match(school, /finalActionLabel: 'YES, LET/);
  assert.match(school, /secondaryFinalActionLabel: 'NOT NOW'/);
  assert.doesNotMatch(school.slice(school.indexOf('  showLessonBookingDialogue('), school.indexOf('  showInstructorCutscene()')),
    /this\.add\.rectangle\(/);
  assert.match(cutscene, /typeof cutsceneId === 'object'/);
});

test('confirmation does not charge on skip or decline', () => {
  const segment = school.slice(school.indexOf('  showLessonBookingDialogue('),
    school.indexOf('  showInstructorCutscene()'));
  assert.match(segment, /if \(reason !== 'action'\) return;/);
  assert.match(segment, /bookOshiageLesson\(/);
  assert.match(segment, /consumeOshiageAttempt\(/);
});

test('results freeze last drive view before requiring tap then use the original manga renderer', () => {
  assert.match(race, /this\.time\.delayedCall\(1500,/);
  assert.match(race, /TAP TO REVIEW/);
  assert.match(race, /showCoachedResultsCutscene\(/);
  assert.match(race, /backgroundStyle: 'wash'/);
  assert.match(race, /playMangaCutscene\(this, definition/);
  const slice = race.slice(race.indexOf('  completeCoachedLesson('), race.indexOf('  setupDrivingTutorial('));
  assert.doesNotMatch(slice, /this\.add\.rectangle\(780, 360, 1560, 720/);
});

test('canonical manga cutscene displays live data on right and actions in dialogue footer', () => {
  assert.match(cutscene, /function drawMangaInfoPanel\(/);
  assert.match(cutscene, /context\.options\.infoPanel/);
  assert.match(cutscene, /drawMangaInfoPanel\(controller\)/);
  assert.match(cutscene, /whiteWash \? 0\.83/);
  assert.match(cutscene, /secondaryFinalActionLabel/);
  assert.match(race, /this\.coach\.shiftBands\.map\(band/);
  assert.match(race, /target: band\.min\.toLocaleString\(\)/);
  assert.match(race, /actual: attempt\?\.rpm/);
  assert.match(race, /result: !attempt \? 'NO SHIFT'/);
  assert.match(race, /secondaryFinalActionLabel: retries > 0/);
  assert.match(race, /consumeOshiageAttempt\(current\)/);
});

test('standard cutscene stories and racing are not modified or permanently flagged', () => {
  assert.match(cutscene, /getCutscene\(cutsceneId\)/);
  assert.match(cutscene, /definition\.once !== false/);
  assert.match(school, /id: 'oshiageSchoolBooking_' \+ lessonId/);
  assert.match(race, /id: 'oshiageLessonResult_' \+ this\.coachingLesson/);
  assert.match(race, /once: false/);
});
