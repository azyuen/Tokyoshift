import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts/oshiage', { recursive: true });
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({ viewport: { width: 1560, height: 840 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('response', response => {
    if (response.status() >= 400 && /Oshiage|oshiage|Characters/.test(response.url())) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  await page.goto('http://127.0.0.1:8765/', {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => {
    const game = window.TOKYO_SHIFT;
    const canvas = document.querySelector('canvas');
    return Boolean(game?.scene?.scenes?.length && canvas &&
      document.body.dataset.scene &&
      document.getElementById('loading-label')?.textContent === 'READY');
  }, null, {timeout: 30000});
  console.log('GAME READY FOR OSHIAGE', JSON.stringify(await page.evaluate(() => ({
    scenes: window.TOKYO_SHIFT.scene.scenes.filter(s => s.sys.isActive())
      .map(s => s.sys.settings.key),
    bodyScene: document.body.dataset.scene,
    canvas: Boolean(document.querySelector('canvas')),
  }))));
  await page.evaluate(() => {
    const game = window.TOKYO_SHIFT;
    const registry = game.registry;
    registry.set('devMode', true);
    registry.set('wins', 140);
    registry.set('cash', 900000);
    registry.set('playerCharacterId', 'emiKanzaki');
    registry.set('selectedCarId', 'ae86');
    registry.set('ownedCarIds', ['ae86']);
    registry.set('carStates', { ae86: { paintColor: 0xe84b52 } });
    registry.set('crewMembers', {});
    registry.set('oshiageEliteSeries', null);
    registry.set('oshiageEliteCooldowns', {});
    registry.set('oshiageEliteVenue', 'underpass');
    for (const scene of game.scene.scenes) {
      if (scene.sys.isActive()) game.scene.stop(scene.sys.settings.key);
    }
    game.scene.start('OshiageScene', { locationId: 'oshiageSkytreeMeet' });
  });

  const read = () => page.evaluate(() => {
    const s = window.TOKYO_SHIFT?.scene?.getScene('OshiageScene');
    const allText = (s?.content || []).filter(o => typeof o?.text === 'string')
      .map(o => o.text);
    return {
      active: Boolean(s?.sys.isActive()),
      background: s?.backgroundAsset()?.key || '',
      lineup: s?.getEliteLineup(s?.meetAlternative ? 'plaza' : 'underpass')
        .map(o => o.characterId) || [],
      previewIndex: s?.showdownPreviewIndex ?? -1,
      switching: Boolean(s?.showdownSwitching),
      text: allText,
    };
  });

  try {
    await page.waitForFunction(() => {
      const scene = window.TOKYO_SHIFT?.scene?.getScene('OshiageScene');
      return scene?.sys.isActive() &&
        (scene.content || []).some(o =>
          typeof o?.text === 'string' && o.text.includes('RIVALS IN THE SHOWDOWN'));
    }, null, { timeout: 30000 });
  } catch (error) {
    console.error('OSHIAGE SCENE DIAGNOSTICS', JSON.stringify(await page.evaluate(() => {
      const game = window.TOKYO_SHIFT;
      const scene = game?.scene?.getScene('OshiageScene');
      return {
        bodyScene: document.body.dataset.scene,
        activeScenes: game?.scene?.scenes.filter(s => s.sys.isActive())
          .map(s => s.sys.settings.key),
        sceneActive: scene?.sys.isActive(),
        location: scene?.activeLocationId,
        progress: scene?.registry && scene.registry.get('devMode'),
        sceneTexts: scene?.content?.filter(o => typeof o?.text === 'string')
          .map(o => o.text).slice(0, 40),
        missingTextures: scene?.textures?.getTextureKeys?.().length,
        splash: document.getElementById('loading-label')?.textContent,
        bootError: document.getElementById('loading-screen')?.dataset.bootError,
      };
    })), 'errors:', errors);
    await page.screenshot({path:'artifacts/oshiage/failed-scene-r522.png'});
    throw error;
  }
  const first = await read();
  assert.equal(first.active, true);
  assert.equal(first.lineup.length, 3);
  assert.equal(new Set(first.lineup).size, 3);
  for (const name of ['SHOWDOWN LOCATION','YOUR CAR','THREE ELITE RIVALS',
    'RIVALS IN THE SHOWDOWN','SKYTREE','WIN ALL 3 HEATS']) {
    assert.ok(first.text.some(t => t.includes(name)), 'missing Meet control: ' + name);
  }
  assert.ok(first.text.some(t => t.includes('ENTER  //')), 'must have green challenge action');
  assert.ok(first.background.includes('oshiage_skytree01'));
  await page.screenshot({path:'artifacts/oshiage/underpass-r522.png'});

  await page.evaluate(() => window.TOKYO_SHIFT.scene.getScene('OshiageScene').selectShowdownDriver(1));
  await page.waitForFunction(() => {
    const s = window.TOKYO_SHIFT?.scene?.getScene('OshiageScene');
    return s?.showdownPreviewIndex === 1 && !s.showdownSwitching;
  },null,{timeout:7000});
  const second = await read();
  assert.equal(second.previewIndex, 1);
  assert.deepEqual(second.lineup, first.lineup, 'preview must not reshuffle showdown order');

  await page.evaluate(() => window.TOKYO_SHIFT.scene.getScene('OshiageScene').selectEliteVenue('plaza'));
  await page.waitForFunction(() => {
    const s = window.TOKYO_SHIFT?.scene?.getScene('OshiageScene');
    return s?.meetAlternative && s?.backgroundAsset()?.key?.includes('skytree02') &&
      (s.content || []).some(o => typeof o?.text === 'string' && o.text.includes('RIVALS IN THE SHOWDOWN')) &&
      (s.content || []).some(o => typeof o?.text === 'string' && o.text.includes('250,000'));
  },null,{timeout:30000});
  const plaza = await read();
  assert.equal(plaza.lineup.length, 3);
  assert.ok(plaza.background.includes('oshiage_skytree02'));
  assert.ok(plaza.text.some(t => t.includes('250,000')));
  await page.screenshot({path:'artifacts/oshiage/plaza-r522.png'});
  assert.deepEqual(errors, []);
  console.log('OSHIAGE LIVE SCENE PASSED', JSON.stringify({
    underpassRivals:first.lineup, plazaRivals:plaza.lineup,
    clickedRival:second.previewIndex,
    scenes:[first.background,plaza.background],
  }));
  await page.close();
} finally { await browser.close(); }
