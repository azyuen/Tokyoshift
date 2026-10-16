import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts/street-showdown', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1560, height: 840 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('response', response => {
    if (response.status() >= 400 && /Meet|Characters|Cars/i.test(response.url())) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TOKYO_SHIFT?.scene?.scenes?.length &&
    document.getElementById('loading-label')?.textContent === 'READY',
  null, { timeout: 35000 });

  await page.evaluate(() => {
    const game = window.TOKYO_SHIFT;
    const state = game.registry;
    state.set('devMode', true);
    state.set('wins', 3);
    state.set('cash', 900000);
    state.set('playerCharacterId', 'emiKanzaki');
    state.set('selectedCarId', 'ae86');
    state.set('ownedCarIds', ['ae86']);
    state.set('carStates', { ae86: { stock: true, paintColor: 0xffffff } });
    state.set('meetStranded', false);
    state.set('meetLocation', 'odaiba7eleven');
    state.set('crewMembers', {});
    state.set('competitionOffers', {});
    state.set('competitionCooldownUntil', 0);
    state.set('meetRefreshAt', 0);
    state.set('meetRosters', {});
    state.set('specialChallenger', null);
    state.set('cutscenesSeen', ['competitionIntroduction']);
    for (const scene of game.scene.scenes) {
      if (scene.sys.isActive()) game.scene.stop(scene.sys.settings.key);
    }
    game.scene.start('MeetScene');
  });

  await page.waitForFunction(() => {
    const s = window.TOKYO_SHIFT?.scene?.getScene('MeetScene');
    return s?.sys.isActive() && s.currentBackground &&
      s.offers?.length === 3 &&
      document.getElementById('loading-label')?.textContent === 'READY';
  }, null, { timeout: 50000 });

  // Initial region discovery is independent of this UI regression.
  await page.evaluate(() => {
    const scene = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    if (scene._mangaCutscene?.active) scene._mangaCutscene.skip();
  });
  await page.waitForTimeout(650);
  await page.evaluate(() => {
    const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    if (s._mangaCutscene?.active) s._mangaCutscene.skip();
  });
  await page.waitForTimeout(350);

  const opening = await page.evaluate(() => {
    const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    if (s._mangaCutscene?.active) s._mangaCutscene.skip();
    return {
      active: s.sys.isActive(),
      hasCar: s.hasCar,
      selected: s.registry.get('selectedCarId'),
      wins: s.registry.get('wins'),
      cooldown: s.getCompetitionCooldownRemainingMs(),
      special: s.specialChallengeActive,
      story: Boolean(s._mangaCutscene?.active),
      offers: s.offers?.length,
      background: s.currentBackground?.texture?.key,
    };
  });
  console.log('SHOWDOWN OPEN PRECHECK', JSON.stringify(opening));
  await page.waitForTimeout(280);
  await page.evaluate(() => window.TOKYO_SHIFT.scene.getScene('MeetScene')
    .showCompetitionPopup(true));
  try {
    await page.waitForFunction(() => {
      const s = window.TOKYO_SHIFT?.scene?.getScene('MeetScene');
      return Boolean(s?.competitionPopup?.active);
    }, null, { timeout: 16000 });
  } catch (error) {
    console.error('SHOWDOWN OPEN FAILED', JSON.stringify(await page.evaluate(() => {
      const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
      const offer = s.getCompetitionOffer();
      return {
        active: s.sys.isActive(), hasCar: s.hasCar, cooldown: s.getCompetitionCooldownRemainingMs(),
        special: s.specialChallengeActive, story: Boolean(s._mangaCutscene?.active),
        pending: Boolean(s._mangaCutscene?.pending),
        offerId: offer?.id, valid: s.isCompetitionOfferRosterValid(offer),
        roundCount: offer?.rounds?.length, loading: document.getElementById('loading-label')?.textContent,
        errors: (s.load?.list?.size || 0),
      };
    })), errors);
    await page.screenshot({path:'artifacts/street-showdown/failed-open.png'});
    throw error;
  }

  const read = () => page.evaluate(() => {
    const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    const offer = s.getCompetitionOffer();
    const texts = s.children.list
      .filter(obj => obj?.active && typeof obj.text === 'string' && obj.depth >= 200)
      .map(obj => obj.text);
    return {
      active: Boolean(s.competitionPopup?.active),
      selected: s.competitionPopup?.previewIndex,
      opponents: offer.rounds.map(x => x.characterId),
      cars: offer.rounds.map(x => x.carId),
      originalRivals: (s.offers || []).map(x => x.characterId),
      texts,
      cash: s.registry.get('cash'),
      entryFee: offer.entryFee,
    };
  });

  let before = await read();
  assert.equal(before.active, true);
  assert.equal(before.opponents.length, 3);
  assert.equal(new Set(before.opponents).size, 3);
  for (const label of ['STREET SHOWDOWN', 'RIVALS IN THE SHOWDOWN',
    'THREE RIVALS', 'YOUR CAR', 'WIN ALL 3 HEATS', 'BACK TO MEET', 'PRIZE',
    'ENTER  //']) {
    assert.ok(before.texts.some(t => t.includes(label)), 'missing UI: ' + label);
  }
  assert.ok(!before.texts.some(t => t.includes('SKYTREE\\nPLAZA')));
  assert.ok(!before.texts.some(t => t.includes('SHOWDOWN LOCATION')));
  await page.screenshot({ path: 'artifacts/street-showdown/three-rivals.png' });

  await page.evaluate(() => {
    window.TOKYO_SHIFT.scene.getScene('MeetScene').competitionPopup.select(2);
  });
  const selected = await read();
  assert.equal(selected.selected, 2);
  assert.deepEqual(selected.opponents, before.opponents,
    'previews cannot change the three-race Showdown lineup');
  assert.deepEqual(selected.cars, before.cars);
  assert.deepEqual(selected.originalRivals, before.originalRivals,
    'preview must not reroll the ordinary three single-race opponents');

  await page.evaluate(() => window.TOKYO_SHIFT.scene.getScene('MeetScene')
    .competitionPopup.close());
  const closed = await page.evaluate(() =>
    window.TOKYO_SHIFT.scene.getScene('MeetScene').competitionPopup);
  assert.equal(closed, null);

  // Recruiting one of the previously advertised non-leader opponents makes
  // that SAVED offer ineligible. The next invitation has fresh opponents.
  const removedCharacter = await page.evaluate(() => {
    const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    const offer = s.getCompetitionOffer();
    const recruitId = offer.rounds.map(x => x.characterId)
      .find(id => !['emiKanzaki'].includes(id));
    s.registry.set('crewMembers', {
      ODAIBA: { characterId: recruitId, baseCarId: '240z' },
    });
    return recruitId;
  });
  const updated = await page.evaluate(() => {
    const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    const offer = s.getCompetitionOffer();
    return offer?.rounds?.map(x => x.characterId) || [];
  });
  assert.equal(updated.length, 3);
  assert.ok(!updated.includes(removedCharacter),
    'a newly recruited driver cannot persist in a saved Showdown');

  await page.evaluate(() => window.TOKYO_SHIFT.scene.getScene('MeetScene')
    .showCompetitionPopup(true));
  await page.waitForFunction(() =>
    Boolean(window.TOKYO_SHIFT?.scene?.getScene('MeetScene')?.competitionPopup?.active),
  null, { timeout: 45000 });
  const second = await read();
  assert.ok(!second.opponents.includes(removedCharacter));
  await page.screenshot({ path: 'artifacts/street-showdown/after-recruitment.png' });

  // Click the actual green ENTER action; a preview must never deduct money.
  assert.equal(second.cash, before.cash);
  const ui = await page.evaluate(() => {
    const s = window.TOKYO_SHIFT.scene.getScene('MeetScene');
    const canvas = document.querySelector('canvas');
    const rect = canvas?.getBoundingClientRect();
    return {
      rect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      gameSize: { width: s.scale.width, height: s.scale.height },
      buttons: s.children.list.filter(x => x?.active && x?.input?.enabled && x?.depth >= 200)
        .map(x => ({ type: x.type, x: x.x, y: x.y, w: x.width, h: x.height, depth: x.depth })),
      overlayActive: s.competitionPopup?.active,
      storyActive: Boolean(s._mangaCutscene?.active),
    };
  });
  console.log('SHOWDOWN INPUT DIAGNOSTIC', JSON.stringify(ui));
  const rect = ui.rect;
  await page.mouse.click(rect.x + 1358 * rect.width / 1560,
    rect.y + 706 * rect.height / 840);
  await page.waitForTimeout(750);
  console.log('SHOWDOWN AFTER CLICK', JSON.stringify(await page.evaluate(() => {
    const game = window.TOKYO_SHIFT;
    const s = game.scene.getScene('MeetScene');
    return {
      overlay: Boolean(s.competitionPopup?.active),
      state: game.registry.get('competitionState'),
      category: game.registry.get('selectedRaceCategory'),
      cash: game.registry.get('cash'),
      pointer: {x:s.input.activePointer?.x,y:s.input.activePointer?.y},
      activeScenes: game.scene.scenes.filter(x => x.sys.isActive()).map(x => x.sys.settings.key),
    };
  })));
  await page.waitForFunction(() => {
    const registry = window.TOKYO_SHIFT?.registry;
    return registry?.get('competitionState')?.active &&
      registry?.get('selectedRaceCategory') === 'COMPETITION';
  }, null, { timeout: 7000 });
  const result = await page.evaluate(() => {
    const registry = window.TOKYO_SHIFT.registry;
    return {
      cash: registry.get('cash'),
      category: registry.get('selectedRaceCategory'),
      roundIndex: registry.get('competitionState')?.roundIndex,
      opponents: registry.get('competitionState')?.rounds?.map(r => r.characterId),
    };
  });
  assert.equal(result.cash, second.cash - second.entryFee,
    'the entry fee is charged exactly once on accepting');
  assert.equal(result.roundIndex, 0);
  assert.deepEqual(result.opponents, second.opponents,
    'the accepted opponent lineup must be the exact previewed lineup');
  assert.deepEqual(errors, []);
  console.log('STREET SHOWDOWN BROWSER PASSED', JSON.stringify(result));
  await page.close();
} catch (error) {
  console.error('STREET SHOWDOWN BROWSER ERROR', error);
  throw error;
} finally {
  await browser.close();
}
