import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {
  getCharacterVisualAsset,
  getProCircuitCharacterAsset,
  getProCircuitGenericDriverAsset,
  PRO_RACING_CHARACTER_STEMS,
} from '../src/data/characters.js';

const fileExists = path => existsSync(new URL('../' + path, import.meta.url));
const getText = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('every uploaded Pro rival, substitute and developer sprite exists for all poses', () => {
  assert.equal(Object.keys(PRO_RACING_CHARACTER_STEMS).length, 10);
  for (const [characterId, stem] of Object.entries(PRO_RACING_CHARACTER_STEMS)) {
    for (const pose of ['idle', 'win', 'loss']) {
      const asset = getCharacterVisualAsset(characterId, pose, {proCircuit:true});
      assert.equal(asset.path, 'assets/Characters/Pro/' + stem + '_' + pose + '.png');
      assert.equal(asset.pose, pose);
      assert.ok(asset.key.startsWith('proCircuitCharacter_'));
      assert.ok(fileExists(asset.path), asset.path + ' missing');
    }
  }
});

test('Pro texture keys remain independent of the street wardrobe', () => {
  for (const id of ['renMizuno','ayaKurose','kaitoFujimori','haruTachibana',
    'reinaShibata','rikuAkamine','emiKanzaki','arkonDen']) {
    const pro=getCharacterVisualAsset(id,'idle',{proCircuit:true});
    const street=getCharacterVisualAsset(id,'idle');
    assert.notEqual(pro.key,street.key);
    assert.notEqual(pro.path,street.path);
  }
  // Non-Pro NPCs such as Sayaka/Daichi keep their venue-specific outfits.
  assert.equal(getProCircuitCharacterAsset('sayakaFujieda','trackHappy'),null);
  assert.equal(getCharacterVisualAsset('sayakaFujieda','trackHappy',{proCircuit:true}).path,
    getCharacterVisualAsset('sayakaFujieda','trackHappy').path);
});

test('Pro rival selection preserves player/replacement identity separation', () => {
  const actual=getCharacterVisualAsset('renMizuno','loss',{proCircuit:true});
  const substitute=getCharacterVisualAsset('renMizuno','loss',{
    proCircuit:true,rivalContext:true,playerCharacterId:'renMizuno',
  });
  assert.equal(actual.path,'assets/Characters/Pro/ren_mizuno_loss.png');
  assert.equal(substitute.path,'assets/Characters/Pro/male_sub_loss.png');
  assert.equal(getCharacterVisualAsset('emiKanzaki','win',{
    proCircuit:true,rivalContext:true,playerCharacterId:'emiKanzaki',
  }).path,'assets/Characters/Pro/female_sub_win.png');
});

test('the four generic circuit portraits use the Pro originals', () => {
  for (let i=1;i<=4;i++) {
    const a=getProCircuitGenericDriverAsset(i);
    assert.equal(a.path,'assets/Characters/Pro/driver_0'+i+'.png');
    assert.ok(fileExists(a.path),a.path+' missing');
  }
  assert.equal(getProCircuitGenericDriverAsset(5),null);
});

test('every Drag Complex visual entry point requests Pro art', () => {
  const central=getText('src/scenes/CentralTokyoScene.js');
  const crew=getText('src/ui/ProCrewBattleLineup.js');
  const driver=getText('src/ui/ProDriverBriefing.js');
  const results=getText('src/ui/ProVictoryResults.js');
  const finish=getText('src/scenes/FourLaneTestScene.js');
  const renderer=getText('src/characters/CharacterProfileRenderer.js');
  const registration=getText('src/ui/CrewRegistrationPanel.js');
  const opening=getText('src/ui/Chapter09EstablishingShot.js');
  assert.match(central,/queueCharacterPose\(id, 'normal', \{ rivalContext: true, proCircuit: true \}/);
  assert.match(central,/proCircuit = this\.activeLocationId === 'tokyoDragComplex'/);
  assert.match(crew,/getCharacterVisualAsset\(u\.id,'idle',\{playerCharacterId:id,proCircuit:true\}\)/);
  assert.match(crew,/playerCharacterId:player,proCircuit:true/);
  assert.match(driver,/getProCircuitGenericDriverAsset\(helmetIndex\)/);
  assert.match(driver,/playerCharacterId:playerId,rivalContext:true,proCircuit:true/);
  assert.match(results,/getCharacterVisualAsset\(id,pose,\{proCircuit:true\}\)/);
  assert.match(finish,/getCharacterVisualAsset\(playerId, pose, \{ proCircuit: true \}\)/);
  assert.match(renderer,/proCircuit: Boolean\(proCircuit\)/);
  assert.match(registration,/playerCharacterId:protagonist,proCircuit:true/);
  assert.match(opening,/playerCharacterId:playerId,proCircuit:true/);
});
