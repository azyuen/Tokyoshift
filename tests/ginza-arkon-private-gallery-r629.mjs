import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { isNamedArkonDen } from '../src/data/ginzaGallery.js';
import { ginzaConversation } from '../src/data/ginzaScenes.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const data = (firstName, lastName, rest = {}) => ({ firstName, lastName, ...rest });

test('private owner cameo is keyed to the name, not developer/cash privileges', () => {
  assert.equal(isNamedArkonDen(data('Arkon', 'Den')), true);
  assert.equal(isNamedArkonDen(data('arkon den', '')), true);
  assert.equal(isNamedArkonDen({ get: key => data('Arkon', 'Den')[key] }), true);
  assert.equal(isNamedArkonDen(data('Someone', 'Else', { devMode: true })), false);
  assert.equal(isNamedArkonDen(data('Someone', 'Else', { cash: 900000001 })), false);
  assert.equal(isNamedArkonDen(data('Arkon', 'Denny')), false);
});

test('Arkon and Sayaka use their specific suit and evening-dress assets', () => {
  const characters = source('src/data/characters.js');
  for (const filename of ['arkon_den_suit.png', 'ginza_sayaka_fujieda_dress.png']) {
    assert.ok(existsSync('assets/Characters/Main/' + filename), filename);
    assert.ok(characters.includes("assets/Characters/Main/" + filename), filename);
  }
  assert.match(characters, /ginzaDress:\s*\{ key: 'ginzaSayakaDress'/);
  assert.match(characters, /ginzaSuit:\s*\{ key: 'ginzaArkonDenSuit'/);
});

test('owner-specific dialogue is relaxed, shows both portraits and never replaces the standard vault', () => {
  const scene = ginzaConversation('vaultArkon');
  assert.equal(scene.characters.left, 'sayakaFujieda');
  assert.equal(scene.characters.right, 'arkonDen');
  assert.deepEqual(scene.pages.map(p => p.speaker), ['left', 'right', 'left', 'left']);
  assert.ok(scene.pages.every(p => p.leftPose === 'normal'));
  assert.ok(scene.pages.every(p => p.rightPose === 'ginzaSuit'));
  assert.match(scene.pages[0].text, /where are you off to/i);
  assert.match(scene.pages[1].text, /regular night out/i);
  assert.match(scene.pages.at(-1).text, /something more comfortable/i);
  assert.match(scene.pages.at(-1).text, /wrecking our prized assets/i);
  assert.equal(ginzaConversation('vaultOwner').pages.length, 3);
  assert.equal(ginzaConversation('vaultInvitation').pages.length, 3);
});

test('Arkon appears only in private gallery and outfit change fades through actual venue poses', () => {
  const scene = source('src/scenes/CentralTokyoScene.js');
  assert.match(scene, /const arkonVault = this\.ginzaRoom === 3 && isNamedArkonDen\(this\.registry\)/);
  assert.match(scene, /if \(arkonVault\) \{[\s\S]*?characterId: 'arkonDen', pose: 'ginzaSuit'/);
  assert.match(scene, /if \(dev && isNamedArkonDen\(this\.registry\)\)/);
  assert.match(scene, /this\.ginzaScene\('vaultArkon', \{\}, \(\) =>/);
  assert.match(scene, /this\.changeGinzaSayakaToDress\(\)/);
  assert.match(scene, /changeGinzaSayakaToDress\(\) \{/);
  assert.match(scene, /targets: previous, alpha: 0, duration: 460/);
  assert.match(scene, /targets: dressed, alpha: 1, duration: 580/);
  assert.match(scene, /shadow: false/);
  assert.match(scene, /pose: arkonVault \? \(this\.ginzaOwnerDressed \? 'ginzaDress' : 'normal'\) : 'ginzaNormal'/);
});
