import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import {
  characters,
  REGION_TEAM_CHARACTER_IDS,
  getRivalCharacterOrderForRegion,
  getCharacterVisualAsset,
} from '../src/data/characters.js';

const names = [
  ['haruSakurai', 'haru_sakurai'],
  ['miuTanaka', 'miu_tanaka'],
  ['renjiAoki', 'renji_aoki'],
  ['kentoFujisawa', 'kento_fujisawa'],
  ['rinaTachibana', 'rina_tachibana'],
  ['itsukiKuroda', 'itsuki_kuroda'],
];
const folder = 'assets/Characters/Shibuya/';

test('Shibuya has exactly six complete character sets without redundant filename prefixes', () => {
  const images = readdirSync(folder).filter(n => n.endsWith('.png')).sort();
  assert.equal(images.length, 18);
  assert.ok(images.every(name => !name.startsWith('shibuya_')));
  const expected = names.flatMap(([,slug]) => ['idle','win','loss'].map(p => slug + '_' + p + '.png')).sort();
  assert.deepEqual(images, expected);
});

test('all 18 renamed PNGs resolve through canonical visual asset lookup', () => {
  for (const [id, slug] of names) {
    assert.ok(REGION_TEAM_CHARACTER_IDS.SHIBUYA.includes(id), id + ' missing from regional cast');
    assert.ok(getRivalCharacterOrderForRegion('SHIBUYA').includes(id), id + ' missing from rival cast');
    assert.equal(characters[id].regionId, 'SHIBUYA');
    for (const pose of ['idle','win','loss']) {
      const asset = getCharacterVisualAsset(id, pose);
      const expected = folder + slug + '_' + pose + '.png';
      assert.equal(asset.path, expected);
      assert.ok(existsSync(expected), expected + ' missing');
      assert.ok(readFileSync(expected).length > 0, expected + ' empty');
    }
  }
});

test('old Shibuya-prefixed path references no longer exist in the roster', () => {
  const roster = readFileSync('src/data/characters.js', 'utf8');
  assert.ok(!roster.includes('assets/Characters/Shibuya/shibuya_'));
});
