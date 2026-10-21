import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  GINZA_BANTER_EXCHANGES, createGinzaBanterState, advanceGinzaBanter,
} from '../src/data/ginzaBanter.js';
import { isNamedArkonDen } from '../src/data/ginzaGallery.js';
import { ginzaConversation } from '../src/data/ginzaScenes.js';

const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const tick = (state, elapsed, gear = 1, opts = {}) =>
  advanceGinzaBanter(state, { elapsed, gear, running: true, ...opts }, () => 0);

test("Arkon's humour is varied and unrelated to ideal shift/RPM instructions", () => {
  assert.ok(GINZA_BANTER_EXCHANGES.length >= 12);
  for (const pair of GINZA_BANTER_EXCHANGES) {
    assert.ok(pair.sayaka && pair.arkon);
    assert.doesNotMatch(pair.sayaka + ' ' + pair.arkon,
      /\b(?:rpm|rev limiter|shift up|shift down|optimal|gear ratio)\b/i);
  }
  assert.equal(isNamedArkonDen({ firstName:'Arkon', lastName:'Den' }), true);
  assert.equal(isNamedArkonDen({ firstName:'Random', lastName:'Dev', devMode:true }), false);
});

test('no dialogue before launch; paired conversation alternates over elapsed time', () => {
  const state = createGinzaBanterState(1);
  assert.equal(advanceGinzaBanter(state, { elapsed:3, gear:1, running:false }), null);
  assert.equal(tick(state, 0.3), null);
  const first = tick(state, 0.5);
  assert.equal(first.speaker, 'sayaka');
  assert.ok(first.text);
  assert.equal(tick(state, 1.5), null);
  const answer = tick(state, 3);
  assert.equal(answer.speaker, 'arkon');
  assert.equal(answer.text, GINZA_BANTER_EXCHANGES[0].arkon);
  assert.equal(tick(state, 5), null);
  const later = tick(state, 7.6);
  assert.equal(later.speaker, 'sayaka');
  assert.notEqual(later.text, first.text, 'no immediate repeat');
  const next = tick(state, 10.1);
  assert.equal(next.speaker, 'arkon');
});

test('gear changes may trigger a new exchange, but never interrupt Arkon response', () => {
  const state = createGinzaBanterState(1);
  tick(state, .5, 1);
  assert.equal(tick(state, 1.2, 2), null);
  assert.equal(tick(state, 3, 2).speaker, 'arkon');
  assert.equal(tick(state, 5.6, 2), null);
  assert.equal(tick(state, 6, 3).speaker, 'sayaka');
});

test('finished races stop new dialogue', () => {
  const state = createGinzaBanterState(1);
  assert.equal(tick(state, 1, 1, { finished: true }), null);
  assert.equal(tick(state, 2, 1).speaker, 'sayaka');
  assert.equal(tick(state, 4.5, 1, { finished: true }), null);
});

test('ordinary Ginza drivers get no passenger shifting HUD; Arkon uses dress and suit', () => {
  const race = source('src/scenes/RaceScene.js');
  const hud = source('src/ui/GinzaBanterHud.js');
  const dialogue = ginzaConversation('vaultDrive');
  assert.doesNotMatch(dialogue.pages.map(x => x.text).join(' '), /shift|rpm/i);
  assert.match(race, /this\.hasGinzaBanter = this\.isGinzaDemoRace && isNamedArkonDen\(this\.registry\)/);
  assert.match(race, /if \(this\.hasGinzaBanter\) this\.setupGinzaPassenger\(\)/);
  assert.match(race, /if \(!this\.hasGinzaBanter \|\| !this\.ginzaPassenger \|\| this\.resultsShown\) return/);
  assert.doesNotMatch(race, /ginzaShiftBands|ginzaLastAdviceAt|this\.ginzaPassenger\.dialogue/);
  assert.match(race, /createGinzaBanterHud\(this\)/);
  assert.match(race, /if \(this\.finished\) \{\s*this\.ginzaPassenger\.hide\(\)/);
  assert.match(hud, /const sayakaKey = sayakaVisual\.poseAssets\.ginzaDress\.key/);
  assert.match(hud, /const arkonKey = arkonVisual\.poseAssets\.ginzaSuit\.key/);
  assert.match(hud, /create\('SAYAKA', sayakaVisual, sayakaKey, 'left'/);
  assert.match(hud, /create\('ARKON', arkonVisual, arkonKey, 'right'/);
  assert.match(hud, /const active = speaker === 'arkon' \? right : left/);
  assert.ok(existsSync('assets/Characters/Main/ginza_sayaka_fujieda_dress.png'));
  assert.ok(existsSync('assets/Characters/Main/arkon_den_suit.png'));
});
