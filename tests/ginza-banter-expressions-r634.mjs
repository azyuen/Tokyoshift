import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GINZA_BANTER_EXCHANGES, createGinzaBanterState, advanceGinzaBanter } from '../src/data/ginzaBanter.js';
import { characters } from '../src/data/characters.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const SAYAKA = ['devIdle', 'devDisappointed', 'devSad', 'devScowl', 'devUnsure'];
const ARKON = ['devIdle', 'devLaughing', 'devSerious', 'devTalking'];

test('exactly 80 distinct, concise two-person Ginza exchanges with authored emotions', () => {
  assert.equal(GINZA_BANTER_EXCHANGES.length, 80, 'original 16 plus 64 new');
  const unique = new Set();
  for (const item of GINZA_BANTER_EXCHANGES) {
    assert.ok(item.sayaka && item.arkon);
    assert.ok(item.sayaka.length <= 110, item.sayaka);
    assert.ok(item.arkon.length <= 110, item.arkon);
    assert.ok(SAYAKA.includes(item.sayakaPose), item.sayakaPose);
    assert.ok(ARKON.includes(item.arkonPose), item.arkonPose);
    assert.doesNotMatch(item.sayaka + item.arkon, /shift (?:up|down)|gear ratio|optimal rpm|rev limiter/i);
    unique.add(item.sayaka.toLowerCase());
  }
  assert.equal(unique.size, 80, 'no duplicate Sayaka prompts');
  assert.deepEqual(new Set(GINZA_BANTER_EXCHANGES.map(x => x.sayakaPose)), new Set(SAYAKA));
  assert.deepEqual(new Set(GINZA_BANTER_EXCHANGES.map(x => x.arkonPose)), new Set(ARKON));
});

test('every expression maps to a real unique Dev PNG and is registered for reusable character scenes', () => {
  const all = [
    ...SAYAKA.map(pose => ['sayakaFujieda', pose]),
    ...ARKON.map(pose => ['arkonDen', pose]),
  ];
  const seenKeys = new Set();
  for (const [character, pose] of all) {
    const asset = characters[character].visual.poseAssets[pose];
    assert.ok(asset?.key);
    assert.match(asset.path, /^assets\/Characters\/Dev\//);
    assert.ok(existsSync(asset.path), asset.path);
    assert.ok(!seenKeys.has(asset.key), asset.key);
    seenKeys.add(asset.key);
  }
});

test('the line emitted by the controller carries speaker-specific pose through each turn', () => {
  const state = createGinzaBanterState(1);
  const first = advanceGinzaBanter(state,
    { elapsed: 0.5, gear: 1, running: true }, () => 0.999);
  const target = GINZA_BANTER_EXCHANGES.at(-1);
  assert.deepEqual(first, { speaker:'sayaka', text:target.sayaka, pose:target.sayakaPose });
  assert.equal(advanceGinzaBanter(state,
    { elapsed:1.1, gear:2, running:true }, () => 0), null);
  const response = advanceGinzaBanter(state,
    { elapsed:3.1, gear:2, running:true }, () => 0);
  assert.deepEqual(response, { speaker:'arkon', text:target.arkon, pose:target.arkonPose });
});

test('race only loads Dev emotions for named Arkon loan drives and portrait switches by line', () => {
  const race = source('src/scenes/RaceScene.js');
  const hud = source('src/ui/GinzaBanterHud.js');
  assert.match(race, /this\.hasGinzaBanter = this\.isGinzaDemoRace && isNamedArkonDen\(this\.registry\)/);
  assert.match(race, /if \(this\.hasGinzaBanter\) \{/);
  for (const pose of SAYAKA.concat(ARKON)) {
    assert.ok(race.includes("'" + pose + "'"), pose + ' must preload');
  }
  assert.match(race, /this\.ginzaPassenger\.show\(line\.speaker, line\.text, line\.pose\)/);
  assert.match(hud, /spriteKeyForPose: pose => visual\.poseAssets\?\.\[pose\]\?\.key \|\| key/);
  assert.match(hud, /active\.setPortrait\(pose\)/);
  assert.match(hud, /const active = speaker === 'arkon' \? right : left/);
  assert.match(hud, /toggle\(active, true\)/);
});
