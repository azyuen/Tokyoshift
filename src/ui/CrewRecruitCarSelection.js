// Crew recruitment car selection: one manga-style dialogue with symmetrical
// player/crew car bays. This intentionally does not replace the preceding
// crew-recruitment manga invitation or its signature-car reveal.
import { cars } from '../data/cars.js';
import { getWorkshopPhaseBackground } from '../data/workshopProgression.js';
import { getMeetBackgroundForPhase } from '../data/meetAssets.js';
import {
  getCarBodyTextureKey, preloadCarAppearanceAssets, preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const DEPTH = 900;
const GOLD = 0xeac36d;
const BAYS = Object.freeze([
  { x: 53, y: 104, w: 714, h: 492, center: 410, side: 'player' },
  { x: 793, y: 104, w: 714, h: 492, center: 1150, side: 'crew' },
]);

export function showCrewRecruitCarSelection(scene, {
  challenge, eligibleCarIds = [], recruitRules = {},
  onRace = () => {}, onLater = () => {},
} = {}) {
  if (!scene || scene._crewRecruitPicker?.active) return null;
  const carIds = eligibleCarIds.filter(id => Boolean(cars[id]));
  const carStates = scene.registry.get('carStates') || {};
  const locations = scene.registry.get('carGarageLocations') || {};
  const phase = scene.worldPhase || 'night';
  let chosen = Math.max(0, carIds.indexOf(scene.registry.get('selectedCarId')));
  let closed = false;
  const owned = [];
  const carParts = [];
  const backdrops = [];
  const tweens = [];
  const masks = [];
  const hints = [];
  const add = item => { if (item) owned.push(item); return item; };
  const text = (x, y, value, size, color, depth, extra = {}) =>
    add(scene.add.text(x, y, value, {
      fontFamily: extra.body ? BODY : PIXEL,
      fontSize: size,
      color,
      align: extra.align || 'left',
      fontStyle: extra.body ? '700' : 'normal',
      lineSpacing: extra.lineSpacing ?? 5,
      wordWrap: { width: extra.wrap || 600 },
    }).setScrollFactor(0).setDepth(depth));

  const picker = { active: true, close: null, select: null };
  scene._crewRecruitPicker = picker;
  const destroyParts = list => {
    list.splice(0).forEach(obj => {
      try { scene.tweens.killTweensOf(obj); } catch (_) {}
      try { obj.clearMask?.(false); } catch (_) {}
      try { obj.destroy?.(); } catch (_) {}
    });
  };
  const cleanup = () => {
    if (closed) return;
    closed = true;
    picker.active = false;
    if (scene._crewRecruitPicker === picker) scene._crewRecruitPicker = null;
    scene.events?.off?.(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    destroyParts(carParts);
    destroyParts(backdrops);
    tweens.forEach(t => { try { t?.stop?.(); } catch (_) {} });
    tweens.length = 0;
    destroyParts(hints);
    masks.splice(0).forEach(maskShape => { try { maskShape.destroy(); } catch (_) {} });
    destroyParts(owned);
  };
  picker.close = cleanup;
  scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  add(scene.add.rectangle(780, 420, 1560, 840, 0x050709, 0.82)
    .setScrollFactor(0).setDepth(DEPTH).setInteractive());

  function makeMask(bay) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(bay.x + 7, bay.y + 7, bay.w - 14, bay.h - 14);
    masks.push(g);
    return g.createGeometryMask();
  }
  const bayMasks = BAYS.map(makeMask);

  function background(bay, key, mask) {
    if (!key || !scene.textures.exists(key)) return false;
    const source = scene.textures.get(key).getSourceImage();
    const width = Number(source.width || source.naturalWidth || 1);
    const height = Number(source.height || source.naturalHeight || 1);
    const img = scene.add.image(bay.center, bay.y + bay.h / 2, key)
      .setScale(Math.max((bay.w - 14) / width, (bay.h - 14) / height))
      .setScrollFactor(0).setDepth(DEPTH + 3).setMask(mask);
    backdrops.push(img);
    return true;
  }
  const renderBackdrop = (bay, key, mask, road = false) => {
    if (!background(bay, key, mask)) {
      const fallback = scene.add.rectangle(bay.center, bay.y + bay.h / 2,
        bay.w - 14, bay.h - 14, road ? 0x253844 : 0x222c36, 1)
        .setScrollFactor(0).setDepth(DEPTH + 3);
      backdrops.push(fallback);
    }
    if (road) {
      // Match the racing-bay treatment from the invitation: skyline, guardrail,
      // then a shallow asphalt band reaching about halfway up the tyres.
      const roadY = bay.y + bay.h - 99;
      backdrops.push(scene.add.rectangle(bay.center, roadY + 62,
        bay.w - 14, 124, 0x555c62, 0.98).setDepth(DEPTH + 5).setScrollFactor(0));
      backdrops.push(scene.add.rectangle(bay.center, roadY - 10,
        bay.w - 14, 14, 0xb5bbc1, 0.98).setDepth(DEPTH + 6).setScrollFactor(0));
      backdrops.push(scene.add.rectangle(bay.center, roadY + 8,
        bay.w - 14, 10, 0x6d7780, 0.98).setDepth(DEPTH + 6).setScrollFactor(0));
      backdrops.push(scene.add.rectangle(bay.center, roadY + 116,
        bay.w - 14, 4, 0xb7bab4, 0.75).setDepth(DEPTH + 6).setScrollFactor(0));
    }
  };

  const workshopFor = carId => {
    const locationId = locations[carId] ||
      scene.registry.get('workshopLocationId') || 'shinonomeWorkshop';
    return getWorkshopPhaseBackground(locationId, phase);
  };
  const recruitBg = getMeetBackgroundForPhase(scene.selectedMeetLocation, phase);
  renderBackdrop(BAYS[1], recruitBg?.key, bayMasks[1], true);

  function queueMissingCar(car, redraw) {
    if (!car) return;
    const body = getCarBodyTextureKey(scene, car);
    if (body && scene.textures.exists(body) &&
        car.visual?.wheelKey && scene.textures.exists(car.visual.wheelKey)) {
      return;
    }
    const queued = preloadCarAppearanceAssets(scene, { [car.id]: car }, '20261016-r537');
    const wheels = preloadCarWheel(scene, car);
    if (queued + wheels <= 0) return;
    const onReady = () => {
      if (!picker.active || !scene.sys?.isActive?.()) return;
      try { ensureDerivedModularCarTextures(scene, { [car.id]: car }); } catch (_) {}
      redraw();
    };
    scene.load.once(Phaser.Loader.Events.COMPLETE, onReady);
    if (!scene.load.isLoading()) scene.load.start();
  }

  function placeCar(carId, bay, mask, spinning = false) {
    const car = cars[carId];
    if (!car) return false;
    try { ensureDerivedModularCarTextures(scene, { [carId]: car }); } catch (_) {}
    const key = getCarBodyTextureKey(scene, car);
    if (!key || !scene.textures.exists(key) || !scene.textures.exists(car.visual?.wheelKey))
      return false;
    try {
      const parts = scene.createCarDisplay(
        car, bay.center + 2, bay.y + 247, 585, DEPTH + 13, false,
        carStates[carId]?.paintColor ?? 0xffffff
      );
      parts.forEach(obj => {
        obj.setScrollFactor?.(0);
        obj.setMask?.(mask);
        carParts.push(obj);
      });
      if (spinning) {
        // createCarDisplay returns wheel images at positions 3 and 4.
        [parts[3], parts[4]].forEach(wheel => {
          if (!wheel) return;
          tweens.push(scene.tweens.add({
            targets: wheel, angle: '-=360', duration: 640,
            repeat: -1, ease: 'Linear',
          }));
        });
      }
      return true;
    } catch (error) {
      console.warn('[TOKYO SHIFT] Crew picker car rendering failed', error);
      return false;
    }
  }

  const crewBay = BAYS[1], playerBay = BAYS[0];
  const recruitName = String(cars[challenge.baseCarId]?.shortName ||
    cars[challenge.baseCarId]?.name || challenge.baseCarId || 'UNKNOWN').toUpperCase();
  if (!placeCar(challenge.baseCarId, crewBay, bayMasks[1], true))
    queueMissingCar(cars[challenge.baseCarId], () => {
      if (picker.active) placeCar(challenge.baseCarId, crewBay, bayMasks[1], true);
    });

  const playerName = text(playerBay.center, playerBay.y + 59, '',
    '10px', '#ffffff', DEPTH + 31,
    { align: 'center', wrap: playerBay.w - 50 }).setOrigin(0.5);
  const counter = text(playerBay.center, playerBay.y + playerBay.h - 34, '',
    '8px', '#ffffff', DEPTH + 32, { align: 'center' }).setOrigin(0.5);
  const noCar = text(playerBay.center, playerBay.y + 230, '',
    '13px', '#ffffff', DEPTH + 26,
    { align: 'center', wrap: playerBay.w - 100 }).setOrigin(0.5);
  let playerBackgroundObjects = [];
  let playerCarObjects = [];
  let playerHeading = null;
  function redrawPlayer() {
    const current = carIds[chosen];
    // Destroy only the player-side sprites. The opponent car and its spinning
    // wheels stay alive while scrolling garage choices.
    playerCarObjects.forEach(obj => {
      try { obj.clearMask?.(false); obj.destroy?.(); } catch (_) {}
      const idx = carParts.indexOf(obj);
      if (idx >= 0) carParts.splice(idx, 1);
    });
    playerCarObjects = [];
    playerBackgroundObjects.forEach(obj => {
      try { obj.clearMask?.(false); obj.destroy?.(); } catch (_) {}
      const idx = backdrops.indexOf(obj);
      if (idx >= 0) backdrops.splice(idx, 1);
    });
    playerBackgroundObjects = [];
    if (!current) {
      playerHeading?.setText('NO ELIGIBLE CAR');
      playerName.setText('ACQUIRE ONE AND TRY AGAIN LATER');
      counter.setText('');
      noCar.setText('');
      return;
    }
    playerHeading?.setText('YOUR STOCK CAR');
    noCar.setText('');
    const bg = workshopFor(current);
    const bgStart = backdrops.length;
    renderBackdrop(playerBay, bg?.key, bayMasks[0], false);
    playerBackgroundObjects = backdrops.slice(bgStart);
    const assetStart = carParts.length;
    const drawn = placeCar(current, playerBay, bayMasks[0], false);
    playerCarObjects = carParts.slice(assetStart);
    if (!drawn) {
      noCar.setText('LOADING GARAGE CAR...');
      queueMissingCar(cars[current], () => {
        if (picker.active && carIds[chosen] === current) redrawPlayer();
      });
    }
    playerName.setText(String(cars[current]?.shortName || cars[current]?.name || current).toUpperCase());
    counter.setText(String(chosen + 1).padStart(2, '0') +
      ' / ' + String(carIds.length).padStart(2, '0') +
      '   //   ' + String(bg?.key?.includes('Warehouse') ? 'WAREHOUSE HQ'
        : bg?.key?.includes('CanalYard') ? 'CANAL YARD' : 'HOME WORKSHOP'));
  }

  // Thick result-screen black frames, matching title strips, and equal bays.
  BAYS.forEach((bay, i) => {
    add(scene.add.rectangle(bay.center, bay.y + bay.h / 2, bay.w, bay.h,
      0x000000, 0).setStrokeStyle(9, 0x111111, 1)
      .setScrollFactor(0).setDepth(DEPTH + 29));
    add(scene.add.rectangle(bay.center, bay.y + 43, bay.w - 12, 74,
      0x111111, 1).setScrollFactor(0).setDepth(DEPTH + 30));
    const heading = text(bay.x + 25, bay.y + 14,
      i === 0 ? 'YOUR STOCK CAR' : 'SIGNATURE CAR',
      '10px', '#eac36d', DEPTH + 32);
    if (i === 0) playerHeading = heading;
  });
  text(crewBay.center, crewBay.y + 59, recruitName,
    '10px', '#ffffff', DEPTH + 32, { align: 'center', wrap: crewBay.w - 50 })
    .setOrigin(0.5);
  const previous = carIds.length > 1
    ? add(scene.add.rectangle(playerBay.x + 39, playerBay.y + 285, 55, 59,
        0x111111, 0.93).setStrokeStyle(2, GOLD).setDepth(DEPTH + 33)
      .setScrollFactor(0).setInteractive({ useHandCursor: true })) : null;
  const next = carIds.length > 1
    ? add(scene.add.rectangle(playerBay.x + playerBay.w - 39, playerBay.y + 285, 55, 59,
        0x111111, 0.93).setStrokeStyle(2, GOLD).setDepth(DEPTH + 33)
      .setScrollFactor(0).setInteractive({ useHandCursor: true })) : null;
  if (previous) text(playerBay.x + 39, playerBay.y + 285, '<', '18px',
    '#ffffff', DEPTH + 34).setOrigin(0.5);
  if (next) text(playerBay.x + playerBay.w - 39, playerBay.y + 285, '>',
    '18px', '#ffffff', DEPTH + 34).setOrigin(0.5);
  const cycle = offset => {
    if (!carIds.length || closed) return;
    chosen = (chosen + offset + carIds.length) % carIds.length;
    redrawPlayer();
  };
  previous?.on('pointerdown', () => cycle(-1));
  next?.on('pointerdown', () => cycle(1));
  picker.select = cycle;
  redrawPlayer();

  // Retain the actual manga dialogue proportions and white speech background,
  // but replace character speech with instructions and the two decisions.
  add(scene.add.rectangle(780, 718, 1290, 175, 0xfffcf1, 1)
    .setStrokeStyle(6, 0x111111, 1)
    .setDepth(DEPTH + 40).setScrollFactor(0));
  add(scene.add.rectangle(343, 613, 445, 47, 0x111111, 1)
    .setDepth(DEPTH + 41).setScrollFactor(0));
  text(145, 613, 'CHOOSE A CAR TO RACE', '11px', '#ffffff', DEPTH + 42)
    .setOrigin(0, 0.5);
  const instruction = 'You can only race an unmodified stock car of the same class. ' +
    'Choose one from your garage, or acquire one and come back later.';
  text(177, 660, instruction, '18px', '#111111',
    DEPTH + 42, { body: true, wrap: 1190 });

  const buttonY = 776;
  const later = add(scene.add.rectangle(904, buttonY, 235, 46, 0xfffcf1, 1)
    .setStrokeStyle(3, 0x111111, 1)
    .setDepth(DEPTH + 43).setScrollFactor(0).setInteractive({ useHandCursor: true }));
  text(904, buttonY, 'RACE LATER', '9px', '#111111', DEPTH + 44).setOrigin(0.5);
  later.on('pointerdown', () => { cleanup(); onLater(); });
  const ready = add(scene.add.rectangle(1173, buttonY, 280, 46,
    carIds.length ? 0x111111 : 0x555555, 1)
    .setStrokeStyle(3, carIds.length ? 0x111111 : 0x777777, 1)
    .setDepth(DEPTH + 43).setScrollFactor(0));
  text(1173, buttonY, 'READY TO RACE', '9px',
    carIds.length ? '#ffffff' : '#d8d8d8', DEPTH + 44).setOrigin(0.5);
  if (carIds.length) {
    ready.setInteractive({ useHandCursor: true }).once('pointerdown', () => {
      const selectedId = carIds[chosen];
      if (!selectedId || closed) return;
      // Race setup revalidates stock/class eligibility against current state.
      cleanup();
      onRace(selectedId);
    });
  }

  // Fade this entire decision page in like the preceding manga scene.
  // The black frame/text layers are separately placed for stable event hitboxes.
  const fadeIn = [...owned, ...carParts, ...backdrops].filter(Boolean);
  fadeIn.forEach(obj => obj.setAlpha?.(0));
  tweens.push(scene.tweens.add({
    targets: fadeIn, alpha: 1, duration: 245, ease: 'Sine.easeOut',
  }));
  return picker;
}
